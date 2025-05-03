/**
 * RebalanceEvents.js - Module for processing yearly rebalancing events.
 */

/**
 * Calculates the target value for each investment based on the strategy and total value.
 * 
 * @param {Array} investments - Current array of investment objects.
 * @param {Object} strategy - The target rebalancing strategy object.
 * @returns {Object} - An object mapping investment name to target value { investmentName: targetValue }.
 */
function calculateTargetValues(investments, strategy) {
    const targets = {};
    if (!strategy || !strategy.taxStatusAllocation) return targets;

    const totalValue = investments.reduce((sum, inv) => sum + (inv?.value || 0), 0);
    if (totalValue <= 0) return targets; // Cannot rebalance if total value is zero

    const { 
        taxStatusAllocation, 
        preTaxAllocation, 
        afterTaxAllocation, 
        nonRetirementAllocation, 
        taxExemptAllocation 
    } = strategy;

    // Helper to distribute value within a category based on sub-allocation
    const distributeValue = (allocationMap, totalCategoryValue, categoryInvestments) => {
        if (!allocationMap || Object.keys(allocationMap).length === 0 || categoryInvestments.length === 0) {
            // If no specific sub-allocation, distribute equally among existing investments in that category?
            // Or assume only investments listed in allocation map are targeted? For now, assume equal if no map.
            const perInvestmentValue = totalCategoryValue / categoryInvestments.length;
            categoryInvestments.forEach(inv => {
                targets[inv.name] = (targets[inv.name] || 0) + perInvestmentValue;
            });
            return;
        }

        let sumPct = 0;
        Object.values(allocationMap).forEach(pct => sumPct += pct);
        if (sumPct === 0) return; // Cannot allocate if percentages sum to zero

        for (const [name, percent] of Object.entries(allocationMap)) {
            targets[name] = (targets[name] || 0) + totalCategoryValue * (percent / sumPct);
        }
    };
    
    // Distribute based on tax status, then sub-allocate if maps exist
    const investmentGroups = {
        'pre-tax': investments.filter(inv => inv.accountTaxStatus === 'pre-tax'),
        'after-tax': investments.filter(inv => inv.accountTaxStatus === 'after-tax'),
        'non-retirement': investments.filter(inv => inv.accountTaxStatus === 'non-retirement'),
        'tax-exempt': investments.filter(inv => inv.accountTaxStatus === 'tax-exempt' || inv.investmentType?.taxability === 'tax-exempt') // Include tax-exempt type
    };

    distributeValue(preTaxAllocation, totalValue * (taxStatusAllocation['pre-tax'] / 100 || 0), investmentGroups['pre-tax']);
    distributeValue(afterTaxAllocation, totalValue * (taxStatusAllocation['after-tax'] / 100 || 0), investmentGroups['after-tax']);
    distributeValue(nonRetirementAllocation, totalValue * (taxStatusAllocation['non-retirement'] / 100 || 0), investmentGroups['non-retirement']);
    distributeValue(taxExemptAllocation, totalValue * (taxStatusAllocation['tax-exempt'] / 100 || 0), investmentGroups['tax-exempt']);

    return targets;
}


/**
 * Processes the rebalancing strategy for the current year.
 * Calculates target values and performs necessary sales and purchases.
 * MUTATES the yearState object directly.
 * 
 * @param {Object|null} rebalanceInfo - The rebalancing strategy object for the current year.
 * @param {Object} yearState - The current year's state object (will be modified).
 * @returns {Object} - The updated yearState object.
 */
