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
    if (!strategy) return targets; // Strategy must exist

    // Identify RMD/Roth/Pre-tax accounts
    const excludedInvestments = investments.filter(inv => 
        inv.name.includes('(RMD)') || 
        inv.name.includes('(Roth)') ||
        inv.accountTaxStatus === 'pre-tax'
    );
    const rebalancableInvestments = investments.filter(inv => 
        !inv.name.includes('(RMD)') && 
        !inv.name.includes('(Roth)') &&
        inv.accountTaxStatus !== 'pre-tax'
    );
    
    // Set targets for excluded investments to their current value initially
    // This prevents them from being bought or sold unless overridden by a specific sub-allocation (like preTaxAllocation)
    excludedInvestments.forEach(inv => {
        targets[inv.name] = inv.value || 0;
    });

    // --- Handle Overall Rebalancing by Tax Status (excluding pre-tax) --- 
    if (strategy.taxStatusAllocation) {
        const totalValueToRebalance = rebalancableInvestments.reduce((sum, inv) => sum + (inv?.value || 0), 0);

        if (totalValueToRebalance > 0) {
    const { 
        taxStatusAllocation, 
                // preTaxAllocation, // Handled separately below
        afterTaxAllocation, 
        nonRetirementAllocation, 
        taxExemptAllocation 
    } = strategy;

    // Helper to distribute value within a category based on sub-allocation
            // This helper now only operates on the rebalancable investments
    const distributeValue = (allocationMap, totalCategoryValue, categoryInvestments) => {
                 // No need to filter RMD/Roth/PreTax here as categoryInvestments comes from rebalancableInvestments
                 if (categoryInvestments.length === 0 || totalCategoryValue <= 0) return; // Skip if no investments in category or no value to distribute
                
                 if (!allocationMap || Object.keys(allocationMap).length === 0) {
                    // Distribute equally among eligible investments in this category if no specific map
            const perInvestmentValue = totalCategoryValue / categoryInvestments.length;
            categoryInvestments.forEach(inv => {
                        // Add to target, don't overwrite potential preTaxAllocation target set later
                targets[inv.name] = (targets[inv.name] || 0) + perInvestmentValue;
            });
            return;
        }

                 // Calculate sumPct based only on investments present in the category investments
                 let relevantSumPct = 0;
                 const relevantEntries = Object.entries(allocationMap).filter(([name, percent]) => 
                     categoryInvestments.some(inv => inv.name === name)
                 );
                 relevantEntries.forEach(([name, percent]) => relevantSumPct += (percent || 0));
                 
                 if (relevantSumPct <= 0) { // Use <= 0 to handle potential negative percentages safely
                     // If relevant percentages sum to zero or less, distribute equally among the relevant investments
                     if (relevantEntries.length > 0) {
                         const perInvestmentValue = totalCategoryValue / relevantEntries.length;
                         relevantEntries.forEach(([name, percent]) => {
                              // Add to target, don't overwrite potential preTaxAllocation target set later
                             targets[name] = (targets[name] || 0) + perInvestmentValue; 
                         });
                     }
                     return; 
                 }

                 for (const [name, percent] of relevantEntries) {
                     // Add to target, don't overwrite potential preTaxAllocation target set later
                     targets[name] = (targets[name] || 0) + totalCategoryValue * ((percent || 0) / relevantSumPct);
        }
    };
    
            // Create investment groups from rebalancable investments ONLY
    const investmentGroups = {
                // 'pre-tax': [], // Excluded from this calculation
                'after-tax': rebalancableInvestments.filter(inv => inv.accountTaxStatus === 'after-tax'),
                'non-retirement': rebalancableInvestments.filter(inv => inv.accountTaxStatus === 'non-retirement'),
                'tax-exempt': rebalancableInvestments.filter(inv => inv.accountTaxStatus === 'tax-exempt' || inv.investmentType?.taxability === 'tax-exempt')
            };
            
            // Calculate allocation percentages only for included categories
            const includedCategories = ['after-tax', 'non-retirement', 'tax-exempt'];
            let totalIncludedPercent = 0;
            includedCategories.forEach(cat => totalIncludedPercent += (taxStatusAllocation[cat] || 0));
            
            // Distribute value based on renormalized percentages for included categories
            if (totalIncludedPercent > 0) {
                 distributeValue(afterTaxAllocation, totalValueToRebalance * (taxStatusAllocation['after-tax'] || 0) / totalIncludedPercent, investmentGroups['after-tax']);
                 distributeValue(nonRetirementAllocation, totalValueToRebalance * (taxStatusAllocation['non-retirement'] || 0) / totalIncludedPercent, investmentGroups['non-retirement']);
                 distributeValue(taxExemptAllocation, totalValueToRebalance * (taxStatusAllocation['tax-exempt'] || 0) / totalIncludedPercent, investmentGroups['tax-exempt']);
            } else {
                // If only pre-tax had allocation percent, distribute equally among all rebalancable groups?
                // Or do nothing? Let's do nothing for now, as RMD/Roth/PreTax targets are already set.
            }
        }
    }

    // --- Handle Specific Rebalancing WITHIN Pre-Tax Accounts (if preTaxAllocation map exists) --- 
    if (strategy.preTaxAllocation && Object.keys(strategy.preTaxAllocation).length > 0) {
        const preTaxInvestments = investments.filter(inv => inv.accountTaxStatus === 'pre-tax');
        const totalPreTaxValue = preTaxInvestments.reduce((sum, inv) => sum + (inv?.value || 0), 0);
        
        if (totalPreTaxValue > 0 && preTaxInvestments.length > 0) {
            const preTaxTargets = {}; // Temporary targets for this group
            let preTaxSumPct = 0;
            const preTaxEntries = Object.entries(strategy.preTaxAllocation).filter(([name, percent]) =>
                preTaxInvestments.some(inv => inv.name === name)
            );
            preTaxEntries.forEach(([name, percent]) => preTaxSumPct += (percent || 0));

            if (preTaxSumPct > 0) {
                 preTaxEntries.forEach(([name, percent]) => {
                     preTaxTargets[name] = totalPreTaxValue * ((percent || 0) / preTaxSumPct);
                 });
            } else if (preTaxEntries.length > 0) {
                // If percentages sum to 0, distribute equally among targeted pre-tax accounts
                 const perInvestmentValue = totalPreTaxValue / preTaxEntries.length;
                 preTaxEntries.forEach(([name, percent]) => {
                    preTaxTargets[name] = perInvestmentValue;
                 });
            }
            
            // Ensure any pre-tax accounts NOT targeted by the map retain their value
            preTaxInvestments.forEach(inv => {
                if (!(inv.name in preTaxTargets)) {
                    preTaxTargets[inv.name] = inv.value || 0;
                }
            });
            
            // Overwrite the main targets ONLY for the pre-tax investments
            Object.assign(targets, preTaxTargets);
        }
    }

    return targets;
}


