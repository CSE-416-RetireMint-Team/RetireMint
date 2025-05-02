/**
 * RebalanceEvents.js - Module for processing portfolio rebalancing events
 * 
 * This module handles:
 * 1. Processing rebalance events according to target allocations
 * 2. Selling and buying investments to achieve target allocations
 * 3. Tracking capital gains from rebalancing
 */

/**
 * Group investments by their tax status
 * @param {Array} investments - Array of all investments
 * @returns {Object} - Investments grouped by tax status
 */
function groupInvestmentsByTaxStatus(investments) {
  if (!investments || !Array.isArray(investments)) {
    return {
      'pre-tax': [],
      'after-tax': [],
      'non-retirement': [],
      'tax-exempt': []
    };
  }
  
  return investments.reduce((groups, inv) => {
    // Skip cash investments for rebalancing
    if (inv.name.toLowerCase().includes('cash')) {
      return groups;
    }
    
    // Determine tax status group (default to non-retirement if not specified)
    const taxStatus = inv.taxStatus || 'non-retirement';
    
    // Add investment to appropriate group
    if (!groups[taxStatus]) {
      groups[taxStatus] = [];
    }
    
    groups[taxStatus].push(inv);
    return groups;
  }, {});
}

/**
 * Calculate the current allocation percentages
 * @param {Array} investments - Array of investments in a group
 * @returns {Object} - Current allocation percentages
 */
function calculateCurrentAllocation(investments) {
  if (!investments || !Array.isArray(investments) || investments.length === 0) {
    return {};
  }
  
  // Calculate total value of all investments in the group
  const totalValue = investments.reduce((sum, inv) => sum + (inv.value || 0), 0);
  
  if (totalValue <= 0) {
    return {};
  }
  
  // Calculate percentage for each investment
  const allocation = {};
  investments.forEach(inv => {
    allocation[inv.name] = (inv.value / totalValue) * 100;
  });
  
  return allocation;
}

/**
 * Rebalance a group of investments to match target allocation
 * @param {Array} investments - Investments to rebalance
 * @param {Object} targetAllocation - Target allocation percentages
 * @returns {Object} - Updated investments and capital gains
 */
function rebalanceInvestmentGroup(investments, targetAllocation) {
  if (!investments || !Array.isArray(investments) || investments.length === 0 || !targetAllocation) {
    return { investments, capitalGains: 0 };
  }
  
  // Create a copy of investments to avoid mutating the original
  const updatedInvestments = [...investments];
  let capitalGains = 0;
  
  // Calculate total value of investments in the group
  const totalValue = updatedInvestments.reduce((sum, inv) => sum + inv.value, 0);
  
  // Calculate target values for each investment
  const targetValues = {};
  
  for (const [investmentName, percentage] of Object.entries(targetAllocation)) {
    targetValues[investmentName] = totalValue * (percentage / 100);
  }
  
  // Determine which investments to sell (when current value > target value)
  // and which to buy (when current value < target value)
  const sellTransactions = [];
  const buyTransactions = [];
  
  for (let i = 0; i < updatedInvestments.length; i++) {
    const investment = updatedInvestments[i];
    const targetValue = targetValues[investment.name] || 0;
    
    if (investment.value > targetValue) {
      // Need to sell some of this investment
      sellTransactions.push({
        index: i,
        name: investment.name,
        amount: investment.value - targetValue
      });
    } else if (investment.value < targetValue) {
      // Need to buy more of this investment
      buyTransactions.push({
        index: i,
        name: investment.name,
        amount: targetValue - investment.value
      });
    }
  }
  
  // Process all sell transactions first
  for (const transaction of sellTransactions) {
    const investment = updatedInvestments[transaction.index];
    
    // Calculate capital gain based on cost basis (proportional to amount sold)
    if (investment.purchasePrice && investment.taxStatus !== 'pre-tax') {
      const saleRatio = transaction.amount / investment.value;
      const costBasis = investment.purchasePrice * saleRatio;
      const gain = transaction.amount - costBasis;
      
      // Add to capital gains (only for taxable investments)
      if (investment.investmentType.taxability === 'taxable') {
        capitalGains += gain;
      }
      
      // Update purchase price for remaining investment
      investment.purchasePrice -= costBasis;
    }
    
    // Reduce investment value
    investment.value -= transaction.amount;
  }
  
  // Then process all buy transactions
  for (const transaction of buyTransactions) {
    const investment = updatedInvestments[transaction.index];
    
    // Increase investment value
    investment.value += transaction.amount;
    
    // Update purchase price for capital gains tracking
    if (!investment.purchasePrice) {
      investment.purchasePrice = 0;
    }
    investment.purchasePrice += transaction.amount;
  }
  
  return { investments: updatedInvestments, capitalGains };
}

/**
 * Process rebalance events for the current year
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated year state
 */
