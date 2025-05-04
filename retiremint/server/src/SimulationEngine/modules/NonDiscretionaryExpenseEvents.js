/**
 * NonDiscretionaryExpenseEvents.js - Module for calculating total non-discretionary expenses for the year.
 */

/**
 * Calculates the total non-discretionary expense amount for the current year based on active events.
 * 
 * @param {Object} modelData - Contains scenario, events, etc.
 * @param {Array} eventsActiveThisYear - Array of active event names for the current year.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year.
 * @param {Object} previousEventStates - State of events from the previous year (for tracking amounts).
 * @returns {Object} - { totalNonDiscExpenses: number, expenseEventStates: Object }
 */
function calculateCurrentNonDiscExpenses(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousEventStates = {}) {
    let totalNonDiscExpenses = 0;
    const expenseEventStates = {}; // Store state for next year
    
    // Access scenario data correctly
    const scenario = modelData.scenario;

    // Check for modelData, scenario, and scenario.events
    if (!scenario || !scenario.events) {
        console.error(`NonDiscExpenseEvents Error: Invalid modelData structure. Missing scenario or scenario.events. modelData Keys: ${modelData ? Object.keys(modelData) : 'null'}`);
        return { totalNonDiscExpenses: 0, expenseEventStates: {} };
    }

    for (const eventName of eventsActiveThisYear) {
        // Find event within scenario.events
        const event = scenario.events.find(e => e.name === eventName);

        if (event && event.type === 'expense' && event.expense && !event.expense.isDiscretionary) {
            const expenseConfig = event.expense;
            const eventStateKey = event._id || eventName; // Use ID if available
            const prevState = previousEventStates[eventStateKey] || {};

            // Determine initial amount for this year (either fixed or from previous state)
            let currentAmount = prevState.currentAmount ?? expenseConfig.initialAmount;

            // Apply annual change if not first year and change method exists
            if (prevState.currentAmount !== undefined && expenseConfig.expectedAnnualChange?.method) { 
                const changeConfig = expenseConfig.expectedAnnualChange;
                let changeAmount = 0;

                switch (changeConfig.method) {
                    case 'fixedValue':
                        changeAmount = changeConfig.fixedValue || 0;
                        break;
                    case 'fixedPercentage':
                        changeAmount = currentAmount * ((changeConfig.fixedPercentage || 0) / 100);
                        break;
                    case 'normalValue':
                        if (changeConfig.normalValue) {
                            const mean = changeConfig.normalValue.mean || 0;
                            const sd = changeConfig.normalValue.sd || 0;
                            changeAmount = sampleNormal(mean, sd);
                        }
                        break;
                    case 'normalPercentage':
                         if (changeConfig.normalPercentage) {
                            const mean = changeConfig.normalPercentage.mean || 0;
                            const sd = changeConfig.normalPercentage.sd || 0;
                            const percentChange = sampleNormal(mean, sd);
                            changeAmount = currentAmount * (percentChange / 100);
                        }
                        break;
                    case 'uniformValue':
                         if (changeConfig.uniformValue) {
                             const min = changeConfig.uniformValue.lowerBound || 0;
                             const max = changeConfig.uniformValue.upperBound || 0;
                             if (min <= max) {
                                 changeAmount = sampleUniform(min, max);
                             } else {
                                 console.warn(`Year ${currentYear}: Uniform value bounds invalid for non-disc expense ${eventName}. Min: ${min}, Max: ${max}`);
                             }
                         }
                        break;
                    case 'uniformPercentage':
                         if (changeConfig.uniformPercentage) {
                             const min = changeConfig.uniformPercentage.lowerBound || 0;
                             const max = changeConfig.uniformPercentage.upperBound || 0;
                              if (min <= max) {
                                 const percentChange = sampleUniform(min, max);
                                 changeAmount = currentAmount * (percentChange / 100);
                              } else {
                                  console.warn(`Year ${currentYear}: Uniform percentage bounds invalid for non-disc expense ${eventName}. Min: ${min}, Max: ${max}`);
                              }
                         }
                        break;
                    default:
                        console.warn(`Year ${currentYear}: Unknown expectedAnnualChange method '${changeConfig.method}' for non-disc expense '${eventName}'.`);
                        break;
                }
                currentAmount += changeAmount;
            }
            
            // Ensure base amount doesn't go negative
            currentAmount = Math.max(0, currentAmount);

            // Apply inflation adjustment if required
            let finalAmountThisYear = currentAmount;
            if (expenseConfig.inflationAdjustment) {
                finalAmountThisYear *= currentInflationFactor;
            }
            
            // Adjust for marital status
            let amountToAdd = finalAmountThisYear;
            if (maritalStatusThisYear === 'single' && expenseConfig.marriedPercentage !== undefined && expenseConfig.marriedPercentage !== null) {
                // If user is single, calculate the single portion (100 - marriedPercentage)
                amountToAdd *= (1 - (expenseConfig.marriedPercentage / 100));
            }
            // No adjustment needed if married, as the base amount is assumed for the couple

            totalNonDiscExpenses += amountToAdd;

            // Store state for next year using the UPDATED currentAmount
            expenseEventStates[eventStateKey] = { currentAmount }; 
            // console.log(`NonDiscExpense Event '${eventName}': Amount=${amountToAdd.toFixed(2)}, NextYearBase=${currentAmount.toFixed(2)}`);
        }
    }

    return {
        totalNonDiscExpenses,
        expenseEventStates // Store this in yearState to pass as previousEventStates next year
    };
}

// --- Helper functions for random sampling --- 
// (Consider moving to a shared utility file)
function sampleNormal(mean, stdDev) {
  let u1 = 0, u2 = 0;
  while(u1 === 0) u1 = Math.random(); 
  while(u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

function sampleUniform(min, max) {
  return Math.random() * (max - min) + min;
}
// --- End Helper functions ---

module.exports = {
    calculateCurrentNonDiscExpenses
}; 