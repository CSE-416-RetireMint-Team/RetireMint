/**
 * RequiredMinimumDistributions.js
 * 
 * Calculates and processes Required Minimum Distributions (RMDs) for a given year.
 */

const { performWithdrawal } = require('../Utils/WithdrawalUtils'); // Import withdrawal utility

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
 * @param {Object} previousYearState - State object from the previous year's simulation (optional, for initial RMD)
 * @returns {Object} - Object containing the updated year state and the total RMD income generated.
 *                     { updatedYearState: Object, rmdIncome: Number }
 */
function processRequiredMinimumDistributions(rmdStrategies, rmdTables, userAge, yearState, previousYearState = null) {
    
    let totalRmdIncomeThisYear = 0;
    
    // --- Basic Validation ---
    if (!rmdStrategies || rmdStrategies.length === 0 || !rmdTables || rmdTables.length === 0) {
        // No RMD strategies or data, return state unchanged
        return { updatedYearState: yearState, rmdIncome: 0 };
    }
    
    // RMDs typically start at age 73 (check latest IRS rules if needed)
    if (!userAge || userAge < 73) {
        return { updatedYearState: yearState, rmdIncome: 0 };
    }

    // --- Select the Correct RMD Table (Assuming Uniform Lifetime for now) ---
    const uniformLifetimeTable = rmdTables.find(table => table.tableType && table.tableType.includes('Uniform Lifetime'));
    
    if (!uniformLifetimeTable || !uniformLifetimeTable.rows || uniformLifetimeTable.rows.length === 0) {
        console.warn(`Year ${yearState.year}: Uniform Lifetime RMD table not found or has no rows in provided taxData. Skipping RMD.`);
        return { updatedYearState: yearState, rmdIncome: 0 };
    }
    
    // --- Find the RMD factor (distribution period) for the user's age within the selected table's rows ---
    const rmdRow = uniformLifetimeTable.rows.find(row => row.age === userAge);
    
    if (!rmdRow || typeof rmdRow.distributionPeriod !== 'number' || rmdRow.distributionPeriod <= 0) {
        console.warn(`Year ${yearState.year}: Could not find valid RMD distribution period for age ${userAge} in the Uniform Lifetime table. Skipping RMD.`);
        return { updatedYearState: yearState, rmdIncome: 0 };
    }
    const rmdDistributionPeriod = rmdRow.distributionPeriod;

    // --- Determine Previous Year's Relevant Account Balances ---
    // RMD is based on the PREVIOUS year's Dec 31 balance of pre-tax retirement accounts.
    let previousYearPreTaxBalance = 0;
    if (previousYearState && previousYearState.investments) {
        previousYearState.investments.forEach(inv => {
            if (inv.taxStatus === 'pre-tax') {
                previousYearPreTaxBalance += (inv.value || 0);
            }
        });
    } else if (yearState.year === new Date().getFullYear()) { // Very first year handling
         // Use initial balances if it's the absolute first year of the overall simulation
         (yearState.investments || []).forEach(inv => {
             if (inv.taxStatus === 'pre-tax') {
                 previousYearPreTaxBalance += (inv.value || 0); // Use initial value as proxy
             }
         });
    }
    
    if (previousYearPreTaxBalance <= 0) {
        // No pre-tax balance from previous year, no RMD needed.
        return { updatedYearState: yearState, rmdIncome: 0 };
    }

    // --- Calculate Total RMD Amount ---
    const totalRmdAmount = previousYearPreTaxBalance / rmdDistributionPeriod; // Use the correct period
    // console.log(`Year ${yearState.year} (Age ${userAge}): Prev PreTax Balance: ${previousYearPreTaxBalance.toFixed(2)}, RMD Period: ${rmdDistributionPeriod}, Calculated RMD: ${totalRmdAmount.toFixed(2)}`);

    if (totalRmdAmount <= 0) {
        return { updatedYearState: yearState, rmdIncome: 0 };
    }

    // --- Process RMD Withdrawal and Reinvestment ---
    // Use the first defined RMD strategy for simplicity.
    // A more complex system could allow multiple/conditional strategies.
    const strategy = rmdStrategies[0]; 
    
    // 1. Withdraw RMD Amount from Pre-Tax Accounts
    // We need to withdraw `totalRmdAmount` using the withdrawal order defined in the strategy.
    // This uses a simplified withdrawal logic similar to expenses.
    
    let amountToWithdraw = totalRmdAmount;
    let withdrawnFunds = 0;
    let earlyWithdrawalAmount = 0; // RMDs are generally not penalized if taken after 59.5, but track for consistency if needed.
    
    // Use the utility function for withdrawal
    const withdrawalResult = performWithdrawal(amountToWithdraw, yearState, strategy.withdrawalOrder || ['pre-tax'], userAge);
    
    // Update state based on withdrawal result
    yearState = withdrawalResult.updatedYearState;
    withdrawnFunds = withdrawalResult.amountWithdrawn;
    totalRmdIncomeThisYear = withdrawnFunds; // RMD withdrawal IS income
    // Note: performWithdrawal handles the reduction in investment values and increase in cash.
    // RMDs themselves don't typically incur *early* withdrawal penalties if taken at the correct age (>= 73). 
    // The performWithdrawal function handles penalties based on age < 59.5, which shouldn't apply here.
    // We will still track potential gains if taxable accounts were unexpectedly needed.
    yearState.curYearGains += withdrawalResult.capitalGainsRealized;
    // Add the withdrawn amount (which is income) to curYearIncome
    yearState.curYearIncome += withdrawnFunds;

    // Check if the full RMD could be withdrawn
    if (withdrawnFunds < totalRmdAmount) {
        console.warn(`Year ${yearState.year}: Could only withdraw ${withdrawnFunds.toFixed(2)} out of required ${totalRmdAmount.toFixed(2)} RMD.`);
        // Potential penalty implications in real life, but we just log here.
    }

    // 2. Reinvest the Withdrawn Amount (if specified)
    // RMD funds land in cash first due to performWithdrawal. Now check reinvestment.
    const reinvestmentTarget = strategy.reinvestmentTarget;
    if (reinvestmentTarget && withdrawnFunds > 0) {
        let amountToReinvest = withdrawnFunds; 
        let reinvestedSuccessfully = false;

        // Find the target investment account
        const targetInvestment = yearState.investments.find(inv => inv.name === reinvestmentTarget);
        
        if (targetInvestment && yearState.cash >= amountToReinvest) {
            // Decrease cash
            yearState.cash -= amountToReinvest;
            
            // Increase value of target investment
            targetInvestment.value += amountToReinvest;
            
            // Update cost basis: Reinvestments are generally treated as new contributions/purchases
            // For simplicity, add to existing cost basis. More accurate would track lots.
            targetInvestment.costBasis = (targetInvestment.costBasis || 0) + amountToReinvest;
            
            reinvestedSuccessfully = true;
            // console.log(`Year ${yearState.year}: Reinvested RMD amount ${amountToReinvest.toFixed(2)} into ${reinvestmentTarget}.`);
        } else if (!targetInvestment) {
            console.warn(`Year ${yearState.year}: RMD reinvestment target account '${reinvestmentTarget}' not found.`);
        } else { // Not enough cash (shouldn't happen if withdrawal worked, but check)
            console.warn(`Year ${yearState.year}: Not enough cash (${yearState.cash.toFixed(2)}) to reinvest RMD amount ${amountToReinvest.toFixed(2)}.`);
        }
    } 
    // If no reinvestment target or reinvestment failed, the money stays in cash.

    // Return the updated state and the RMD income amount
    return { updatedYearState: yearState, rmdIncome: totalRmdIncomeThisYear };
}

module.exports = {
    processRequiredMinimumDistributions
};
