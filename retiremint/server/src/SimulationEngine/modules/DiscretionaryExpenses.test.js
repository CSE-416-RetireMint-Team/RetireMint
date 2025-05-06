const { processDiscretionaryExpenses } = require('./DiscretionaryExpenses');
// Mock dependencies like performWithdrawal if needed
// jest.mock('../Utils/WithdrawalUtils');

describe('DiscretionaryExpenses', () => {
    let modelData;
    let eventsActiveThisYear;
    let spendingStrategy;
    let expenseWithdrawalStrategies;
    let financialGoal;
    let userAge;
    let maritalStatusThisYear;
    let currentInflationFactor;
    let yearState;
    let previousDiscExpenseEventStates;

    beforeEach(() => {
        // Mock performWithdrawal if needed
        // require('../Utils/WithdrawalUtils').performWithdrawal.mockImplementation((amount, state, strat, age, log) => {
        //     state.cash -= amount; 
        //     return state; // Basic mock
        // });

        modelData = { /* ... basic model data with expense events ... */ };
        eventsActiveThisYear = [];
        spendingStrategy = 'constantAmount'; // Example
        expenseWithdrawalStrategies = ['cash']; // Example
        financialGoal = 1000000;
        userAge = 60;
        maritalStatusThisYear = 'single';
        currentInflationFactor = 1.0;
        yearState = { cash: 50000, investments: [/*...*/], curYearExpenses: 0, expenseBreakdown: {} };
        previousDiscExpenseEventStates = {};
    });

    it('should return original state if no active discretionary expenses', () => {
        const originalState = JSON.parse(JSON.stringify(yearState));
        const result = processDiscretionaryExpenses(
            modelData, eventsActiveThisYear, spendingStrategy, expenseWithdrawalStrategies,
            financialGoal, userAge, maritalStatusThisYear, currentInflationFactor,
            yearState, previousDiscExpenseEventStates
        );
        expect(result.updatedYearState).toEqual(originalState);
        expect(result.paidDiscExpenses).toEqual({});
    });
    
    it('should handle zero amount discretionary expense', () => {
         modelData.scenario = { events: [
             { name: 'Zero Hobby', type: 'expense', expense: { initialAmount: 0, isDiscretionary: true, inflationAdjustment: true } }
         ]};
         eventsActiveThisYear = ['Zero Hobby'];
         const originalState = JSON.parse(JSON.stringify(yearState));
         const result = processDiscretionaryExpenses(
            modelData, eventsActiveThisYear, spendingStrategy, expenseWithdrawalStrategies,
            financialGoal, userAge, maritalStatusThisYear, currentInflationFactor,
            yearState, previousDiscExpenseEventStates
         );
         expect(result.updatedYearState.cash).toBe(originalState.cash);
         expect(result.paidDiscExpenses).toEqual({}); // Nothing should be paid
         expect(result.expenseEventStates['Zero Hobby']?.baseAmount).toBe(0);
    });

}); 