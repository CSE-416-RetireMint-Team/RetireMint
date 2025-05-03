/**
 * IncomeEvents.js - Module for processing income events in the simulation
 * 
 * This module handles:
 * 1. Calculating the uninflated base income amount for the current year based on the previous year's base and expected annual changes.
 * 2. Adjusting the current base amount for inflation if applicable.
 * 3. Adjusting for marital status.
 * 4. Returning the calculated income totals (cash added, taxable income, SS income) and the *uninflated* base amounts for the next year's calculation.
 */

// Helper function to sample from a normal distribution using Box-Muller transform
function sampleNormal(mean, stdDev) {
  let u1 = 0, u2 = 0;
  while(u1 === 0) u1 = Math.random(); // Convert [0,1) to (0,1)
  while(u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  // Ensure mean and stdDev are numbers, default if not
  const numMean = typeof mean === 'number' ? mean : 0;
  const numStdDev = typeof stdDev === 'number' ? stdDev : 0;
  return z0 * numStdDev + numMean;
}

// Helper function to sample from a uniform distribution
function sampleUniform(min, max) {
    // Ensure min and max are numbers, default if not
    const numMin = typeof min === 'number' ? min : 0;
    const numMax = typeof max === 'number' ? max : 0;
    if (numMin > numMax) return numMin; // Avoid negative range
    return Math.random() * (numMax - numMin) + numMin;
}

/**
 * Calculates the *uninflated base amount* for the current year.
 * Applies the specified annual change method to the previous year's *uninflated base amount*.
 * @param {Object} changeConfig - The expectedAnnualChange configuration object from the event.
 * @param {number} previousBaseAmount - The uninflated base income amount from the previous year for this specific event.
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
      const sampledPercent = sampleNormal(meanPercent, sdPercent) / 100;
      return prevBaseAmountNum * (1 + sampledPercent);

    case 'uniformValue':
        // Adds a uniformly distributed value change (assumed base year dollars)
        const lowerVal = changeConfig.uniformValue?.lowerBound;
        const upperVal = changeConfig.uniformValue?.upperBound;
        const sampledUniformVal = sampleUniform(lowerVal, upperVal);
        return prevBaseAmountNum + sampledUniformVal;

    case 'uniformPercentage':
      const lowerPercent = changeConfig.uniformPercentage?.lowerBound;
      const upperPercent = changeConfig.uniformPercentage?.upperBound;
      const sampledUniformPercent = sampleUniform(lowerPercent, upperPercent) / 100;
      return prevBaseAmountNum * (1 + sampledUniformPercent);

    default:
      console.warn(`Unsupported expectedAnnualChange method: ${method}`);
      return prevBaseAmountNum; // No change if method is unknown
  }
}

/**
 * Run all active income events for the current simulation year.
 * @param {Object} modelData - Contains scenario, taxData, etc.
 * @param {Array<string>} eventsActiveThisYear - Array of active event names for the year.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year (1.0 = base year).
 * @param {Object} previousIncomeEventStates - Map of event states from the previous year { eventName: { baseAmount: number } }.
 * @param {number} initialCash - Cash balance at the start of the year before income.
 * @returns {Object} - { cash: updatedCash, curYearIncome: totalTaxableIncome, curYearSS: totalSSIncome, incomeEventStates: stateForNextYear }
 */
function runIncomeEvents(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousIncomeEventStates = {}, initialCash = 0) {

    let currentCash = initialCash;
    let curYearIncome = 0; // Total income for tax purposes this year
    let curYearSS = 0;     // Total SS income this year
    const currentIncomeEventStates = {}; // Store calculated *base* amounts for *next* year's previous state

    if (!eventsActiveThisYear || eventsActiveThisYear.length === 0) {
        return { cash: currentCash, curYearIncome, curYearSS, incomeEventStates: currentIncomeEventStates };
    }

    const allEvents = modelData.scenario.events;
    const inflationFactorToApply = currentInflationFactor; // Use the cumulative factor

    for (const eventName of eventsActiveThisYear) {
        const event = allEvents.find(e => e.name === eventName);

        // Ensure it's an income event with necessary details
        if (!event || event.type !== 'income' || !event.income || event.income.initialAmount == null) {
            continue; // Skip if not a valid income event
        }

        const incomeDetails = event.income;
        // Get the UNINFLATED base amount from the previous year, or use initialAmount if first time
        const previousState = previousIncomeEventStates[eventName] || null;
        const previousBaseAmount = previousState ? previousState.baseAmount : incomeDetails.initialAmount;

        // a. Calculate the UNINFLATED base amount for the current year
        const currentBaseAmount = calculateCurrentBaseAmount(incomeDetails.expectedAnnualChange, previousBaseAmount);

        // b. Calculate the INFLATED amount for the current year if applicable
        let inflatedCurrentAmount;
        if (incomeDetails.inflationAdjustment) {
            // Adjust the *current base* amount by the *cumulative* inflation factor
            inflatedCurrentAmount = currentBaseAmount * inflationFactorToApply;
        } else {
            // If no inflation adjustment, the amount received is the uninflated base
            inflatedCurrentAmount = currentBaseAmount;
        }

        // c. Adjust for marital status (applied to the inflated amount received this year)
        if (maritalStatusThisYear === 'married') {
            const spousePercentage = (typeof incomeDetails.marriedPercentage === 'number' ? incomeDetails.marriedPercentage : 50);
            // As before, keep total amount for now. Tax module might need split later.
        }

        // d. Add the USER'S PORTION of the INFLATED income amount to cash
        currentCash += inflatedCurrentAmount;

        // e. Update running total curYearIncome (taxable income) with FULL INFLATED amount
        curYearIncome += inflatedCurrentAmount;

        // f. Update running total curYearSS with FULL INFLATED amount if applicable
        if (incomeDetails.isSocialSecurity) {
            curYearSS += inflatedCurrentAmount;
        }

        // Store the UNINFLATED base amount for this event, to be used as 'previousBaseAmount' for the *next* year
        currentIncomeEventStates[eventName] = { baseAmount: currentBaseAmount };
    }

    return {
        cash: currentCash,
        curYearIncome: curYearIncome,
        curYearSS: curYearSS,
        incomeEventStates: currentIncomeEventStates // State for the *next* iteration's previous state
    };
}

module.exports = {
  runIncomeEvents
}; 