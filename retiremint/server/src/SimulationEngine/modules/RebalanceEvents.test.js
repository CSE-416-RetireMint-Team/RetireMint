const { processRebalanceEvents } = require('./RebalanceEvents');

describe('RebalanceEvents', () => {
    let currentYearEventsLog;
    let currentRebalanceInfo;
    let yearState;

    beforeEach(() => {
        currentYearEventsLog = [];
        yearState = {
            year: 2030,
            cash: 10000,
            investments: [
                { name: 'Stocks', value: 60000, costBasis: 50000, accountTaxStatus: 'non-retirement' },
                { name: 'Bonds', value: 40000, costBasis: 40000, accountTaxStatus: 'non-retirement' },
                { name: 'PreTax Fund', value: 100000, costBasis: 80000, accountTaxStatus: 'pre-tax' },
                { name: 'Roth Fund', value: 20000, costBasis: 20000, accountTaxStatus: 'after-tax' },
                { name: 'PreTax Fund (RMD)', value: 5000, costBasis: 5000, accountTaxStatus: 'non-retirement' },
            ],
            curYearGains: 0,
            totalInvestmentValue: 225000,
            totalAssets: 235000,
        };
        currentRebalanceInfo = {
            method: 'fixedAllocation',
            strategy: {
                taxStatusAllocation: { 'non-retirement': 50, 'after-tax': 50, 'pre-tax': 0 }, // Example: 50/50 NRet/ATax
                nonRetirementAllocation: { 'Stocks': 70, 'Bonds': 30 }, // 70/30 within NRet
                afterTaxAllocation: { 'Roth Fund': 100 },
                // preTaxAllocation: { ... } // No specific pre-tax rebalance in this default
            }
        };
    });

    it('should do nothing if currentRebalanceInfo is null or lacks strategy', () => {
        const originalState = JSON.parse(JSON.stringify(yearState));
        
        let resultState = processRebalanceEvents(currentYearEventsLog, null, yearState);
        expect(resultState).toEqual(originalState);
        expect(currentYearEventsLog.length).toBe(0);

        resultState = processRebalanceEvents(currentYearEventsLog, { method: 'fixed' }, yearState); // No strategy object
        expect(resultState).toEqual(originalState);
        expect(currentYearEventsLog.length).toBe(0);
    });

    it('should do nothing if total investment value is zero (excluding cash)', () => {
        yearState.investments = [];
        yearState.totalInvestmentValue = 0;
        yearState.totalAssets = yearState.cash;
        const originalState = JSON.parse(JSON.stringify(yearState));

        const resultState = processRebalanceEvents(currentYearEventsLog, currentRebalanceInfo, yearState);
        expect(resultState).toEqual(originalState);
        expect(currentYearEventsLog.length).toBe(1); // Summary log still added
        expect(currentYearEventsLog[0].details).toContain('Applied rebalance strategy');
    });
    
    it('should preserve values of excluded accounts (RMD/Roth/PreTax) when rebalancing others', () => {
         // Target: 50% NonRet (Stocks/Bonds), 50% AfterTax (Roth). PreTax/RMD ignored by top-level.
         // Rebalancable value = 60k + 40k + 20k = 120k
         // Target NonRet = 120k * 0.5 = 60k
         // Target AfterTax = 120k * 0.5 = 60k
         // Within NonRet (60k total): Stocks target 70% (42k), Bonds target 30% (18k)
         // Within AfterTax (60k total): Roth target 100% (60k)
         
         // Expected changes:
         // Stocks: 60k -> 42k (Sell 18k)
         // Bonds: 40k -> 18k (Sell 22k)
         // Roth Fund: 20k -> 60k (Buy 40k)
         // PreTax Fund: 100k -> 100k (Unchanged)
         // PreTax Fund (RMD): 5k -> 5k (Unchanged)
         
         const originalPreTaxValue = yearState.investments.find(inv => inv.accountTaxStatus === 'pre-tax').value;
         const originalRMDValue = yearState.investments.find(inv => inv.name.includes('(RMD)')).value;
         
         const resultState = processRebalanceEvents(currentYearEventsLog, currentRebalanceInfo, yearState);
         
         const finalPreTax = resultState.investments.find(inv => inv.accountTaxStatus === 'pre-tax');
         const finalRMD = resultState.investments.find(inv => inv.name.includes('(RMD)'));
         const finalStocks = resultState.investments.find(inv => inv.name === 'Stocks');
         const finalBonds = resultState.investments.find(inv => inv.name === 'Bonds');
         const finalRoth = resultState.investments.find(inv => inv.name === 'Roth Fund');
         
         expect(finalPreTax.value).toBe(originalPreTaxValue);
         expect(finalRMD.value).toBe(originalRMDValue);
         expect(finalStocks.value).toBeCloseTo(42000);
         expect(finalBonds.value).toBeCloseTo(18000);
         expect(finalRoth.value).toBeCloseTo(60000);
         expect(resultState.cash).toBe(10000); // Cash should be unchanged by rebalance
         
         // Check logs for sales/purchases
         expect(currentYearEventsLog).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'rebalance', details: expect.stringContaining('Applied rebalance strategy') }),
            expect.objectContaining({ type: 'rebalance', details: expect.stringMatching(/^Sold 18000\.00 from 'Stocks'/) }),
            expect.objectContaining({ type: 'rebalance', details: expect.stringMatching(/^Sold 22000\.00 from 'Bonds'/) }),
            expect.objectContaining({ type: 'rebalance', details: expect.stringMatching(/^Purchased 40000\.00 for 'Roth Fund'/) }),
         ]));
    });
    
}); 