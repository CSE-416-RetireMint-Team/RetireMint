const { processInvestEvents } = require('./InvestEvents');

describe('InvestEvents', () => {
    let currentYearEventsLog;
    let currentInvestStrategyInfo;
    let yearState;
    let currentInflationFactor;
    let modelData;

    beforeEach(() => {
        currentYearEventsLog = [];
        yearState = {
            year: 2025,
            cash: 25000,
            investments: [
                { name: 'Stock Fund', value: 50000, costBasis: 40000, accountTaxStatus: 'non-retirement' },
                { name: 'Bond Fund', value: 30000, costBasis: 30000, accountTaxStatus: 'non-retirement' },
                { name: 'Roth IRA', value: 10000, costBasis: 10000, accountTaxStatus: 'after-tax', maxAnnualContribution: 7000 },
            ],
            // ... other yearState properties
        };
        currentInflationFactor = 1.0;
        modelData = { scenario: { investments: [ /* ... initial definitions if needed for limits */ ] } }; 
        currentInvestStrategyInfo = {
            method: 'fixedAllocation', 
            newMaximumCash: 20000, // Target cash level
            strategy: {
                taxStatusAllocation: { 'non-retirement': 100 },
                nonRetirementAllocation: { 'Stock Fund': 60, 'Bond Fund': 40 }
                // ... other allocations potentially null/empty
            }
        };
    });

    it('should do nothing if cash is below the maximum cash target', () => {
        yearState.cash = 15000; // Below the 20k target
        const originalState = JSON.parse(JSON.stringify(yearState));
        
        const resultState = processInvestEvents(currentYearEventsLog, currentInvestStrategyInfo, yearState, currentInflationFactor, modelData);

        expect(resultState).toEqual(originalState); // State should remain unchanged
        expect(currentYearEventsLog.length).toBe(0);
    });

    it('should do nothing if excess cash exists but strategy targets non-existent accounts', () => {
        yearState.cash = 25000; // 5k excess
        currentInvestStrategyInfo.strategy = {
            taxStatusAllocation: { 'non-retirement': 100 },
            nonRetirementAllocation: { 'NonExistent Fund': 100 } // Target doesn't exist
        };
        const originalState = JSON.parse(JSON.stringify(yearState));
        
        const resultState = processInvestEvents(currentYearEventsLog, currentInvestStrategyInfo, yearState, currentInflationFactor, modelData);
        
        // Expect state to be unchanged because no valid purchases could be made
        expect(resultState.cash).toBe(originalState.cash);
        expect(resultState.investments).toEqual(originalState.investments);
        expect(currentYearEventsLog.length).toBe(0); // No successful investment logged
    });
    
    it('should not invest in RMD or Roth designated accounts even if targeted by strategy', () => {
        yearState.cash = 30000; // 10k excess
        yearState.investments.push({ name: 'Stock Fund (RMD)', value: 5000, costBasis: 5000, accountTaxStatus: 'non-retirement' });
        currentInvestStrategyInfo.strategy = {
            taxStatusAllocation: { 'non-retirement': 100 },
            // Strategy mistakenly targets RMD account
            nonRetirementAllocation: { 'Stock Fund': 50, 'Stock Fund (RMD)': 50 } 
        };
        const originalRMDValue = yearState.investments.find(inv => inv.name.includes('(RMD)')).value;
        
        const resultState = processInvestEvents(currentYearEventsLog, currentInvestStrategyInfo, yearState, currentInflationFactor, modelData);
        
        const rmdAccount = resultState.investments.find(inv => inv.name.includes('(RMD)'));
        const stockAccount = resultState.investments.find(inv => inv.name === 'Stock Fund');

        expect(rmdAccount.value).toBe(originalRMDValue); // RMD value should not change
        // Excess cash should only go to Stock Fund
        expect(stockAccount.value).toBeCloseTo(50000 + 10000); 
        expect(resultState.cash).toBeCloseTo(20000); // Back to max cash target
         expect(currentYearEventsLog.some(log => log.details.includes('Stock Fund (RMD)'))).toBe(false);
         expect(currentYearEventsLog.some(log => log.details.includes('Stock Fund') && log.details.startsWith('Invested'))).toBe(true);
    });
    
    it('should redistribute funds correctly if after-tax contribution is capped', () => {
        yearState.cash = 30000; // 10k excess cash
        currentInvestStrategyInfo.strategy = {
            taxStatusAllocation: { 'after-tax': 50, 'non-retirement': 50 },
            afterTaxAllocation: { 'Roth IRA': 100 },        // Target 5k (50% of 10k) for Roth
            nonRetirementAllocation: { 'Stock Fund': 100 } // Target 5k for Stock Fund
        };
        modelData.scenario.investments = [
             { name: 'Roth IRA', maxAnnualContribution: 3000 } // Limit Roth contribution to 3k
        ];
        
        const resultState = processInvestEvents(currentYearEventsLog, currentInvestStrategyInfo, yearState, currentInflationFactor, modelData);
        
        const rothAccount = resultState.investments.find(inv => inv.name === 'Roth IRA');
        const stockAccount = resultState.investments.find(inv => inv.name === 'Stock Fund');

        expect(rothAccount.value).toBeCloseTo(10000 + 3000); // Capped at 3k investment
        // The remaining 2k (5k target - 3k actual) should go to Stock Fund
        expect(stockAccount.value).toBeCloseTo(50000 + 5000 + 2000); 
        expect(resultState.cash).toBeCloseTo(20000); // Back to max cash target
        
        expect(currentYearEventsLog).toContainEqual(expect.objectContaining({
            details: expect.stringMatching(/^Invested 3000\.00 into 'Roth IRA'/)
        }));
         expect(currentYearEventsLog).toContainEqual(expect.objectContaining({
            details: expect.stringMatching(/^Invested 7000\.00 into 'Stock Fund'/) // 5k initial + 2k redistributed
        }));
    });
    
    it('should leave excess cash if contribution is capped and no non-retirement targets exist', () => {
        yearState.cash = 30000; // 10k excess cash
        currentInvestStrategyInfo.strategy = {
            taxStatusAllocation: { 'after-tax': 100 }, // Only target after-tax
            afterTaxAllocation: { 'Roth IRA': 100 }        // Target 10k for Roth
        };
         modelData.scenario.investments = [
             { name: 'Roth IRA', maxAnnualContribution: 7000 } // Limit Roth contribution
        ];
        const originalCash = yearState.cash;
        
        const resultState = processInvestEvents(currentYearEventsLog, currentInvestStrategyInfo, yearState, currentInflationFactor, modelData);
        
        const rothAccount = resultState.investments.find(inv => inv.name === 'Roth IRA');
        
        expect(rothAccount.value).toBeCloseTo(10000 + 7000); // Invested the limit
        // 3k excess remains because it couldn't be redistributed
        expect(resultState.cash).toBeCloseTo(originalCash - 7000); 
        expect(currentYearEventsLog).toContainEqual(expect.objectContaining({
            details: expect.stringMatching(/^Invested 7000\.00 into 'Roth IRA'/)
        }));
    });

}); 