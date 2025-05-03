/**
 * InvestEvents.js - Module for processing yearly investment events.
 */

/**
 * Processes the investment strategy for the current year, investing excess cash.
 * Handles contribution limits for after-tax retirement accounts.
 * MUTATES the yearState object directly.
 * 
 * @param {Object|null} investStrategyInfo - The investment strategy object for the current year from investArray.
 * @param {Object} yearState - The current year's state object (will be modified).
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year.
 * @param {Object} modelData - Full model data to look up investment details like maxAnnualContribution.
 * @returns {Object} - The updated yearState object.
 */
function processInvestEvents(investStrategyInfo, yearState, currentInflationFactor, modelData) {
    
    if (!investStrategyInfo || !investStrategyInfo.strategy) {
        // console.log(`Year ${yearState.year}: No investment strategy active.`);
        return yearState;
    }

    const strategy = investStrategyInfo.strategy;
    const defaultMaximumCash = 20000; // Default if not specified? Or take from scenario?
    const maximumCash = investStrategyInfo.newMaximumCash ?? defaultMaximumCash; // Use event override if available
    
    let excessCash = yearState.cash - maximumCash;

    if (excessCash <= 0) {
        // console.log(`Year ${yearState.year}: No excess cash (${yearState.cash.toFixed(2)}) above maximum (${maximumCash.toFixed(2)}) to invest.`);
        return yearState;
    }

    // console.log(`Year ${yearState.year}: Processing Invest Event. Excess Cash: ${excessCash.toFixed(2)}`);

    // --- Calculate Initial Purchase Amounts based on Allocation --- 
    let initialPurchases = {}; // { investmentName: amount }
    let totalAllocated = 0;

    // Helper to calculate purchases for a specific allocation type
    const calculateTypeAllocation = (allocationMap, totalAllocationPercent) => {
        if (!allocationMap || Object.keys(allocationMap).length === 0) return;
        const typeExcessCash = excessCash * (totalAllocationPercent / 100);
        let sumPct = 0;
        Object.values(allocationMap).forEach(pct => sumPct += pct); // Sum percentages in this map
        if (sumPct === 0) return; // Avoid division by zero

        for (const [name, percent] of Object.entries(allocationMap)) {
            const purchaseAmount = typeExcessCash * (percent / sumPct);
            initialPurchases[name] = (initialPurchases[name] || 0) + purchaseAmount;
            totalAllocated += purchaseAmount;
        }
    };

    // Calculate for each tax status type based on its top-level allocation
    if (strategy.taxStatusAllocation) {
        calculateTypeAllocation(strategy.preTaxAllocation, strategy.taxStatusAllocation['pre-tax']);
        calculateTypeAllocation(strategy.afterTaxAllocation, strategy.taxStatusAllocation['after-tax']);
        calculateTypeAllocation(strategy.nonRetirementAllocation, strategy.taxStatusAllocation['non-retirement']);
        calculateTypeAllocation(strategy.taxExemptAllocation, strategy.taxStatusAllocation['tax-exempt']);
    }

    // Adjust totalAllocated slightly due to potential floating point issues if needed
    if (Math.abs(totalAllocated - excessCash) > 0.01) {
        //  console.warn(`Year ${yearState.year}: Invest Event allocation calculation mismatch. Allocated ${totalAllocated.toFixed(2)}, Excess Cash ${excessCash.toFixed(2)}`);
         // Optionally scale purchases slightly here to match excessCash exactly, or proceed.
         // For simplicity, we proceed, assuming minor diffs are okay.
    }
    
    // --- Adjust for After-Tax Contribution Limits --- 
    let finalPurchases = { ...initialPurchases };
    let afterTaxTotalInitial = 0;
    let afterTaxLimitTotal = 0;
    const afterTaxInvestments = [];
    const nonRetirementInvestments = [];

    // Find after-tax investments and their limits
    for (const name in initialPurchases) {
        const investment = yearState.investments.find(inv => inv.name === name);
        if (!investment) continue; // Should exist if in strategy

        if (investment.accountTaxStatus === 'after-tax') {
            afterTaxInvestments.push(name);
            afterTaxTotalInitial += initialPurchases[name];
            // Find original investment def for limit
            const initialDef = modelData.scenario.investments.find(inv => inv.name === name);
            if (initialDef && initialDef.maxAnnualContribution) {
                 afterTaxLimitTotal += (initialDef.maxAnnualContribution * currentInflationFactor); 
            } else {
                 afterTaxLimitTotal += Infinity; // Assume no limit if not specified
            }
        }
        if (investment.accountTaxStatus === 'non-retirement') {
            nonRetirementInvestments.push(name);
        }
    }
    
    // Check if limit exceeded
    if (afterTaxTotalInitial > afterTaxLimitTotal && afterTaxLimitTotal < Infinity) {
        // console.log(`Year ${yearState.year}: After-tax limit exceeded. Initial: ${afterTaxTotalInitial.toFixed(2)}, Limit: ${afterTaxLimitTotal.toFixed(2)}`);
        const scaleDownFactor = afterTaxLimitTotal / afterTaxTotalInitial;
        const reductionAmount = afterTaxTotalInitial - afterTaxLimitTotal;
        let appliedReduction = 0;

        // Scale down after-tax purchases
        afterTaxInvestments.forEach(name => {
            finalPurchases[name] *= scaleDownFactor;
        });

        // Scale up non-retirement purchases proportionally
        const initialNonRetirementTotal = nonRetirementInvestments.reduce((sum, name) => sum + (initialPurchases[name] || 0), 0);
        
        if (initialNonRetirementTotal > 0) {
            nonRetirementInvestments.forEach(name => {
                const proportion = initialPurchases[name] / initialNonRetirementTotal;
                const increase = reductionAmount * proportion;
                finalPurchases[name] += increase;
                appliedReduction += increase;
            });
             // console.log(`    Scaled down after-tax by ${scaleDownFactor.toFixed(3)}. Increased non-retirement to absorb ${appliedReduction.toFixed(2)}.`);
        } else if (reductionAmount > 0.01) {
             // If no non-retirement accounts to scale up, the excess cash isn't invested
             console.warn(`Year ${yearState.year}: After-tax limit exceeded, but no non-retirement accounts in strategy to absorb reduction of ${reductionAmount.toFixed(2)}. This amount will remain as cash.`);
             // Update excessCash to reflect the uninvested amount
             excessCash -= reductionAmount; 
        }
    }

    // --- Apply Final Purchases --- 
    let totalActuallyInvested = 0;
    for (const name in finalPurchases) {
        const purchaseAmount = finalPurchases[name];
        if (purchaseAmount <= 0) continue;

        const index = yearState.investments.findIndex(inv => inv.name === name);
        if (index === -1) {
            // Keep this warning
            console.warn(`Year ${yearState.year}: Investment '${name}' targeted by invest event not found in current state.`);
            continue;
        }

        // Ensure costBasis exists before adding to it
        if (yearState.investments[index].costBasis === undefined || yearState.investments[index].costBasis === null) {
             yearState.investments[index].costBasis = 0; // Initialize if missing
        }
        
        yearState.investments[index].value += purchaseAmount;
        yearState.investments[index].costBasis += purchaseAmount;
        totalActuallyInvested += purchaseAmount;
        // console.log(`    Invested ${purchaseAmount.toFixed(2)} into '${name}'. New Value: ${yearState.investments[index].value.toFixed(2)}, New Basis: ${yearState.investments[index].costBasis.toFixed(2)}`);
    }

    // Update cash
    yearState.cash -= totalActuallyInvested;
    
    // Recalculate totals
    yearState.totalInvestmentValue = (yearState.investments || []).reduce((sum, inv) => sum + (inv?.value || 0), 0);
    yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash;

    // console.log(`Year ${yearState.year}: Finished Invest Event. Invested: ${totalActuallyInvested.toFixed(2)}, Final Cash: ${yearState.cash.toFixed(2)}, Final Assets: ${yearState.totalAssets.toFixed(2)}`);

    return yearState;
}

module.exports = {
    processInvestEvents
};
