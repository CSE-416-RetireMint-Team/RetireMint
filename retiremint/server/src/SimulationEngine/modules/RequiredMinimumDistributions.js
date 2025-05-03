/**
 * RequiredMinimumDistributions.js
 * 
 * Calculates and processes Required Minimum Distributions (RMDs) for a given year.
 */

/**
 * Finds or creates a target investment account for RMD withdrawals.
 * 
 * @param {Array} investments - The current list of investments in yearState.
 * @param {Object} sourceInvestment - The pre-tax investment being withdrawn from.
 * @param {string} targetTaxStatus - The desired tax status (e.g., 'non-retirement').
 * @returns {Object} The found or newly created target investment object.
 */
function findOrCreateTargetAccount(investments, sourceInvestment, targetTaxStatus) {
    // Look for an existing investment with the same type and target status
    let targetAccount = investments.find(inv => 
        inv.investmentType?._id?.toString() === sourceInvestment.investmentType?._id?.toString() && 
        inv.accountTaxStatus === targetTaxStatus
    );

    if (!targetAccount) {
        // Create a new one if not found
        // console.log(`Creating new ${targetTaxStatus} account for RMD transfer from ${sourceInvestment.name}`);
        targetAccount = {
            // Try to create a meaningful name
            name: `${sourceInvestment.investmentType?.name || 'UnknownType'} (${targetTaxStatus})`, 
            value: 0, 
            investmentType: sourceInvestment.investmentType, // Reference the same type
            accountTaxStatus: targetTaxStatus,
             // Add other necessary fields if required by schema (e.g., _id, purchasePrice)
             // For simplicity, we'll let the main structure handle potential additions later if needed
             // We might need a mechanism to generate unique IDs if creating new DB entries eventually.
             _id: `temp-rmd-${Date.now()}-${Math.random()}` // Temporary ID for simulation tracking
        };
        investments.push(targetAccount);
    }
    return targetAccount;
}

/**
 * Processes Required Minimum Distributions (RMDs) for the simulation year.
 * 
 * @param {Array} rmdStrategies - Ordered list of pre-tax investment names for withdrawal.
 * @param {Array} rmdTables - RMD lookup tables from taxData.
 * @param {number} userAge - The user's age in the current simulation year.
 * @param {Object} yearState - The current state of the simulation year (will be modified).
 * @param {Object} previousYearState - The state from the previous year (for end-of-year balances).
 * @returns {Object} The updated yearState object.
 */
