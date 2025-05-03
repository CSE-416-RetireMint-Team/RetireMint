/**
 * InvestmentReturns.js - Module for processing investment returns
 * 
 * This module handles:
 * 1. Calculating investment income based on expected returns
 * 2. Updating investment values
 * 3. Calculating and deducting investment expenses
 * 4. Tracking taxable income
 */

/**
 * Sample a return value from a probability distribution
 * @param {Object} expectedReturn - The expected return configuration
 * @returns {Number} - The sampled return value as a decimal (e.g., 0.07 for 7%)
 */
function sampleReturnRate(expectedReturn) {
  if (!expectedReturn) return 0;
  
  const { method } = expectedReturn;
  
  switch (method) {
    case 'fixedValue':
      return expectedReturn.fixedValue / 100;
      
    case 'fixedPercentage':
      return expectedReturn.fixedPercentage / 100;
      
    case 'normalValue':
      // Sample from normal distribution
      const nvMean = expectedReturn.normalValue.mean;
      const nvSd = expectedReturn.normalValue.sd;
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return (z0 * nvSd + nvMean) / 100;
      
    case 'normalPercentage':
      // Sample from normal distribution
      const npMean = expectedReturn.normalPercentage.mean;
      const npSd = expectedReturn.normalPercentage.sd;
      const u3 = Math.random();
      const u4 = Math.random();
      const z1 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);
      return (z1 * npSd + npMean) / 100;
      
    default:
      return 0;
  }
}

/**
 * Update an investment's value based on its returns and expenses
 * @param {Object} investment - The investment to update
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated investment and income information
 */
function updateInvestmentValue(investment/*, yearState*/) {
  // Skip if investment has no value or no investment type
  if (!investment || !investment.value || !investment.investmentType) {
    return {
      investment,
      generatedIncome: 0,
      valueChange: 0,
      expenses: 0
    };
  }
  
  const startValue = investment.value;
  let generatedIncome = 0;
  let valueChange = 0;
  
  // Calculate income generated (if any)
  if (investment.investmentType.expectedAnnualIncome) {
    const incomeRate = sampleReturnRate(investment.investmentType.expectedAnnualIncome);
    generatedIncome = startValue * incomeRate;
    
    // Add the income to the investment's value (reinvestment)
    investment.value += generatedIncome;
    // Also add the reinvested income to the cost basis
    if (investment.costBasis !== undefined && investment.costBasis !== null) {
        investment.costBasis += generatedIncome;
    }
  }
  
  // Calculate value change (appreciation/depreciation)
  if (investment.investmentType.expectedAnnualReturn) {
    const changeRate = sampleReturnRate(investment.investmentType.expectedAnnualReturn);
    valueChange = startValue * changeRate;
    
    // Update investment value
    investment.value += valueChange;
  }
  
  // Calculate expenses (expense ratio)
  let expenses = 0;
  if (investment.investmentType.expenseRatio) {
    // Expense ratio is applied to the average value over the year
    const averageValue = (startValue + investment.value) / 2;
    expenses = averageValue * (investment.investmentType.expenseRatio / 100);
    
    // Deduct expenses from the investment value
    investment.value -= expenses;
  }
  
  return {
    investment,
    generatedIncome,
    valueChange,
    expenses
  };
}

/**
 * Process all investments to update values and track income
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated year state
 */
function processInvestmentReturns(params, yearState) {
  if (!yearState.investments || yearState.investments.length === 0) {
    return yearState;
  }
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Initialize income tracking
  updatedYearState.curYearIncome = updatedYearState.curYearIncome || 0;
  updatedYearState.curYearGains = updatedYearState.curYearGains || 0;
  
  // Process each investment
  for (let i = 0; i < updatedYearState.investments.length; i++) {
    const investment = updatedYearState.investments[i];
    
    // Skip cash or similar investments that don't generate returns
    if (investment.name.toLowerCase().includes('cash')) {
      continue;
    }
    
    const startValue = investment.value || 0; // Store start value
    
    const { 
      investment: updatedInvestment, 
      generatedIncome, 
      valueChange, 
      expenses   // Expenses calculated
    } = updateInvestmentValue(investment /*, updatedYearState - not currently used by helper*/);
    
    const endValue = updatedInvestment.value || 0; // Store end value

    // Log the details for this investment
    //console.log(`Year ${updatedYearState.year}: Investment '${investment.name}' - Start: ${startValue.toFixed(2)}, Income: ${generatedIncome.toFixed(2)}, Value Change: ${valueChange.toFixed(2)}, Expenses: ${expenses.toFixed(2)}, End: ${endValue.toFixed(2)}`);

    // Update the investment in the state
    updatedYearState.investments[i] = updatedInvestment;
    
    // Update income totals based on tax status and taxability
    if (investment.accountTaxStatus === 'non-retirement' && 
        investment.investmentType.taxability === 'taxable' && 
        generatedIncome > 0) {
      // Only non-retirement taxable investments generate taxable income right away
      updatedYearState.curYearIncome += generatedIncome;
    }
    
    // Note: For pre-tax and after-tax retirement accounts, income is:
    // - For pre-tax: Taxed when withdrawn
    // - For after-tax: Not taxed (already taxed)
  }
  
  // Update total investment value for the year state
  let totalInvestmentValue = 0;
  updatedYearState.investments.forEach(inv => {
    totalInvestmentValue += inv.value || 0;
  });
  updatedYearState.totalInvestmentValue = totalInvestmentValue;
  updatedYearState.totalAssets = totalInvestmentValue + updatedYearState.cash;
  
  return updatedYearState;
}

module.exports = {
  processInvestmentReturns,
  updateInvestmentValue,
  sampleReturnRate
}; 