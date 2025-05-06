const { calculateCurrentNonDiscExpenses } = require('./NonDiscretionaryExpenseEvents');

describe('NonDiscretionaryExpenseEvents', () => {
    let modelData;
    let eventsActiveThisYear;
    let maritalStatusThisYear;
    let currentInflationFactor;
    let previousNonDiscExpenseEventStates;

    beforeEach(() => {
        modelData = {
            scenario: {
                events: [
                    { 
                        name: 'Property Tax', 
                        type: 'expense', 
                        expense: { 
                            initialAmount: 5000, 
                            isDiscretionary: false,
                            inflationAdjustment: true,
                            expectedAnnualChange: { method: 'fixedPercentage', fixedValue: 1 } 
                        }
                    },
                    { 
                        name: 'Zero Fixed Expense', 
                        type: 'expense', 
                        expense: { 
                            initialAmount: 0, 
                            isDiscretionary: false,
                            inflationAdjustment: false
                        } 
                    },
                    // Add other necessary event types
                ]
            }
        };
        eventsActiveThisYear = [];
        maritalStatusThisYear = 'single';
        currentInflationFactor = 1.0;
        previousNonDiscExpenseEventStates = {};
    });

    it('should return empty results if no active non-discretionary events', () => {
        const result = calculateCurrentNonDiscExpenses(
            modelData, eventsActiveThisYear, maritalStatusThisYear, 
            currentInflationFactor, previousNonDiscExpenseEventStates
        );
        expect(result.nonDiscExpenseDetails).toEqual({});
        expect(result.expenseEventStates).toEqual({});
    });
    
}); 