/**
 * NonDiscretionaryExpenses.js - Module for processing non-discretionary expenses and taxes
 * 
 * This module handles:
 * 1. Calculating taxes from the previous year
 * 2. Processing non-discretionary expense events
 * 3. Making withdrawals from investments to cover expenses
 * 4. Tracking capital gains and income from withdrawals
 */

/**
 * Calculate federal income tax
 * @param {Number} taxableIncome - Taxable income for the year
 * @param {Array} federalIncomeTaxBrackets - Federal income tax brackets
 * @param {Number} standardDeduction - Standard deduction amount
 * @returns {Number} - Federal income tax amount
 */
function calculateFederalIncomeTax(taxableIncome, federalIncomeTaxBrackets, standardDeduction) {
  if (!federalIncomeTaxBrackets || !Array.isArray(federalIncomeTaxBrackets)) {
    return 0;
  }
  
  // Apply standard deduction
  const afterDeduction = Math.max(0, taxableIncome - standardDeduction);
  
  // Sort brackets by lower bound
  const sortedBrackets = [...federalIncomeTaxBrackets].sort((a, b) => a.lowerBound - b.lowerBound);
  
  let tax = 0;
  let remainingIncome = afterDeduction;
  
  // Calculate tax for each bracket
  for (let i = 0; i < sortedBrackets.length; i++) {
    const bracket = sortedBrackets[i];
    const nextBracket = i < sortedBrackets.length - 1 ? sortedBrackets[i + 1] : null;
    
    if (remainingIncome <= 0) break;
    
    // Calculate taxable amount in this bracket
    let taxableInBracket;
    if (!nextBracket) {
      // This is the highest bracket, tax all remaining income
      taxableInBracket = remainingIncome;
    } else {
      // Tax only the portion within this bracket
      taxableInBracket = Math.min(remainingIncome, nextBracket.lowerBound - bracket.lowerBound);
    }
    
    // Add tax for this bracket
    tax += taxableInBracket * bracket.rate;
    
    // Reduce remaining income
    remainingIncome -= taxableInBracket;
  }
  
  return tax;
}

/**
 * Calculate state income tax
 * @param {Number} taxableIncome - Taxable income for the year
 * @param {Array} stateTaxBrackets - State income tax brackets
 * @returns {Number} - State income tax amount
 */
function calculateStateIncomeTax(taxableIncome, stateTaxBrackets) {
  if (!stateTaxBrackets || !Array.isArray(stateTaxBrackets)) {
    return 0;
  }
  
  // Sort brackets by lower bound
  const sortedBrackets = [...stateTaxBrackets].sort((a, b) => a.lowerBound - b.lowerBound);
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  // Calculate tax for each bracket
  for (let i = 0; i < sortedBrackets.length; i++) {
    const bracket = sortedBrackets[i];
    const nextBracket = i < sortedBrackets.length - 1 ? sortedBrackets[i + 1] : null;
    
    if (remainingIncome <= 0) break;
    
    // Calculate taxable amount in this bracket
    let taxableInBracket;
    if (!nextBracket) {
      // This is the highest bracket, tax all remaining income
      taxableInBracket = remainingIncome;
    } else {
      // Tax only the portion within this bracket
      taxableInBracket = Math.min(remainingIncome, nextBracket.lowerBound - bracket.lowerBound);
    }
    
    // Add tax for this bracket
    tax += taxableInBracket * bracket.rate;
    
    // Reduce remaining income
    remainingIncome -= taxableInBracket;
  }
  
  return tax;
}

/**
 * Calculate capital gains tax
 * @param {Number} capitalGains - Capital gains for the year
 * @param {Array} capitalGainsTaxBrackets - Capital gains tax brackets
 * @param {Number} taxableIncome - Taxable income (used to determine bracket)
 * @returns {Number} - Capital gains tax amount
 */
function calculateCapitalGainsTax(capitalGains, capitalGainsTaxBrackets, taxableIncome) {
  if (capitalGains <= 0 || !capitalGainsTaxBrackets || !Array.isArray(capitalGainsTaxBrackets)) {
    return 0;
  }
  
  // Sort brackets by lower bound
  const sortedBrackets = [...capitalGainsTaxBrackets].sort((a, b) => a.lowerBound - b.lowerBound);
  
  // Find the bracket for the taxable income
  let bracket = sortedBrackets[0];
  for (let i = 0; i < sortedBrackets.length; i++) {
    if (taxableIncome >= sortedBrackets[i].lowerBound) {
      bracket = sortedBrackets[i];
    } else {
      break;
    }
  }
  
  // Calculate capital gains tax using the appropriate rate
  return Math.max(0, capitalGains * bracket.rate);
}

/**
 * Calculate early withdrawal penalty
 * @param {Number} earlyWithdrawals - Early withdrawals from retirement accounts
 * @returns {Number} - Early withdrawal penalty amount
 */
function calculateEarlyWithdrawalPenalty(earlyWithdrawals) {
  if (earlyWithdrawals <= 0) {
    return 0;
  }
  
  // Early withdrawal penalty is 10%
  return earlyWithdrawals * 0.1;
}

