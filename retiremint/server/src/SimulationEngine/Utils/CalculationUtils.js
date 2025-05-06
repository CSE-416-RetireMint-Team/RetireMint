/**
 * CalculationUtils.js - Shared utility functions for simulation calculations.
 */

// Mulberry32 PRNG: Creates a seeded random number generator function.
function mulberry32(seed) {
  return function() {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Helper function to sample from a normal distribution using Box-Muller transform
// Accepts an optional seeded RNG function (prng)
function sampleNormal(mean, stdDev, prng = Math.random) { // Default to Math.random
  let u1 = 0, u2 = 0;
  // Convert [0,1) to (0,1) using the provided RNG
  while(u1 === 0) u1 = prng(); 
  while(u2 === 0) u2 = prng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  // Ensure mean and stdDev are numbers, default if not
  const numMean = typeof mean === 'number' ? mean : 0;
  const numStdDev = typeof stdDev === 'number' ? stdDev : 0;
  if (numStdDev < 0) { 
      console.warn('Sampling normal with negative standard deviation. Using 0.');
      return numMean; 
  }
  return z0 * numStdDev + numMean;
}

// Helper function to sample from a uniform distribution
// Accepts an optional seeded RNG function (prng)
function sampleUniform(min, max, prng = Math.random) { // Default to Math.random
    // Ensure min and max are numbers, default if not
    const numMin = typeof min === 'number' ? min : 0;
    const numMax = typeof max === 'number' ? max : 0;
    if (numMin > numMax) { 
        console.warn(`Sampling uniform with min (${numMin}) > max (${numMax}). Returning min.`);
        return numMin; 
    }
    return prng() * (numMax - numMin) + numMin; // Use the provided RNG
}

/**
 * Calculates the *uninflated base amount* for the current year for income/expense events.
 * Applies the specified annual change method to the previous year's *uninflated base amount*.
 * @param {Object} changeConfig - The expectedAnnualChange configuration object from the event.
 * @param {number} previousBaseAmount - The uninflated base income/expense amount from the previous year.
 * @param {Function} [prng=Math.random] - Optional seeded random number generator.
 * @returns {number} - The calculated uninflated base amount for the current year.
 */
function calculateCurrentBaseAmount(changeConfig, previousBaseAmount, prng = Math.random) {
  if (!changeConfig || !changeConfig.method) {
    return previousBaseAmount; // No change defined, carry forward previous base
  }

  const method = changeConfig.method;
  // Default previousBaseAmount to 0 if null/undefined
  const prevBaseAmountNum = typeof previousBaseAmount === 'number' ? previousBaseAmount : 0;

  switch (method) {
    case 'fixedValue':
      // Adds a fixed value change (assumed to be in base year dollars) each year
      const changeVal = typeof changeConfig.fixedValue === 'number' ? changeConfig.fixedValue : 0;
      return prevBaseAmountNum + changeVal;

    case 'fixedPercentage':
      const percentChange = (typeof changeConfig.fixedPercentage === 'number' ? changeConfig.fixedPercentage : 0) / 100;
      return prevBaseAmountNum * (1 + percentChange);

    case 'normalValue':
       // Adds a normally distributed value change (assumed base year dollars)
       const meanVal = changeConfig.normalValue?.mean;
       const sdVal = changeConfig.normalValue?.sd;
       const sampledValueChange = sampleNormal(meanVal, sdVal, prng); // Pass prng
       return prevBaseAmountNum + sampledValueChange;

    case 'normalPercentage':
      const meanPercent = changeConfig.normalPercentage?.mean;
      const sdPercent = changeConfig.normalPercentage?.sd;
       // Sample the rate directly (mean/sd are likely percentage points)
      const sampledPercentRate = sampleNormal(meanPercent / 100, sdPercent / 100, prng); // Pass prng
      return prevBaseAmountNum * (1 + sampledPercentRate);

    case 'uniformValue':
        // Adds a uniformly distributed value change (assumed base year dollars)
        const lowerVal = changeConfig.uniformValue?.lowerBound;
        const upperVal = changeConfig.uniformValue?.upperBound;
        const sampledUniformVal = sampleUniform(lowerVal, upperVal, prng); // Pass prng
        return prevBaseAmountNum + sampledUniformVal;

    case 'uniformPercentage':
      const lowerPercent = changeConfig.uniformPercentage?.lowerBound;
      const upperPercent = changeConfig.uniformPercentage?.upperBound;
       // Sample the rate directly (bounds are likely percentage points)
      const sampledUniformRate = sampleUniform(lowerPercent / 100, upperPercent / 100, prng); // Pass prng
      return prevBaseAmountNum * (1 + sampledUniformRate);

    default:
      console.warn(`Unsupported expectedAnnualChange method: ${method}`);
      return prevBaseAmountNum; // No change if method is unknown
  }
}


module.exports = {
    sampleNormal,
    sampleUniform,
    calculateCurrentBaseAmount,
    mulberry32 // Export the PRNG generator
}; 