function processRequiredMinimumDistributions(rmdStrategies, rmdTables, userAge, yearState, previousYearState) {
    // 3a: RMDs start in the year the user turns 74 (based on prior year balance when turning 73)
    if (!userAge || userAge < 74 || !previousYearState) {
        // console.log(`Year ${yearState.year}: Skipping RMD (Age: ${userAge}, No Prev State: ${!previousYearState})`);
        return yearState; // No RMD applicable
    }

    // Ensure we have previous year's investments to calculate RMD base
    const prevInvestments = previousYearState.investments;
    if (!prevInvestments || prevInvestments.length === 0) {
        // console.log(`Year ${yearState.year}: Skipping RMD (No previous investments)`);
        return yearState; // Cannot calculate RMD base
    }

    // 3c: Calculate 's', the sum of values of pre-tax investments at the END of the PREVIOUS year.
    const s = prevInvestments.reduce((sum, inv) => {
        if (inv.accountTaxStatus === 'pre-tax') {
            return sum + (inv.value || 0);
        }
        return sum;
    }, 0);

    if (s <= 0) {
        // console.log(`Year ${yearState.year}: Skipping RMD (Previous pre-tax balance is zero or negative)`);
        return yearState; // No RMD required if pre-tax balance was zero
    }

    // 3b: Find the distribution period 'd'. Assume only one relevant table (Uniform Lifetime) for now.
    // Use the most recent RMD table available (in case taxData has multiple years)
    const sortedRmdTables = rmdTables ? [...rmdTables].sort((a, b) => b.year - a.year) : [];
    const rmdTableToUse = sortedRmdTables[0]; // Use the latest

    if (!rmdTableToUse || !rmdTableToUse.rows) {
        console.error(`Year ${yearState.year}: RMD Table or its rows not found. Cannot calculate RMD.`);
        return yearState;
    }

    // Find the row for the user's CURRENT age in the RMD table.
    // Note: RMD for Year X is based on balance Dec 31 Year (X-1) and Age in Year X.
    const rmdRow = rmdTableToUse.rows.find(row => row.age === userAge);
    if (!rmdRow || !rmdRow.distributionPeriod || rmdRow.distributionPeriod <= 0) {
        console.error(`Year ${yearState.year}: RMD distribution period not found or invalid for age ${userAge}. Cannot calculate RMD.`);
        return yearState;
    }
    const d = rmdRow.distributionPeriod;

    // 3d: Calculate RMD amount
    const rmd = s / d;
    if (rmd <= 0) {
        // console.log(`Year ${yearState.year}: Calculated RMD is zero or negative.`);
        return yearState; // No withdrawal needed
    }
    
    // Calculate RMD percentage
    const rmdPercentage = s > 0 ? (rmd / s) * 100 : 0;
    const rmdTableYear = rmdTableToUse?.year || 'Unknown'; // Get year from the table used
    
    // console.log(`Year ${yearState.year}: RMD Calculation - Prev PreTax Bal (s): ${s.toFixed(2)}, Age: ${userAge}, Period (d): ${d} (from ${rmdTableYear} table), RMD Amount: ${rmd.toFixed(2)} (${rmdPercentage.toFixed(2)}% of balance)`);

    // 3e: Update taxable income for the current year
    yearState.curYearIncome = (yearState.curYearIncome || 0) + rmd;

    // 3f & 3g: Process withdrawals according to the strategy
    let rmdAmountWithdrawn = 0;
    let rmdAmountRemaining = rmd;

    if (!rmdStrategies || rmdStrategies.length === 0) {
        console.warn(`Year ${yearState.year}: RMD required (${rmd.toFixed(2)}) but no RMD withdrawal strategy defined.`);
        // Withdraw from cash? Or just log? For now, log and don't modify investments further.
        // The income is already added. This could lead to negative cash if not handled by expense logic.
        return yearState;
    }

    for (const sourceInvestmentName of rmdStrategies) {
        if (rmdAmountRemaining <= 0) break; // RMD met

        // Find the source pre-tax investment in the CURRENT state
        const sourceInvestment = yearState.investments.find(inv => 
            inv.name === sourceInvestmentName && 
            inv.accountTaxStatus === 'pre-tax'
        );

        if (!sourceInvestment || sourceInvestment.value <= 0) {
            // console.log(`Year ${yearState.year}: RMD source ${sourceInvestmentName} not found or has zero value.`);
            continue; // Skip to next investment in strategy
        }

        const amountToWithdrawFromThisSource = Math.min(rmdAmountRemaining, sourceInvestment.value);

        // Find or create the target non-retirement account
        const targetAccount = findOrCreateTargetAccount(yearState.investments, sourceInvestment, 'non-retirement');

        // Perform the transfer
        sourceInvestment.value -= amountToWithdrawFromThisSource;
        targetAccount.value += amountToWithdrawFromThisSource;
        rmdAmountWithdrawn += amountToWithdrawFromThisSource;
        rmdAmountRemaining -= amountToWithdrawFromThisSource;
        
        // console.log(`Year ${yearState.year}: RMD Transfer - Withdrew ${amountToWithdrawFromThisSource.toFixed(2)} from ${sourceInvestment.name}, Remaining RMD: ${rmdAmountRemaining.toFixed(2)}`);
    }

    if (rmdAmountRemaining > 0.01) { // Use a small threshold for floating point issues
        // console.warn(`Year ${yearState.year}: RMD of ${rmd.toFixed(2)} could not be fully met from strategy accounts. Withdrawn: ${rmdAmountWithdrawn.toFixed(2)}, Shortfall: ${rmdAmountRemaining.toFixed(2)}`);
        // The income portion is already added. Need to decide how to handle shortfall.
        // Withdraw from cash? This might happen in expense processing.
        // For now, just log the warning.
    }

    return yearState;
}

module.exports = {
    processRequiredMinimumDistributions
};