/**
 * Sell an investment to cover expenses
 * @param {Object} investment - The investment to sell
 * @param {Number} amount - Amount to sell
 * @returns {Object} - Updated investment and tax information
 */
function sellInvestment(investment, amount) {
  // Calculate the amount to sell (cap at investment value)
  const sellAmount = Math.min(amount, investment.value);
  
  // Calculate the percentage of the investment being sold
  const percentageSold = sellAmount / investment.value;
  
  // Calculate capital gain based on purchase price
  let capitalGain = 0;
  if (investment.taxStatus !== 'pre-tax') {
    // For non-pre-tax investments, calculate capital gain
    const costBasis = investment.purchasePrice * percentageSold;
    capitalGain = sellAmount - costBasis;
    
    // Update purchase price for remaining investment
    investment.purchasePrice -= costBasis;
  }
  
  // Update investment value
  investment.value -= sellAmount;
  
  return {
    investment,
    sellAmount,
    capitalGain,
    preTaxWithdrawal: investment.taxStatus === 'pre-tax' ? sellAmount : 0,
    earlyWithdrawal: (investment.taxStatus === 'pre-tax' || investment.taxStatus === 'after-tax') ? sellAmount : 0
  };
}

/**
 * Process non-discretionary expenses and taxes
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @param {Object} previousYearState - State from the previous year
 * @returns {Object} - Updated year state
 */
function processNonDiscretionaryExpenses(params, yearState, previousYearState) {
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Initialize tracking variables if not already present
  updatedYearState.curYearIncome = updatedYearState.curYearIncome || 0;
  updatedYearState.curYearGains = updatedYearState.curYearGains || 0;
  updatedYearState.curYearEarlyWithdrawals = updatedYearState.curYearEarlyWithdrawals || 0;
  
  // Calculate previous year's taxes if previous year state exists
  let previousYearTaxes = 0;
  
  if (previousYearState) {
    // 1. Federal income tax (only 85% of SS is taxable)
    const prevTaxableIncome = previousYearState.curYearIncome - (0.15 * previousYearState.curYearSS);
    const federalIncomeTax = calculateFederalIncomeTax(
      prevTaxableIncome,
      previousYearState.federalIncomeTaxBrackets,
      previousYearState.standardDeduction
    );
    
    // 2. State income tax
    const stateIncomeTax = calculateStateIncomeTax(
      prevTaxableIncome,
      previousYearState.stateTaxBrackets
    );
    
    // 3. Capital gains tax
    const capitalGainsTax = calculateCapitalGainsTax(
      previousYearState.curYearGains,
      previousYearState.federalCapitalGainsTaxBrackets,
      prevTaxableIncome
    );
    
    // 4. Early withdrawal penalty
    const earlyWithdrawalPenalty = calculateEarlyWithdrawalPenalty(
      previousYearState.curYearEarlyWithdrawals
    );
    
    // Sum all taxes
    previousYearTaxes = federalIncomeTax + stateIncomeTax + capitalGainsTax + earlyWithdrawalPenalty;
  }
  
  // Process non-discretionary expense events for current year
  let nonDiscretionaryExpenses = 0;
  
  // Filter to include only non-discretionary expense events that are active this year
  const activeExpenseEvents = params.events.filter(event => 
    event.type === 'expense' && 
    !event.expense.isDiscretionary &&
    event.startYear <= updatedYearState.year &&
    (event.startYear + event.duration > updatedYearState.year)
  );
  
  for (const event of activeExpenseEvents) {
    // Calculate expense amount (similar to income events)
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
    
    // Add to total non-discretionary expenses
    nonDiscretionaryExpenses += amount;
  }
  
  // Total payment amount: non-discretionary expenses + previous year's taxes
  const totalPayment = nonDiscretionaryExpenses + previousYearTaxes;
  
  // Find the cash investment
  const cashInvestmentIndex = updatedYearState.investments.findIndex(
    inv => inv.name.toLowerCase().includes('cash')
  );
  
  if (cashInvestmentIndex < 0) {
    return updatedYearState; // Can't pay if no cash investment exists
  }
  
  const cashInvestment = updatedYearState.investments[cashInvestmentIndex];
  
  // Check if cash is enough to cover expenses
  if (cashInvestment.value >= totalPayment) {
    // If cash is enough, just reduce it
    cashInvestment.value -= totalPayment;
    updatedYearState.investments[cashInvestmentIndex] = cashInvestment;
    return updatedYearState;
  }
  
  // If cash is not enough, pay what we can with cash
  let remainingPayment = totalPayment - cashInvestment.value;
  cashInvestment.value = 0; // Use all available cash
  updatedYearState.investments[cashInvestmentIndex] = cashInvestment;
  
  // Need to withdraw from other investments according to expense withdrawal strategy
  const { expenseWithdrawalStrategies } = params;
  
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
  
  return updatedYearState;
}

module.exports = {
  processNonDiscretionaryExpenses,
  calculateFederalIncomeTax,
  calculateStateIncomeTax,
  calculateCapitalGainsTax,
  calculateEarlyWithdrawalPenalty,
  sellInvestment
}; 