function processRebalanceEvents(rebalanceInfo, yearState) {
    if (!rebalanceInfo || !rebalanceInfo.strategy) {
        console.log(`Year ${yearState.year}: No rebalance strategy active.`);
        return yearState;
    }

    console.log(`Year ${yearState.year}: Processing Rebalance Event.`);
    
    const strategy = rebalanceInfo.strategy; // Assuming glide path already resolved into strategy
    const targetValues = calculateTargetValues(yearState.investments, strategy);

    if (Object.keys(targetValues).length === 0) {
        console.log(`    No target values calculated, skipping rebalance.`);
        return yearState;
    }

    let sales = []; // { index, amount, investment }
    let purchases = []; // { index, amount, investment }
    let totalSellAmount = 0;
    let totalBuyAmount = 0;

    // Determine required sales and purchases
    yearState.investments.forEach((investment, index) => {
        const targetValue = targetValues[investment.name] || 0; // Default to 0 if not in target map
        const currentValue = investment.value || 0;
        const difference = targetValue - currentValue;

        if (difference < -0.01) { // Sell (allow for small floating point differences)
            const amountToSell = -difference;
            sales.push({ index, amount: amountToSell, investment });
            totalSellAmount += amountToSell;
        } else if (difference > 0.01) { // Buy
            const amountToBuy = difference;
            purchases.push({ index, amount: amountToBuy, investment });
            totalBuyAmount += amountToBuy;
        }
    });

    // Optional: Check for cash neutrality (should be close)
    if (Math.abs(totalSellAmount - totalBuyAmount) > 1.00) { // Allow $1 difference for rounding
        console.warn(`Year ${yearState.year}: Rebalance Warning: Total sells (${totalSellAmount.toFixed(2)}) differ significantly from total buys (${totalBuyAmount.toFixed(2)}).`);
    }

    // --- Process Sales --- 
    console.log(`Year ${yearState.year}: Rebalance - Processing Sales...`);
    sales.forEach(sale => {
        const { index, amount, investment } = sale;
        const currentValue = investment.value; // Value *before* sale
        const amountSold = Math.min(amount, currentValue); // Cannot sell more than exists
        
        if (amountSold <= 0) return; // Skip if negligible or zero
        
        const fractionSold = currentValue > 0 ? amountSold / currentValue : 1;

        console.log(`    Selling ${amountSold.toFixed(2)} from '${investment.name}'`);

        // Update value
        yearState.investments[index].value -= amountSold;

        // Calculate and track gains/losses (except for pre-tax)
        if (investment.accountTaxStatus !== 'pre-tax') {
            if (investment.costBasis !== undefined && investment.costBasis !== null) {
                const gain = amountSold - (fractionSold * investment.costBasis);
                yearState.curYearGains += gain;
                // Update cost basis
                yearState.investments[index].costBasis *= (1 - fractionSold);
                 console.log(`      Gain/Loss: ${gain.toFixed(2)}, New Basis: ${yearState.investments[index].costBasis.toFixed(2)}`);
            } else {
                 console.warn(`Year ${yearState.year} Rebalance Warn: Missing cost basis for sold investment '${investment.name}'. Cannot calculate gains/update basis.`);
            }
        }
    });

    // --- Process Purchases --- 
    console.log(`Year ${yearState.year}: Rebalance - Processing Purchases...`);
    purchases.forEach(purchase => {
        const { index, amount, investment } = purchase;
        
        if (amount <= 0) return; // Skip negligible buys
        
        console.log(`    Buying ${amount.toFixed(2)} for '${investment.name}'`);

        // Update value
        yearState.investments[index].value += amount;
        
        // Update cost basis (add purchase amount)
         if (yearState.investments[index].costBasis === undefined || yearState.investments[index].costBasis === null) {
             yearState.investments[index].costBasis = 0; // Initialize if missing
        }
        yearState.investments[index].costBasis += amount;
         console.log(`      New Basis: ${yearState.investments[index].costBasis.toFixed(2)}`);
    });

    // Recalculate totals (value changed directly)
    yearState.totalInvestmentValue = (yearState.investments || []).reduce((sum, inv) => sum + (inv?.value || 0), 0);
    yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash; // Cash unchanged by rebalance
    
    console.log(`Year ${yearState.year}: Finished Rebalance Event. Final Assets: ${yearState.totalAssets.toFixed(2)}`);

    return yearState;
}

module.exports = {
    processRebalanceEvents
};
