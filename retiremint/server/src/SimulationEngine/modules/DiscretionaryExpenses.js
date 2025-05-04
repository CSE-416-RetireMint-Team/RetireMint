/**
 * DiscretionaryExpenses.js - Module for processing discretionary expense payments.
 */
const { performWithdrawal } = require('../Utils/WithdrawalUtils'); // Import the utility

// --- Helper functions for random sampling --- 
// (Consider moving to a shared utility file if used elsewhere)
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

/**
 * Calculates and pays discretionary expenses based on spending strategy and financial goal.
 * Updates yearState by potentially calling performWithdrawal.
 * 
 * @param {Object} modelData - Contains scenario, events, financialGoal.
 * @param {Array} eventsActiveThisYear - Array of active event names for the current year.
 * @param {Array<string>} spendingStrategy - Ordered list of discretionary expense event names.
 * @param {Array<string>} withdrawalStrategy - Ordered list of investment names for withdrawals.
 * @param {number} financialGoal - The minimum total assets to maintain.
 * @param {number|null} userAge - User's age for penalty checks.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year.
 * @param {Object} yearState - The current year's state object (will be modified).
 * @param {Object} previousEventStates - State of discretionary expense events from the previous year.
 * @returns {Object} - The updated yearState object (including updated discExpenseEventStates).
 */