/**
 * Processes the rebalancing strategy for the current year.
 * Calculates target values and performs necessary sales and purchases.
 * MUTATES the yearState object directly.
 * 
 * @param {Object | null} currentRebalanceInfo - Rebalance info for the current year, or null.
 * @param {Object} yearState - The current year's state object (will be modified).
 * @param {Array} currentYearEventsLog - Array to push log entries into.
 * @returns {Object} - The potentially modified yearState object.
 */
function processRebalanceEvents(currentYearEventsLog, currentRebalanceInfo, yearState) {
    if (!currentRebalanceInfo || !currentRebalanceInfo.strategy) {
        // console.log(`Year ${yearState.year}: No rebalance strategy active.`);
        return yearState;
    }

    // console.log(`Year ${yearState.year}: Processing Rebalance Event.`);
    
    const strategy = currentRebalanceInfo.strategy; // Assuming glide path already resolved into strategy
    const targetValues = calculateTargetValues(yearState.investments, strategy);

    // Add a summary log entry when a rebalance strategy is active
    currentYearEventsLog.push({
        year: yearState.year,
        type: 'rebalance',
        details: `Applied rebalance strategy with method: ${currentRebalanceInfo.method || 'default'}`
    });

    if (Object.keys(targetValues).length === 0) {
        // console.log(`    No target values calculated, skipping rebalance.`);
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
        // console.warn(`Year ${yearState.year}: Rebalance Warning: Total sells (${totalSellAmount.toFixed(2)}) differ significantly from total buys (${totalBuyAmount.toFixed(2)}).`);
    }

    // --- Process Sales --- 
    // console.log(`Year ${yearState.year}: Rebalance - Processing Sales...`);
    sales.forEach(sale => {
        const { index, amount, investment } = sale;
        const currentValue = investment.value; // Value *before* sale
        const amountSold = Math.min(amount, currentValue); // Cannot sell more than exists
        
        if (amountSold <= 0) return; // Skip if negligible or zero
        
        const fractionSold = currentValue > 0 ? amountSold / currentValue : 1;

        // console.log(`    Selling ${amountSold.toFixed(2)} from '${investment.name}'`);

        // Update value
        yearState.investments[index].value -= amountSold;

        // Calculate and track gains/losses (except for pre-tax)
        if (investment.accountTaxStatus !== 'pre-tax') {
            if (investment.costBasis !== undefined && investment.costBasis !== null) {
                const gain = amountSold - (fractionSold * investment.costBasis);
                yearState.curYearGains += gain;
                // Update cost basis
                yearState.investments[index].costBasis *= (1 - fractionSold);
                // Log sale action
                currentYearEventsLog.push({
                    year: yearState.year,
                    type: 'rebalance',
                    details: `Sold ${amountSold.toFixed(2)} from '${investment.name}'. Gain/Loss: ${gain.toFixed(2)}, New Basis: ${yearState.investments[index].costBasis.toFixed(2)}`
                });
            } else {
                 // Keep this warning
                 console.warn(`Year ${yearState.year} Rebalance Warn: Missing cost basis for sold investment '${investment.name}'. Cannot calculate gains/update basis.`);
            }
        }
    });

    // --- Process Purchases --- 
    // console.log(`Year ${yearState.year}: Rebalance - Processing Purchases...`);
    purchases.forEach(purchase => {
        const { index, amount, investment } = purchase;
        
        if (amount <= 0) return; // Skip negligible buys
        
        // console.log(`    Buying ${amount.toFixed(2)} for '${investment.name}'`);

        // Update value
        yearState.investments[index].value += amount;
        
        // Update cost basis (add purchase amount)
         if (yearState.investments[index].costBasis === undefined || yearState.investments[index].costBasis === null) {
             yearState.investments[index].costBasis = 0; // Initialize if missing
        }
        yearState.investments[index].costBasis += amount;
        
        // Log purchase action
        currentYearEventsLog.push({
            year: yearState.year,
            type: 'rebalance',
            details: `Purchased ${amount.toFixed(2)} for '${investment.name}'. New Basis: ${yearState.investments[index].costBasis.toFixed(2)}`
        });
    });

    // Recalculate totals (value changed directly)
    yearState.totalInvestmentValue = (yearState.investments || []).reduce((sum, inv) => sum + (inv?.value || 0), 0);
    yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash; // Cash unchanged by rebalance
    
    // console.log(`Year ${yearState.year}: Finished Rebalance Event. Final Assets: ${yearState.totalAssets.toFixed(2)}`);

    // Always log that rebalancing was attempted if info was present
    /* // REMOVED Overall strategy log - replaced by individual logs
    currentYearEventsLog.push({
        year: yearState.year,
        type: 'rebalance',
        details: `Applied Rebalance Strategy. Method: ${currentRebalanceInfo.method}. Target Strategy: ${JSON.stringify(currentRebalanceInfo.strategy)}`
    });
    */

    return yearState;
}

module.exports = {
    processRebalanceEvents
};
