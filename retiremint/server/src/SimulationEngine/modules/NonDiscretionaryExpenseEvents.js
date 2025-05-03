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
            const eventStateKey = eventName;
            const prevState = previousEventStates[eventStateKey] || {};

            // Determine initial amount for this year (either fixed or from previous state)
            let currentAmount = prevState.currentAmount ?? expenseConfig.initialAmount;

            // Apply annual change *before* inflation for the current year
            // (Assuming change applies at the start of the year)
            if (prevState.currentAmount !== undefined) { // Don't apply change in the very first active year
                // TODO: Implement logic for different change methods (fixedValue, normalValue, etc.)
                // For now, assume fixedValue as an example, needs expanding based on actual schema
                if (expenseConfig.expectedAnnualChange?.method === 'fixedValue') {
                    currentAmount += expenseConfig.expectedAnnualChange.fixedValue || 0;
                }
                // Add other change methods here...
            }
            
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

            // Store state for next year
            expenseEventStates[eventStateKey] = { currentAmount }; 
            // console.log(`NonDiscExpense Event '${eventName}': Amount=${amountToAdd.toFixed(2)}, NextYearBase=${currentAmount.toFixed(2)}`);
        }
    }

    return {
        totalNonDiscExpenses,
        expenseEventStates // Store this in yearState to pass as previousEventStates next year
    };
}

module.exports = {
    calculateCurrentNonDiscExpenses
}; 