/**
 * CalculationUtils.js - Shared utility functions for simulation calculations.
 */

// Helper function to sample from a normal distribution using Box-Muller transform
function sampleNormal(mean, stdDev) {
  let u1 = 0, u2 = 0;
  // Convert [0,1) to (0,1)
  while(u1 === 0) u1 = Math.random(); 
  while(u2 === 0) u2 = Math.random();
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
function sampleUniform(min, max) {
    // Ensure min and max are numbers, default if not
    const numMin = typeof min === 'number' ? min : 0;
    const numMax = typeof max === 'number' ? max : 0;
    if (numMin > numMax) { 
        console.warn(`Sampling uniform with min (${numMin}) > max (${numMax}). Returning min.`);
        return numMin; 
    }
    return Math.random() * (numMax - numMin) + numMin;
}

/**
 * Calculates the *uninflated base amount* for the current year for income/expense events.
 * Applies the specified annual change method to the previous year's *uninflated base amount*.
 * @param {Object} changeConfig - The expectedAnnualChange configuration object from the event.
 * @param {number} previousBaseAmount - The uninflated base income/expense amount from the previous year.
 * @returns {number} - The calculated uninflated base amount for the current year.
 */
function calculateCurrentBaseAmount(changeConfig, previousBaseAmount) {
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
       const sampledValueChange = sampleNormal(meanVal, sdVal);
       return prevBaseAmountNum + sampledValueChange;

    case 'normalPercentage':
      const meanPercent = changeConfig.normalPercentage?.mean;
      const sdPercent = changeConfig.normalPercentage?.sd;
       // Sample the rate directly (mean/sd are likely percentage points)
      const sampledPercentRate = sampleNormal(meanPercent / 100, sdPercent / 100); 
      return prevBaseAmountNum * (1 + sampledPercentRate);

    case 'uniformValue':
        // Adds a uniformly distributed value change (assumed base year dollars)
        const lowerVal = changeConfig.uniformValue?.lowerBound;
        const upperVal = changeConfig.uniformValue?.upperBound;
        const sampledUniformVal = sampleUniform(lowerVal, upperVal);
        return prevBaseAmountNum + sampledUniformVal;

    case 'uniformPercentage':
      const lowerPercent = changeConfig.uniformPercentage?.lowerBound;
      const upperPercent = changeConfig.uniformPercentage?.upperBound;
       // Sample the rate directly (bounds are likely percentage points)
      const sampledUniformRate = sampleUniform(lowerPercent / 100, upperPercent / 100); 
      return prevBaseAmountNum * (1 + sampledUniformRate);

    default:
      console.warn(`Unsupported expectedAnnualChange method: ${method}`);
      return prevBaseAmountNum; // No change if method is unknown
  }
}


module.exports = {
    sampleNormal,
    sampleUniform,
    calculateCurrentBaseAmount
}; 