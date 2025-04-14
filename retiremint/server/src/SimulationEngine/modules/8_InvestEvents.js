/**
 * InvestEvents.js - Module for processing invest events
 * 
 * This module handles:
 * 1. Determining excess cash
 * 2. Allocating excess cash to investments according to asset allocation
 * 3. Respecting annual contribution limits for retirement accounts
 * 4. Updating investment values
 */

/**
 * Get the excess cash amount available for investing
 * @param {Array} investments - Array of all investments
 * @param {Number} maximumCash - Maximum cash to keep
 * @returns {Number} - Excess cash amount
 */
function getExcessCash(investments, maximumCash) {
  if (!investments || !Array.isArray(investments) || !maximumCash) {
    return 0;
  }
  
  // Find the cash investment
  const cashInvestment = investments.find(inv => inv.name.toLowerCase().includes('cash'));
  
  if (!cashInvestment) {
    return 0;
  }
  
  // Calculate excess cash (amount over maximumCash)
  return Math.max(0, cashInvestment.value - maximumCash);
}

/**
 * Process an invest event allocation
 * @param {Object} params - Parameters for the allocation
 * @returns {Object} - Updated investments and their values
 */
function processInvestAllocation(params) {
  const { 
    investments, 
    excessCash, 
    allocation, 
    contributionLimits 
  } = params;
  
  if (excessCash <= 0 || !allocation) {
    return { investments, remainingCash: 0 };
  }
  
  // Keep track of updated investments
  const updatedInvestments = [...investments];
  
  // Group investments by tax status for contribution limits tracking
  const preTaxAllocations = [];
  const afterTaxAllocations = [];
  const nonRetirementAllocations = [];
  
  // Calculate allocation amounts
  for (const [investmentName, percentage] of Object.entries(allocation)) {
    const investmentIndex = updatedInvestments.findIndex(inv => inv.name === investmentName);
    
    if (investmentIndex >= 0) {
      const investment = updatedInvestments[investmentIndex];
      const allocationAmount = excessCash * (percentage / 100);
      
      // Track allocation by tax status
      switch (investment.taxStatus) {
        case 'pre-tax':
          preTaxAllocations.push({ investmentIndex, amount: allocationAmount });
          break;
        case 'after-tax':
          afterTaxAllocations.push({ investmentIndex, amount: allocationAmount });
          break;
        case 'non-retirement':
        default:
          nonRetirementAllocations.push({ investmentIndex, amount: allocationAmount });
          break;
      }
    }
  }
  
  // Apply contribution limits to pre-tax allocations
  let preTaxTotal = preTaxAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  let afterTaxTotal = afterTaxAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  
  // Check if pre-tax contributions exceed the limit
  let preTaxOverLimit = 0;
  if (preTaxTotal > contributionLimits.preTax) {
    preTaxOverLimit = preTaxTotal - contributionLimits.preTax;
    
    // Scale down pre-tax allocations
    if (preTaxTotal > 0) {
      const scaleFactor = contributionLimits.preTax / preTaxTotal;
      preTaxAllocations.forEach(alloc => {
        alloc.amount *= scaleFactor;
      });
    }
    
    preTaxTotal = contributionLimits.preTax;
  }
  
  // Check if after-tax contributions exceed the limit
  let afterTaxOverLimit = 0;
  if (afterTaxTotal > contributionLimits.afterTax) {
    afterTaxOverLimit = afterTaxTotal - contributionLimits.afterTax;
    
    // Scale down after-tax allocations
    if (afterTaxTotal > 0) {
      const scaleFactor = contributionLimits.afterTax / afterTaxTotal;
      afterTaxAllocations.forEach(alloc => {
        alloc.amount *= scaleFactor;
      });
    }
    
    afterTaxTotal = contributionLimits.afterTax;
  }
  
  // Redistribute excess allocations to non-retirement investments
  const totalOverLimit = preTaxOverLimit + afterTaxOverLimit;
  
  if (totalOverLimit > 0 && nonRetirementAllocations.length > 0) {
    // Calculate current non-retirement total
    const nonRetirementTotal = nonRetirementAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    
    // Distribute overflow proportionally to non-retirement investments
    nonRetirementAllocations.forEach(alloc => {
      const proportion = nonRetirementTotal > 0 ? alloc.amount / nonRetirementTotal : 1 / nonRetirementAllocations.length;
      alloc.amount += totalOverLimit * proportion;
    });
  }
  
  // Apply all allocations to investments
  let usedCash = 0;
  
  // Apply pre-tax allocations
  preTaxAllocations.forEach(alloc => {
    const { investmentIndex, amount } = alloc;
    updatedInvestments[investmentIndex].value += amount;
    
    // Track purchase price for capital gains calculations
    if (!updatedInvestments[investmentIndex].purchasePrice) {
      updatedInvestments[investmentIndex].purchasePrice = 0;
    }
    updatedInvestments[investmentIndex].purchasePrice += amount;
    
    usedCash += amount;
  });
  
  // Apply after-tax allocations
  afterTaxAllocations.forEach(alloc => {
    const { investmentIndex, amount } = alloc;
    updatedInvestments[investmentIndex].value += amount;
    
    // Track purchase price for capital gains calculations
    if (!updatedInvestments[investmentIndex].purchasePrice) {
      updatedInvestments[investmentIndex].purchasePrice = 0;
    }
    updatedInvestments[investmentIndex].purchasePrice += amount;
    
    usedCash += amount;
  });
  
  // Apply non-retirement allocations
  nonRetirementAllocations.forEach(alloc => {
    const { investmentIndex, amount } = alloc;
    updatedInvestments[investmentIndex].value += amount;
    
    // Track purchase price for capital gains calculations
    if (!updatedInvestments[investmentIndex].purchasePrice) {
      updatedInvestments[investmentIndex].purchasePrice = 0;
    }
    updatedInvestments[investmentIndex].purchasePrice += amount;
    
    usedCash += amount;
  });
  
  // Reduce cash by the amount used
  const cashInvestmentIndex = updatedInvestments.findIndex(inv => inv.name.toLowerCase().includes('cash'));
  if (cashInvestmentIndex >= 0) {
    updatedInvestments[cashInvestmentIndex].value -= usedCash;
  }
  
  return {
    investments: updatedInvestments,
    remainingCash: excessCash - usedCash
  };
}

