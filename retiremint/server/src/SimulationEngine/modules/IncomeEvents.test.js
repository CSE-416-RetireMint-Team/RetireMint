const { runIncomeEvents } = require('./IncomeEvents');

describe('IncomeEvents', () => {
    let modelData;
    let eventsActiveThisYear;
    let maritalStatusThisYear;
    let currentInflationFactor;
    let previousIncomeEventStates;
    let initialCash;
    let currentYearEventsLog;
    let currentYear;

    beforeEach(() => {
        // Basic Setup
        modelData = {
            scenario: {
                events: [
                    { 
                        name: 'Salary', 
                        type: 'income', 
                        income: { 
                            initialAmount: 50000, 
                            inflationAdjustment: true,
                            expectedAnnualChange: { method: 'fixedPercentage', fixedValue: 2 } // 2%
                        }
                    },
                    { 
                        name: 'Pension', 
                        type: 'income', 
                        income: { 
                            initialAmount: 10000, 
                            inflationAdjustment: false 
                        } 
                    },
                    { 
                        name: 'Zero Income', 
                        type: 'income', 
                        income: { 
                            initialAmount: 0, 
                            inflationAdjustment: true 
                        } 
                    },
                     { 
                        name: 'Not Active', 
                        type: 'income', 
                        income: { 
                            initialAmount: 1000, 
                            inflationAdjustment: true 
                        } 
                    },
                    { name: 'Expense Event', type: 'expense' /* ... */ }
                ]
            }
            // ... other modelData properties if needed
        };
        eventsActiveThisYear = [];
        maritalStatusThisYear = 'single';
        currentInflationFactor = 1.0;
        previousIncomeEventStates = {};
        initialCash = 1000;
        currentYearEventsLog = [];
        currentYear = 2025;
    });

    it('should return initial state if no active income events', () => {
        eventsActiveThisYear = ['Expense Event']; // Contains only non-income event
        const result = runIncomeEvents(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousIncomeEventStates, initialCash, currentYearEventsLog, currentYear);
        
        expect(result.cash).toBe(initialCash);
        expect(result.curYearIncome).toBe(0);
        expect(result.curYearSS).toBe(0);
        expect(result.incomeEventStates).toEqual({});
        expect(currentYearEventsLog.length).toBe(0);
    });
    
    it('should NOT apply inflation adjustment when specified', () => {
        eventsActiveThisYear = ['Pension'];
        currentInflationFactor = 1.05; // 5% inflation
        const result = runIncomeEvents(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousIncomeEventStates, initialCash, currentYearEventsLog, currentYear);
        
        const expectedAmount = 10000; // No annual change, no inflation
        
        expect(result.cash).toBeCloseTo(initialCash + expectedAmount);
        expect(result.curYearIncome).toBeCloseTo(expectedAmount);
        expect(result.incomeEventStates['Pension']?.baseAmount).toBeCloseTo(expectedAmount);
        expect(currentYearEventsLog).toContainEqual(expect.objectContaining({
            year: currentYear,
            type: 'income',
            details: expect.stringContaining(`Received from 'Pension': ${expectedAmount.toFixed(2)}`)
        }));
    });

}); 