/**
 * RequiredMinimumDistributions.js - Module for handling Required Minimum Distributions (RMDs)
 * 
 * This module handles:
 * 1. Determining if RMDs are required in the current year
 * 2. Looking up the distribution period from the RMD table
 * 3. Calculating the RMD amount
 * 4. Processing withdrawals according to the RMD strategy
 * 5. Updating income and investment totals
 */

/**
 * Look up the distribution period from the RMD table
 * @param {Number} age - The person's age
 * @param {Array} rmdTable - The RMD table data
 * @returns {Number} - The distribution period from the table
 */
function lookupDistributionPeriod(age, rmdTable) {
  if (!rmdTable || !Array.isArray(rmdTable)) {
    // If no table is available, use a reasonable default
    return Math.max(90 - age, 10);
  }
  
  // Find the entry in the RMD table for the given age
  const entry = rmdTable.find(e => e.age === age);
  
  if (!entry) {
    // If no entry exists for this age, use a reasonable default
    return Math.max(90 - age, 10);
  }
  
  return entry.distributionPeriod;
}

/**
 * Transfer funds in-kind from one investment to another
 * @param {Array} investments - Array of all investments
 * @param {Object} sourceInvestment - The source investment
 * @param {String} amount - The amount to transfer
 * @param {String} targetTaxStatus - The target tax status (e.g., "non-retirement")
 * @returns {Object} - Updated investments and created investment (if any)
 */
function transferInKind(investments, sourceInvestment, amount, targetTaxStatus) {
  // Check if amount exceeds the source investment value
  const transferAmount = Math.min(amount, sourceInvestment.value);
  
  // Reduce the source investment by the transferred amount
  sourceInvestment.value -= transferAmount;
  
  // Look for an existing investment with the same type and target tax status
  const targetInvestment = investments.find(inv => 
    inv.investmentType.name === sourceInvestment.investmentType.name && 
    inv.taxStatus === targetTaxStatus
  );
  
  let createdInvestment = null;
  
  if (targetInvestment) {
    // If a target investment exists, add the transferred amount to it
    targetInvestment.value += transferAmount;
  } else {
    // Otherwise, create a new investment with the same type and target tax status
    createdInvestment = {
      name: `${sourceInvestment.investmentType.name} (${targetTaxStatus})`,
      investmentType: sourceInvestment.investmentType,
      taxStatus: targetTaxStatus,
      value: transferAmount,
      purchasePrice: transferAmount, // Track purchase price for capital gains calculations
    };
    
    investments.push(createdInvestment);
  }
  
  return {
    investments,
    createdInvestment,
    transferredAmount: transferAmount
  };
}

/**
 * Process Required Minimum Distributions (RMDs) for the current year
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @param {Object} previousYearState - State from the previous year
 * @returns {Object} - Updated year state
 */
function processRequiredMinimumDistributions(params, yearState, previousYearState) {
  const { rmdStrategies, rmdTable } = params;
  const { /*year, */userAge } = yearState;
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Check if RMDs are required this year
  // RMD applies when user age is at least 73, and it is distributed the following year
  if (userAge < 74) {
    return updatedYearState;
  }
  
  // Check if there are any pre-tax investments with positive value as of the end of the previous year
  const preTaxInvestments = previousYearState.investments.filter(
    inv => inv.taxStatus === 'pre-tax' && inv.value > 0
  );
  
  if (preTaxInvestments.length === 0) {
    return updatedYearState;
  }
  
  // Look up the distribution period
  const distributionPeriod = lookupDistributionPeriod(userAge, rmdTable);
  
  // Calculate the total value of pre-tax investments at the end of the previous year
  const totalPreTaxValue = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
  
  // Calculate the RMD amount
  const rmdAmount = totalPreTaxValue / distributionPeriod;
  
  // Update the annual income total with the RMD amount
  updatedYearState.curYearIncome = (updatedYearState.curYearIncome || 0) + rmdAmount;
  
  // Process the RMD strategy
  let remainingRMD = rmdAmount;
  const rmdInvestments = [];
  
  // First, sort the investments according to the RMD strategy
  if (rmdStrategies && rmdStrategies.length > 0) {
    for (const strategyName of rmdStrategies) {
      const investment = preTaxInvestments.find(inv => inv.name === strategyName);
      if (investment) {
        rmdInvestments.push(investment);
      }
    }
    
    // Add any remaining pre-tax investments that weren't in the strategy
    for (const investment of preTaxInvestments) {
      if (!rmdInvestments.includes(investment)) {
        rmdInvestments.push(investment);
      }
    }
  } else {
    // If no strategy is provided, use all pre-tax investments in their original order
    rmdInvestments.push(...preTaxInvestments);
  }
  
  // Now process each investment in order until the RMD is satisfied
  for (const sourceInvestment of rmdInvestments) {
    if (remainingRMD <= 0) break;
    
    const transferAmount = Math.min(remainingRMD, sourceInvestment.value);
    
    // Find the corresponding investment in the current year state
    const currentYearInvestment = updatedYearState.investments.find(
      inv => inv.name === sourceInvestment.name
    );
    
    if (currentYearInvestment) {
      // Transfer funds in-kind from pre-tax to non-retirement
      const result = transferInKind(
        updatedYearState.investments, 
        currentYearInvestment, 
        transferAmount, 
        'non-retirement'
      );
      
      // Update the investments and reduce the remaining RMD
      updatedYearState.investments = result.investments;
      remainingRMD -= result.transferredAmount;
    }
  }
  
  return updatedYearState;
}

module.exports = {
  processRequiredMinimumDistributions,
  lookupDistributionPeriod,
  transferInKind
}; 