function processDiscretionaryExpenses(
    modelData,
    eventsActiveThisYear,
    spendingStrategy,
    withdrawalStrategy,
    financialGoal,
    userAge,
    maritalStatusThisYear,
    currentInflationFactor,
    yearState,
    previousEventStates = {}
) {
    const scenario = modelData.scenario;
    const currentDiscExpenseEventStates = {}; // Track state for this year's events

    if (!spendingStrategy || spendingStrategy.length === 0) {
        // console.log(`Year ${yearState.year}: No discretionary spending strategy defined.`);
        yearState.discExpenseEventStates = {}; // Ensure state exists
        return yearState;
    }
    if (!scenario || !scenario.events) {
        // Keep this error log as it indicates a fundamental data problem
        console.error(`DiscretionaryExpenses Error: Invalid modelData structure. Missing scenario or scenario.events.`);
        yearState.discExpenseEventStates = {};
        return yearState;
    }

    // console.log(`Year ${yearState.year}: Starting Discretionary Expense Processing. Goal: ${financialGoal.toFixed(2)}, Current Assets: ${yearState.totalAssets.toFixed(2)}`);

    for (const expenseName of spendingStrategy) {
        // Is this expense active this year?
        if (!eventsActiveThisYear.includes(expenseName)) continue;

        // Find the event details
        const event = scenario.events.find(e => e.name === expenseName);

        // Check if it's a valid discretionary expense event
        if (event && event.type === 'expense' && event.expense && event.expense.isDiscretionary) {
            const expenseConfig = event.expense;
            const eventStateKey = event._id || eventName;
            const prevState = previousEventStates[eventStateKey] || {};

            // Calculate the potential amount for this expense this year
            let currentBaseAmount = prevState.currentAmount ?? expenseConfig.initialAmount;
            
            // Apply annual change if not first year and change method exists
            if (prevState.currentAmount !== undefined && expenseConfig.expectedAnnualChange?.method) { 
                const changeConfig = expenseConfig.expectedAnnualChange;
                let changeAmount = 0;

                switch (changeConfig.method) {
                    case 'fixedValue':
                        changeAmount = changeConfig.fixedValue || 0;
                        break;
                    case 'fixedPercentage':
                        changeAmount = currentBaseAmount * ((changeConfig.fixedPercentage || 0) / 100);
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
                            changeAmount = currentBaseAmount * (percentChange / 100);
                        }
                        break;
                    case 'uniformValue':
                        if (changeConfig.uniformValue) {
                             const min = changeConfig.uniformValue.lowerBound || 0;
                             const max = changeConfig.uniformValue.upperBound || 0;
                             if (min <= max) {
                                 changeAmount = sampleUniform(min, max);
                             } else {
                                 console.warn(`Year ${yearState.year}: Uniform value bounds invalid for ${expenseName}. Min: ${min}, Max: ${max}`);
                             }
                         }
                        break;
                    case 'uniformPercentage':
                         if (changeConfig.uniformPercentage) {
                             const min = changeConfig.uniformPercentage.lowerBound || 0;
                             const max = changeConfig.uniformPercentage.upperBound || 0;
                              if (min <= max) {
                                 const percentChange = sampleUniform(min, max);
                                 changeAmount = currentBaseAmount * (percentChange / 100);
                              } else {
                                  console.warn(`Year ${yearState.year}: Uniform percentage bounds invalid for ${expenseName}. Min: ${min}, Max: ${max}`);
                              }
                         }
                        break;
                    default:
                        console.warn(`Year ${yearState.year}: Unknown expectedAnnualChange method '${changeConfig.method}' for expense '${expenseName}'.`);
                        break;
                }
                currentBaseAmount += changeAmount;
            }
            
            // Ensure base amount doesn't go negative (optional, depends on desired behavior for expenses)
            currentBaseAmount = Math.max(0, currentBaseAmount);

            let potentialAmountThisYear = currentBaseAmount;
            if (expenseConfig.inflationAdjustment) {
                potentialAmountThisYear *= currentInflationFactor;
            }
            if (maritalStatusThisYear === 'single' && expenseConfig.marriedPercentage !== undefined && expenseConfig.marriedPercentage !== null) {
                potentialAmountThisYear *= (1 - (expenseConfig.marriedPercentage / 100));
            }
            
            // Store the state for next year BEFORE adjusting for affordability
            currentDiscExpenseEventStates[eventStateKey] = { currentAmount: currentBaseAmount };
            
            // Check affordability against financial goal
            const maxAffordable = Math.max(0, yearState.totalAssets - financialGoal);
            const amountToPay = Math.min(potentialAmountThisYear, maxAffordable);

            // console.log(`Year ${yearState.year}: Evaluating Disc Expense '${expenseName}'. Potential: ${potentialAmountThisYear.toFixed(2)}, Max Affordable: ${maxAffordable.toFixed(2)}, To Pay: ${amountToPay.toFixed(2)}`);

            if (amountToPay <= 0) {
                // console.log(`    Cannot afford any amount of '${expenseName}' without dropping below goal. Stopping discretionary spending.`);
                break; // Stop processing further discretionary expenses
            }

            // Perform payment/withdrawal
            // console.log(`Year ${yearState.year}: Attempting to pay ${amountToPay.toFixed(2)} for Discretionary Expense '${expenseName}'`);
            const { totalPaid } = performWithdrawal(amountToPay, yearState, withdrawalStrategy, userAge);

            // Update total expenses for the year
            yearState.curYearExpenses += totalPaid; 

            // If withdrawal failed to cover the intended amount, log it but continue (it's discretionary)
            if (totalPaid < amountToPay) {
                 // Keep this warning
                 console.warn(`Year ${yearState.year}: Could only pay ${totalPaid.toFixed(2)} / ${amountToPay.toFixed(2)} for '${expenseName}' due to insufficient funds after withdrawal attempt.`);
                 // Since we could only pay totalPaid, we should break if we couldn't even afford this partial amount
                 // Check if remaining assets are still above the goal
                 if (yearState.totalAssets < financialGoal) { 
                    // Keep this warning
                    console.warn(`    Assets dropped below goal after partial payment of ${expenseName}. Stopping discretionary spending.`);
                    break;
                 }
            }
            
            // If the full affordable amount was paid, and it was less than the potential amount, stop (can't afford more)
             if (totalPaid < potentialAmountThisYear && totalPaid >= amountToPay) {
                 // console.log(`    Paid partial amount for ${expenseName}. Cannot afford more discretionary expenses.`);
                 break;
             }

        }
    }
    
    // Store the calculated states for next year
    yearState.discExpenseEventStates = currentDiscExpenseEventStates;
    // console.log(`Year ${yearState.year}: Finished Discretionary Expense Processing. Final Assets: ${yearState.totalAssets.toFixed(2)}`);

    return yearState;
}

module.exports = {
    processDiscretionaryExpenses
};
