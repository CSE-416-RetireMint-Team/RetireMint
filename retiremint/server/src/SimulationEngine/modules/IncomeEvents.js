/**
 * IncomeEvents.js - Module for processing income events in the simulation
 * 
 * This module handles:
 * 1. Calculating income from income events based on previous state.
 * 2. Applying expected annual changes.
 * 3. Adjusting for inflation.
 * 4. Adjusting for user/spouse mortality and marital status.
 * 5. Returning the calculated income totals and event states for the year.
 */

// Assuming sampleNormal and sampleUniform are defined/imported if needed for expectedAnnualChange
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
 * Calculate the expected annual change *amount* based on the method.
 * Note: This needs the previous amount to calculate the new amount for fixedValue changes.
 * For percentage changes, it returns a multiplier.
 * @param {Object} changeConfig - The expectedAnnualChange configuration object from the event.
 * @param {number} previousAmount - The income amount from the previous year for this specific event.
 * @returns {number} - The new absolute amount (for fixedValue) or the multiplier (for percentages).
 */
function calculateNextAmount(changeConfig, previousAmount) {
  if (!changeConfig || !changeConfig.method) {
    return previousAmount; // No change defined
  }

  const method = changeConfig.method;
  // Default previousAmount to 0 if null/undefined
  const prevAmountNum = typeof previousAmount === 'number' ? previousAmount : 0;

  switch (method) {
    case 'fixedValue':
      // Adds a fixed value change each year
      const changeVal = typeof changeConfig.fixedValue === 'number' ? changeConfig.fixedValue : 0;
      return prevAmountNum + changeVal;

    case 'fixedPercentage':
      const percentChange = (typeof changeConfig.fixedPercentage === 'number' ? changeConfig.fixedPercentage : 0) / 100;
      return prevAmountNum * (1 + percentChange);

    case 'normalValue':
       // Adds a normally distributed value change each year
       const meanVal = changeConfig.normalValue?.mean;
       const sdVal = changeConfig.normalValue?.sd;
       const sampledValueChange = sampleNormal(meanVal, sdVal);
       return prevAmountNum + sampledValueChange;

    case 'normalPercentage':
      const meanPercent = changeConfig.normalPercentage?.mean;
      const sdPercent = changeConfig.normalPercentage?.sd;
      const sampledPercent = sampleNormal(meanPercent, sdPercent) / 100;
      return prevAmountNum * (1 + sampledPercent);

    case 'uniformValue':
        // Adds a uniformly distributed value change each year
        const lowerVal = changeConfig.uniformValue?.lowerBound;
        const upperVal = changeConfig.uniformValue?.upperBound;
        const sampledUniformVal = sampleUniform(lowerVal, upperVal);
        return prevAmountNum + sampledUniformVal;

    case 'uniformPercentage':
      const lowerPercent = changeConfig.uniformPercentage?.lowerBound;
      const upperPercent = changeConfig.uniformPercentage?.upperBound;
      const sampledUniformPercent = sampleUniform(lowerPercent, upperPercent) / 100;
      return prevAmountNum * (1 + sampledUniformPercent);

    default:
      console.warn(`Unsupported expectedAnnualChange method: ${method}`);
      return prevAmountNum; // No change if method is unknown
  }
}

/**
 * Run all active income events for the current simulation year.
 * @param {Object} modelData - Contains scenario, taxData, etc.
 * @param {Array<string>} eventsActiveThisYear - Array of active event names for the year.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year (1.0 = base year).
 * @param {Object} previousIncomeEventStates - Map of event states from the previous year { eventName: { amount: number } }.
 * @param {number} initialCash - Cash balance at the start of the year before income.
 * @returns {Object} - { cash: updatedCash, curYearIncome: totalTaxableIncome, curYearSS: totalSSIncome, incomeEventStates: stateForNextYear }
 */
function runIncomeEvents(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousIncomeEventStates = {}, initialCash = 0) {

    let currentCash = initialCash;
    let curYearIncome = 0; // Total income for tax purposes this year
    let curYearSS = 0;     // Total SS income this year
    const currentIncomeEventStates = {}; // Store calculated amounts for *next* year's previous state

    if (!eventsActiveThisYear || eventsActiveThisYear.length === 0) {
        return { cash: currentCash, curYearIncome, curYearSS, incomeEventStates: currentIncomeEventStates };
    }

    const allEvents = modelData.scenario.events;
    const inflationFactorToApply = currentInflationFactor; // Use the cumulative factor directly

    for (const eventName of eventsActiveThisYear) {
        const event = allEvents.find(e => e.name === eventName);

        // Ensure it's an income event with necessary details
        if (!event || event.type !== 'income' || !event.income || event.income.initialAmount == null) {
            continue; // Skip if not a valid income event
        }

        const incomeDetails = event.income;
        const previousState = previousIncomeEventStates[eventName] || null;
        const previousAmount = previousState ? previousState.amount : incomeDetails.initialAmount;

        // a. Calculate next amount based on previous amount and expected change
        let currentAmount = calculateNextAmount(incomeDetails.expectedAnnualChange, previousAmount);

        // b. Apply inflation adjustment if enabled (applied to the calculated amount)
        if (incomeDetails.inflationAdjustment) {
            // Apply simple inflation scaling based on the cumulative factor relative to base year (factor=1)
            // This assumes initialAmount is in base year dollars.
            currentAmount *= inflationFactorToApply;
        }

        // c. Adjust for marital status
        if (maritalStatusThisYear === 'married') {
            // Assume spouse gets 'marriedPercentage', user gets the rest. Default 50/50 if not specified.
            const spousePercentage = (typeof incomeDetails.marriedPercentage === 'number' ? incomeDetails.marriedPercentage : 50);
            // We are calculating the income *for the user/household defined in the scenario*.
            // If spouse gets X%, the *household* still gets 100%, but we might need to know the split later for taxes?
            // For now, assume `currentAmount` represents the total household amount from this event.
            // If the scenario owner (user) isn't specified as primary beneficiary, this might need adjustment.
            // Let's keep total amount for now. Adjustments might be needed in tax modules if spouse income is taxed differently.
        }
        // Note: Logic for adjusting based on mortality is missing, would require user/spouse alive status.

        // d. Add the calculated income to cash
        currentCash += currentAmount;

        // e. Update running total curYearIncome (taxable income)
        //    Assuming pre-tax status means it's NOT taxed now (e.g., 401k contributions treated elsewhere)
        //    Need clarity on `isPreTax` flag if it exists. Assuming income is taxable unless specified otherwise.
        //    TODO: Add check for pre-tax status if available in schema.
        curYearIncome += currentAmount; // Add to taxable income for now

        // f. Update running total curYearSS if applicable
        if (incomeDetails.isSocialSecurity) {
            curYearSS += currentAmount;
        }

        // Store the calculated amount for this event, this will be the 'previousAmount' for the *next* year
        currentIncomeEventStates[eventName] = { amount: currentAmount };
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