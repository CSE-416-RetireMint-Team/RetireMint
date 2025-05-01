/**
 * DiscretionaryExpenses.js - Module for processing discretionary expenses
 * 
 * This module handles:
 * 1. Processing discretionary expense events
 * 2. Checking against financial goal constraints
 * 3. Withdrawing from investments to cover expenses
 * 4. Tracking capital gains and income
 */

const { sellInvestment } = require('./NonDiscretionaryExpenses');

/**
 * Calculate the total assets value
 * @param {Array} investments - Array of all investments
 * @returns {Number} - Total assets value
 */
function calculateTotalAssets(investments) {
  if (!investments || !Array.isArray(investments)) {
    return 0;
  }
  
  return investments.reduce((total, inv) => total + (inv.value || 0), 0);
}

/**
 * Process discretionary expenses
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated year state
 */
function processDiscretionaryExpenses(params, yearState) {
  const { financialGoal, expenseWithdrawalStrategies, events } = params;
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Initialize tracking variables if not already present
  updatedYearState.curYearIncome = updatedYearState.curYearIncome || 0;
  updatedYearState.curYearGains = updatedYearState.curYearGains || 0;
  updatedYearState.curYearEarlyWithdrawals = updatedYearState.curYearEarlyWithdrawals || 0;
  
  // Filter to include only discretionary expense events that are active this year
  const activeDiscretionaryEvents = events.filter(event => 
    event.type === 'expense' && 
    event.expense.isDiscretionary &&
    event.startYear <= updatedYearState.year &&
    (event.startYear + event.duration > updatedYearState.year)
  );
  
  // No processing needed if no discretionary expenses
  if (activeDiscretionaryEvents.length === 0) {
    return updatedYearState;
  }
  
  // Calculate current total assets
  const totalAssets = calculateTotalAssets(updatedYearState.investments);
  
  // Find the cash investment
  const cashInvestmentIndex = updatedYearState.investments.findIndex(
    inv => inv.name.toLowerCase().includes('cash')
  );
  
  if (cashInvestmentIndex < 0) {
    return updatedYearState; // Can't pay if no cash investment exists
  }
  
  const cashInvestment = updatedYearState.investments[cashInvestmentIndex];
  
  // Process each discretionary expense event
  for (const event of activeDiscretionaryEvents) {
    // Calculate expense amount (similar to non-discretionary expenses)
    let amount = event.expense.initialAmount;
    
    // Apply expected annual change if this isn't the first year
    if (updatedYearState.year > event.startYear) {
      // This would be handled by a separate function similar to income events
      // For simplicity, assuming a fixed 2% increase per year
      const yearsElapsed = updatedYearState.year - event.startYear;
      amount *= Math.pow(1.02, yearsElapsed);
    }
    
    // Apply inflation adjustment if enabled
    if (event.expense.inflationAdjustment) {
      amount *= (1 + updatedYearState.inflationRate);
    }
    
    // Check if this expense would violate the financial goal
    if (totalAssets - amount < financialGoal) {
      // Only spend what we can without violating the financial goal
      amount = Math.max(0, totalAssets - financialGoal);
      
      // If we can't spend anything, skip this expense
      if (amount <= 0) {
        continue;
      }
    }
    
    // Check if cash is enough to cover this expense
    if (cashInvestment.value >= amount) {
      // If cash is enough, just reduce it
      cashInvestment.value -= amount;
      updatedYearState.investments[cashInvestmentIndex] = cashInvestment;
    } else {
      // If cash is not enough, pay what we can with cash
      let remainingPayment = amount - cashInvestment.value;
      cashInvestment.value = 0; // Use all available cash
      updatedYearState.investments[cashInvestmentIndex] = cashInvestment;
      
      // Need to withdraw from other investments according to expense withdrawal strategy
      
      // Order investments according to withdrawal strategy
      const orderedInvestments = [];
      
      // Filter out the cash investment and any with zero value
      const nonCashInvestments = updatedYearState.investments.filter(
        inv => !inv.name.toLowerCase().includes('cash') && inv.value > 0
      );
      
      if (expenseWithdrawalStrategies && expenseWithdrawalStrategies.length > 0) {
        for (const strategyName of expenseWithdrawalStrategies) {
          const investment = nonCashInvestments.find(inv => inv.name === strategyName);
          if (investment) {
            orderedInvestments.push(investment);
          }
        }
        
        // Add any investments not in the strategy
        for (const investment of nonCashInvestments) {
          if (!orderedInvestments.includes(investment)) {
            orderedInvestments.push(investment);
          }
        }
      } else {
        // If no strategy, use all non-cash investments in their original order
        orderedInvestments.push(...nonCashInvestments);
      }
      
      // Process withdrawals in order until the payment is covered
      for (let i = 0; i < orderedInvestments.length; i++) {
        if (remainingPayment <= 0) break;
        
        const investmentName = orderedInvestments[i].name;
        const investmentIndex = updatedYearState.investments.findIndex(
          inv => inv.name === investmentName
        );
        
        if (investmentIndex >= 0) {
          const result = sellInvestment(
            updatedYearState.investments[investmentIndex], 
            remainingPayment
          );
          
          // Update investment
          updatedYearState.investments[investmentIndex] = result.investment;
          
          // Update tracking variables
          updatedYearState.curYearGains += result.capitalGain;
          
          if (result.preTaxWithdrawal > 0) {
            updatedYearState.curYearIncome += result.preTaxWithdrawal;
          }
          
          // If user is under 59.5, track early withdrawals
          if (updatedYearState.userAge < 59.5 && result.earlyWithdrawal > 0) {
            updatedYearState.curYearEarlyWithdrawals += result.earlyWithdrawal;
          }
          
          // Reduce remaining payment
          remainingPayment -= result.sellAmount;
        }
      }
    }
  }
  
  return updatedYearState;
}

module.exports = {
  processDiscretionaryExpenses,
  calculateTotalAssets
}; 