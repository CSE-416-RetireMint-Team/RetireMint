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
    
    // --- Adjust for Individual After-Tax Contribution Limits --- 
    let finalPurchases = { ...initialPurchases };
    let totalReductionFromLimits = 0;
    const initialNonRetirementPurchases = {}; // Track initial non-retirement targets
    
    // First pass: Identify non-retirement targets and cap after-tax contributions individually
    for (const name in initialPurchases) {
        const purchaseAmount = initialPurchases[name];
        if (purchaseAmount <= 0) continue;

        const investment = yearState.investments.find(inv => inv.name === name);
        if (!investment) { 
            // This warning remains valid
            console.warn(`Year ${yearState.year}: Investment '${name}' targeted by invest event not found in current state (during limit check).`);
            finalPurchases[name] = 0; // Cannot purchase if not found
            continue;
        }

        if (investment.accountTaxStatus === 'non-retirement') {
            initialNonRetirementPurchases[name] = purchaseAmount;
        }
        
        if (investment.accountTaxStatus === 'after-tax') {
            const initialDef = modelData.scenario.investments.find(inv => inv.name === name);
            let individualLimit = Infinity;
            if (initialDef && initialDef.maxAnnualContribution) {
                 individualLimit = initialDef.maxAnnualContribution * currentInflationFactor; 
            }

            if (purchaseAmount > individualLimit) {
                const reduction = purchaseAmount - individualLimit;
                // console.log(`Year ${yearState.year}: Capping contribution for '${name}'. Initial: ${purchaseAmount.toFixed(2)}, Limit: ${individualLimit.toFixed(2)}, Reduction: ${reduction.toFixed(2)}`);
                finalPurchases[name] = individualLimit; // Cap the purchase
                totalReductionFromLimits += reduction;
            }
        }
    }

    // Second pass: Redistribute the total reduction to non-retirement accounts if possible
    if (totalReductionFromLimits > 0.01) { // Only redistribute if reduction is significant
        const initialNonRetirementTotal = Object.values(initialNonRetirementPurchases).reduce((sum, val) => sum + val, 0);

        if (initialNonRetirementTotal > 0) {
            let appliedIncrease = 0;
            // console.log(`Year ${yearState.year}: Redistributing ${totalReductionFromLimits.toFixed(2)} from capped after-tax to non-retirement.`);
            for (const name in initialNonRetirementPurchases) {
                const proportion = initialNonRetirementPurchases[name] / initialNonRetirementTotal;
                const increase = totalReductionFromLimits * proportion;
                finalPurchases[name] = (finalPurchases[name] || 0) + increase; // Increase the final purchase amount
                appliedIncrease += increase;
                // console.log(`    Increasing '${name}' purchase by ${increase.toFixed(2)}.`);
            }
             // Sanity check log
             // console.log(`    Total Increase Applied: ${appliedIncrease.toFixed(2)} (Should approx equal ${totalReductionFromLimits.toFixed(2)})`);
        } else {
             // Keep this warning
             console.warn(`Year ${yearState.year}: After-tax contributions capped by ${totalReductionFromLimits.toFixed(2)}, but no non-retirement accounts in strategy to absorb reduction. This amount remains as cash.`);
        }
    }

    // --- Apply Final Purchases --- 
    let totalActuallyInvested = 0;
    for (const name in finalPurchases) {
        const purchaseAmount = finalPurchases[name];
        if (purchaseAmount <= 0.01) continue; // Ignore negligible amounts

        const index = yearState.investments.findIndex(inv => inv.name === name);
        if (index === -1) {
            // Should have been caught earlier, but double-check
            console.warn(`Year ${yearState.year}: Investment '${name}' not found when applying final purchase.`);
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

    // Update cash based on what was ACTUALLY invested
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
