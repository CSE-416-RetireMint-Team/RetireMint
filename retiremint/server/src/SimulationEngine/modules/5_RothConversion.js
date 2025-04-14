/**
 * RothConversion.js - Module for handling Roth conversions
 * 
 * This module handles:
 * 1. Determining if the Roth conversion optimizer is enabled
 * 2. Calculating the optimal Roth conversion amount based on current tax bracket
 * 3. Processing the conversion according to the Roth conversion strategy
 * 4. Tracking income and early withdrawal penalties
 */

/**
 * Find the current federal income tax bracket based on taxable income
 * @param {Number} taxableIncome - Current year's taxable income
 * @param {Array} federalIncomeTaxBrackets - Federal income tax brackets
 * @returns {Object} - The current tax bracket with upper limit
 */
function findCurrentTaxBracket(taxableIncome, federalIncomeTaxBrackets) {
  if (!federalIncomeTaxBrackets || !Array.isArray(federalIncomeTaxBrackets)) {
    return { rate: 0.24, upperBound: 100000 }; // Default if no brackets available
  }
  
  // Sort brackets by their lower bounds
  const sortedBrackets = [...federalIncomeTaxBrackets].sort((a, b) => a.lowerBound - b.lowerBound);
  
  // Find the bracket that contains the taxable income
  for (let i = 0; i < sortedBrackets.length; i++) {
    const bracket = sortedBrackets[i];
    const nextBracket = i < sortedBrackets.length - 1 ? sortedBrackets[i + 1] : null;
    
    if (!nextBracket || taxableIncome < nextBracket.lowerBound) {
      return bracket;
    }
  }
  
  // If we couldn't find a bracket, return the highest one
  return sortedBrackets[sortedBrackets.length - 1];
}

/**
 * Process Roth conversions for the current year
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated year state
 */
function processRothConversion(params, yearState) {
  const { 
    rothOptimizerEnable, 
    rothOptimizerStartYear,
    rothOptimizerEndYear,
    rothConversionStrategies 
  } = params;
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Check if Roth conversion optimizer is enabled for this year
  if (!rothOptimizerEnable ||
      yearState.year < rothOptimizerStartYear ||
      yearState.year > rothOptimizerEndYear) {
    return updatedYearState;
  }
  
  // Calculate current taxable income
  // Only 85% of social security benefits are taxable
  const taxableIncome = updatedYearState.curYearIncome - (0.15 * updatedYearState.curYearSS);
  
  // Find the current tax bracket
  const currentBracket = findCurrentTaxBracket(
    taxableIncome, 
    updatedYearState.federalIncomeTaxBrackets
  );
  
  // Calculate optimal Roth conversion amount
  // This is the difference between the upper bound of the current bracket and the current taxable income
  const optimalConversionAmount = currentBracket.upperBound 
    ? Math.max(0, currentBracket.upperBound - taxableIncome)
    : 0;
  
  // If no conversion is needed or no pre-tax investments exist, return
  if (optimalConversionAmount <= 0) {
    return updatedYearState;
  }
  
  // Find pre-tax investments to convert
  const preTaxInvestments = updatedYearState.investments.filter(
    inv => inv.taxStatus === 'pre-tax' && inv.value > 0
  );
  
  if (preTaxInvestments.length === 0) {
    return updatedYearState;
  }
  
  // Order the investments according to the Roth conversion strategy
  const orderedInvestments = [];
  
  if (rothConversionStrategies && rothConversionStrategies.length > 0) {
    for (const strategyName of rothConversionStrategies) {
      const investment = preTaxInvestments.find(inv => inv.name === strategyName);
      if (investment) {
        orderedInvestments.push(investment);
      }
    }
    
    // Add any remaining pre-tax investments not in the strategy
    for (const investment of preTaxInvestments) {
      if (!orderedInvestments.includes(investment)) {
        orderedInvestments.push(investment);
      }
    }
  } else {
    // If no strategy is provided, use all pre-tax investments in their original order
    orderedInvestments.push(...preTaxInvestments);
  }
  
  // Process the Roth conversion
  let remainingConversion = optimalConversionAmount;
  
  for (let i = 0; i < orderedInvestments.length; i++) {
    if (remainingConversion <= 0) break;
    
    const sourceInvestment = orderedInvestments[i];
    const transferAmount = Math.min(remainingConversion, sourceInvestment.value);
    
    // Find the corresponding investment in the current state
    const investmentIndex = updatedYearState.investments.findIndex(
      inv => inv.name === sourceInvestment.name
    );
    
    if (investmentIndex >= 0) {
      // Create or update the corresponding after-tax investment
      const sourceInvestmentType = sourceInvestment.investmentType;
      
      // Find existing after-tax investment with the same type
      const targetInvestmentIndex = updatedYearState.investments.findIndex(
        inv => inv.investmentType.name === sourceInvestmentType.name && 
              inv.taxStatus === 'after-tax'
      );
      
      // Reduce the source investment
      updatedYearState.investments[investmentIndex].value -= transferAmount;
      
      if (targetInvestmentIndex >= 0) {
        // If target investment exists, add to its value
        updatedYearState.investments[targetInvestmentIndex].value += transferAmount;
      } else {
        // Create a new after-tax investment
        updatedYearState.investments.push({
          name: `${sourceInvestmentType.name} (after-tax)`,
          investmentType: sourceInvestmentType,
          taxStatus: 'after-tax',
          value: transferAmount,
          purchasePrice: transferAmount // For after-tax, track purchase price for potential capital gains
        });
      }
      
      // Add the conversion amount to income (it's taxable)
      updatedYearState.curYearIncome += transferAmount;
      
      // If user is under 59.5, add to early withdrawals (for penalty calculation)
      if (updatedYearState.userAge < 59.5) {
        updatedYearState.curYearEarlyWithdrawals = 
          (updatedYearState.curYearEarlyWithdrawals || 0) + transferAmount;
      }
      
      remainingConversion -= transferAmount;
    }
  }
  
  return updatedYearState;
}

module.exports = {
  processRothConversion,
  findCurrentTaxBracket
}; 