function processRebalanceEvents(params, yearState) {
  const { events } = params;
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Filter to include only rebalance events that are active this year
  const activeRebalanceEvents = events.filter(event => 
    event.type === 'rebalance' && 
    event.startYear <= updatedYearState.year &&
    (event.startYear + event.duration > updatedYearState.year)
  );
  
  // No processing needed if no rebalance events
  if (activeRebalanceEvents.length === 0) {
    return updatedYearState;
  }
  
  // Initialize capital gains tracking if not already present
  updatedYearState.curYearGains = updatedYearState.curYearGains || 0;
  
  // Process each rebalance event
  for (const event of activeRebalanceEvents) {
    if (!event.rebalance) continue;
    
    const { returnType } = event.rebalance;
    
    // Skip if no valid rebalance type
    if (!returnType) continue;
    
    let targetAllocation = {};
    
    if (returnType === 'fixedAllocation') {
      // Use the fixed allocation specified in the event
      targetAllocation = event.rebalance.fixedAllocation;
    } else if (returnType === 'glidePath') {
      // Determine allocation based on glide path (age-based)
      // This would be more complex in a real implementation
      targetAllocation = getGlidePathAllocation(event.rebalance.glidePath, updatedYearState.userAge);
    }
    
    // Group investments by tax status for rebalancing within each group
    const groupedInvestments = groupInvestmentsByTaxStatus(updatedYearState.investments);
    
    // Define rebalancing domains (which tax status groups to rebalance)
    const rebalanceDomains = event.rebalance.rebalanceDomains || ['all'];
    
    // Rebalance each domain
    if (rebalanceDomains.includes('all') || rebalanceDomains.includes('pre-tax')) {
      const preTaxInvestments = groupedInvestments['pre-tax'] || [];
      if (preTaxInvestments.length > 0) {
        const { investments, capitalGains } = rebalanceInvestmentGroup(
          preTaxInvestments, 
          targetAllocation.preTax || targetAllocation
        );
        
        // Update investments and capital gains
        updateInvestmentsInYearState(updatedYearState, investments);
        updatedYearState.curYearGains += capitalGains;
      }
    }
    
    if (rebalanceDomains.includes('all') || rebalanceDomains.includes('after-tax')) {
      const afterTaxInvestments = groupedInvestments['after-tax'] || [];
      if (afterTaxInvestments.length > 0) {
        const { investments, capitalGains } = rebalanceInvestmentGroup(
          afterTaxInvestments, 
          targetAllocation.afterTax || targetAllocation
        );
        
        // Update investments and capital gains
        updateInvestmentsInYearState(updatedYearState, investments);
        updatedYearState.curYearGains += capitalGains;
      }
    }
    
    if (rebalanceDomains.includes('all') || rebalanceDomains.includes('non-retirement')) {
      const nonRetirementInvestments = groupedInvestments['non-retirement'] || [];
      if (nonRetirementInvestments.length > 0) {
        const { investments, capitalGains } = rebalanceInvestmentGroup(
          nonRetirementInvestments, 
          targetAllocation.nonRetirement || targetAllocation
        );
        
        // Update investments and capital gains
        updateInvestmentsInYearState(updatedYearState, investments);
        updatedYearState.curYearGains += capitalGains;
      }
    }
    
    if (rebalanceDomains.includes('all') || rebalanceDomains.includes('tax-exempt')) {
      const taxExemptInvestments = groupedInvestments['tax-exempt'] || [];
      if (taxExemptInvestments.length > 0) {
        const { investments, capitalGains } = rebalanceInvestmentGroup(
          taxExemptInvestments, 
          targetAllocation.taxExempt || targetAllocation
        );
        
        // Update investments and capital gains
        updateInvestmentsInYearState(updatedYearState, investments);
        updatedYearState.curYearGains += capitalGains;
      }
    }
  }
  
  return updatedYearState;
}

/**
 * Update investments in the year state after rebalancing
 * @param {Object} yearState - Current year state
 * @param {Array} rebalancedInvestments - Rebalanced investments
 */
function updateInvestmentsInYearState(yearState, rebalancedInvestments) {
  // Update each rebalanced investment in the year state
  for (const rebalancedInv of rebalancedInvestments) {
    const index = yearState.investments.findIndex(inv => inv.name === rebalancedInv.name);
    if (index >= 0) {
      yearState.investments[index] = rebalancedInv;
    }
  }
}

/**
 * Get the appropriate allocation based on a glide path and the user's age
 * @param {Object} glidePath - The glide path configuration
 * @param {Number} userAge - The user's current age
 * @returns {Object} - Allocation percentages for each investment
 */
function getGlidePathAllocation(glidePath, userAge) {
  if (!glidePath || !userAge) {
    return {};
  }
  
  // A real implementation would have a more sophisticated glide path calculation
  // For simplicity, we'll use a basic approach here
  
  // Assume the glide path is defined as bands with age ranges and allocations
  const ageRanges = Object.keys(glidePath).map(Number).sort((a, b) => a - b);
  
  // Find the appropriate age band
  let allocations = {};
  
  for (let i = 0; i < ageRanges.length; i++) {
    const currentAge = ageRanges[i];
    const nextAge = i < ageRanges.length - 1 ? ageRanges[i + 1] : Infinity;
    
    if (userAge >= currentAge && userAge < nextAge) {
      allocations = glidePath[currentAge];
      break;
    }
  }
  
  return allocations;
}

module.exports = {
  processRebalanceEvents,
  rebalanceInvestmentGroup,
  groupInvestmentsByTaxStatus,
  calculateCurrentAllocation,
  getGlidePathAllocation
}; 