/**
 * Process invest events for the current year
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @returns {Object} - Updated year state
 */
function processInvestEvents(params, yearState) {
  const { events, maximumCash } = params;
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  updatedYearState.investments = [...yearState.investments];
  
  // Filter to include only invest events that are active this year
  const activeInvestEvents = events.filter(event => 
    event.type === 'invest' && 
    event.startYear <= updatedYearState.year &&
    (event.startYear + event.duration > updatedYearState.year)
  );
  
  // No processing needed if no invest events
  if (activeInvestEvents.length === 0) {
    return updatedYearState;
  }
  
  // Calculate excess cash available for investing
  const excessCash = getExcessCash(updatedYearState.investments, maximumCash);
  
  if (excessCash <= 0) {
    return updatedYearState;
  }
  
  // Process each invest event
  // Note: In normal cases there should only be one active invest event per year,
  // but we'll handle multiple just in case
  for (const event of activeInvestEvents) {
    if (!event.invest) continue;
    
    // Get the allocation based on investment execution type
    const { returnType } = event.invest;
    
    let allocation = {};
    
    if (returnType === 'fixedAllocation') {
      // Use the fixed allocation specified in the event
      allocation = event.invest.fixedAllocation;
    } else if (returnType === 'glidePath') {
      // Determine allocation based on glide path (age-based)
      // This would be a more complex calculation in a real implementation
      // For simplicity, we'll assume a basic allocation here
      allocation = getGlidePathAllocation(event.invest.glidePath, updatedYearState.userAge);
    }
    
    // Check if the event has a custom maximum cash setting
    const eventMaximumCash = event.invest.modifyMaximumCash ? event.invest.newMaximumCash : maximumCash;
    
    // Process the allocation
    const result = processInvestAllocation({
      investments: updatedYearState.investments,
      excessCash,
      allocation,
      contributionLimits: updatedYearState.contributionLimits
    });
    
    // Update investments
    updatedYearState.investments = result.investments;
  }
  
  return updatedYearState;
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
  processInvestEvents,
  processInvestAllocation,
  getExcessCash,
  getGlidePathAllocation
}; 