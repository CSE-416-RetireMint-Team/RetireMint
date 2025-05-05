/**
 * WithdrawalUtils.js - Utility functions for handling withdrawals.
 */

// Helper function (can be moved to a general utils if needed)
function calculateTotalAssets(investments, cash) {
    let totalInvestmentValue = 0;
    (investments || []).forEach(inv => { totalInvestmentValue += inv?.value || 0 });
    return totalInvestmentValue + cash;
}

/**
 * Performs withdrawals to cover a needed amount, first from cash, then investments per strategy.
 * MUTATES the yearState object directly.
 * 
 * @param {number} amountNeeded - The total amount that needs to be paid/withdrawn.
 * @param {Object} yearState - The current year's state object (will be modified).
 * @param {Array<string>} withdrawalStrategy - Ordered list of investment names.
 * @param {number|null} userAge - User's age for penalty checks.
 * @returns {{paidFromCash: number, withdrawnFromInvestments: number, totalPaid: number, updatedYearState: Object}} - Breakdown of payment sources and the mutated yearState.
 */
function performWithdrawal(amountNeeded, yearState, withdrawalStrategy, userAge) {
    let remainingNeeded = amountNeeded;
    let paidFromCash = 0;
    let withdrawnFromInvestments = 0;

    // 1. Use cash first
    const cashAvailable = yearState.cash;
    paidFromCash = Math.min(remainingNeeded, cashAvailable);
    yearState.cash -= paidFromCash;
    remainingNeeded -= paidFromCash;
    // console.log(`WithdrawalUtil: Used ${paidFromCash.toFixed(2)} cash. Remaining needed: ${remainingNeeded.toFixed(2)}`);

    // 2. Withdraw from investments if needed
    if (remainingNeeded > 0) {
        // console.log(`WithdrawalUtil: Need to withdraw ${remainingNeeded.toFixed(2)} from investments.`);
        if (!withdrawalStrategy || withdrawalStrategy.length === 0) {
            console.error(`Year ${yearState.year} Withdrawal Error: Withdrawal needed (${remainingNeeded.toFixed(2)}) but no withdrawal strategy defined!`);
            // Cannot proceed
        } else {
            for (const investmentName of withdrawalStrategy) {
                if (remainingNeeded <= 0) break; // Exit if requirement met

                const index = yearState.investments.findIndex(inv => inv.name === investmentName);
                if (index === -1) continue; // Investment not found or depleted

                const investment = yearState.investments[index];
                if (!investment.value || investment.value <= 0) continue; // Skip empty investments

                const amountToSell = Math.min(remainingNeeded, investment.value);
                if (amountToSell <= 0) continue;

                // console.log(`WithdrawalUtil: Withdrawing ${amountToSell.toFixed(2)} from '${investment.name}' (Value: ${investment.value.toFixed(2)}, Basis: ${investment.costBasis?.toFixed(2)})`);

                const fractionSold = investment.value > 0 ? amountToSell / investment.value : 1;
                let gain = 0;

                // Update state based on account type
                if (investment.accountTaxStatus === 'pre-tax') {
                    yearState.curYearIncome += amountToSell;
                    // console.log(`    Added ${amountToSell.toFixed(2)} to curYearIncome (Pre-tax withdrawal)`);
                } else {
                    if (investment.costBasis !== undefined && investment.costBasis !== null) {
                        gain = amountToSell - (fractionSold * investment.costBasis);
                        investment.costBasis *= (1 - fractionSold);
                        yearState.curYearGains += gain;
                        // console.log(`    Capital Gain/Loss: ${gain.toFixed(2)}. Updated Basis: ${investment.costBasis.toFixed(2)}. Added to curYearGains.`);
                    } else {
                        console.warn(`Year ${yearState.year} Withdrawal Warn: Missing cost basis for '${investment.name}'. Cannot calculate gains/update basis.`);
                    }
                }

                // Check early withdrawal penalty
                if ((investment.accountTaxStatus === 'pre-tax' || investment.accountTaxStatus === 'after-tax') && userAge !== null && userAge < 59) {
                    yearState.curYearEarlyWithdrawals += amountToSell;
                    // console.log(`    Added ${amountToSell.toFixed(2)} to curYearEarlyWithdrawals (Age ${userAge} < 59)`);
                }

                // Update investment value & track withdrawn amount
                investment.value -= amountToSell;
                withdrawnFromInvestments += amountToSell;
                remainingNeeded -= amountToSell;
                 // console.log(`    Updated '${investment.name}' value: ${investment.value.toFixed(2)}`);
            }
        }
    }
    
    const totalPaid = paidFromCash + withdrawnFromInvestments;
    const epsilon = 0.01; // Tolerance for floating point comparison (e.g., 1 cent)
    
    // Check if enough funds were obtained (using tolerance)
    if (amountNeeded - totalPaid > epsilon) {
         // Log error if we couldn't meet the full amountNeeded (within tolerance)
         console.error(`Year ${yearState.year} Withdrawal Error: Insufficient funds. Needed ${amountNeeded.toFixed(2)}, but only obtained ${totalPaid.toFixed(2)} (Cash: ${paidFromCash.toFixed(2)}, Investments: ${withdrawnFromInvestments.toFixed(2)}).`);
    }

    // Recalculate totals (important as direct state mutation occurred)
    yearState.totalInvestmentValue = (yearState.investments || []).reduce((sum, inv) => sum + (inv?.value || 0), 0);
    yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash; 

    return {
        paidFromCash,
        withdrawnFromInvestments,
        totalPaid, // This is the amount actually paid/withdrawn
        updatedYearState: yearState // Return mutated state (though mutation happened in place)
    };
}

module.exports = {
    performWithdrawal,
    calculateTotalAssets // Export if needed elsewhere
}; 