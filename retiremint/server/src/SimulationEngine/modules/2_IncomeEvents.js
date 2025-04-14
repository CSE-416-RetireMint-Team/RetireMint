/**
 * IncomeEvents.js - Module for processing income events in the simulation
 * 
 * This module handles:
 * 1. Calculating income from income events
 * 2. Applying expected annual changes
 * 3. Adjusting for inflation
 * 4. Adjusting for user/spouse mortality
 * 5. Adding income to cash investment
 * 6. Updating income totals
 */

/**
 * Calculate the expected annual change in income amount
 * @param {Object} expectedAnnualChange - Expected annual change configuration
 * @returns {Number} - The change multiplier (e.g., 1.03 for a 3% increase)
 */
function calculateExpectedAnnualChange(expectedAnnualChange) {
  if (!expectedAnnualChange) return 1.0; // No change by default
  
  const { returnType } = expectedAnnualChange;
  
  if (!returnType) return 1.0;
  
  switch (returnType) {
    case 'fixedValue':
      return 1.0 + (expectedAnnualChange.fixedValue / 100);
      
    case 'fixedPercentage':
      return 1.0 + (expectedAnnualChange.fixedPercentage / 100);
      
    case 'normalValue':
      // Sample from normal distribution (value)
      const nvMean = expectedAnnualChange.normalValue.mean;
      const nvSd = expectedAnnualChange.normalValue.sd;
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return 1.0 + ((z0 * nvSd + nvMean) / 100);
      
    case 'normalPercentage':
      // Sample from normal distribution (percentage)
      const npMean = expectedAnnualChange.normalPercentage.mean;
      const npSd = expectedAnnualChange.normalPercentage.sd;
      const u3 = Math.random();
      const u4 = Math.random();
      const z1 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u4);
      return 1.0 + ((z1 * npSd + npMean) / 100);
      
    case 'uniformValue':
      // Sample from uniform distribution (value)
      const uvLower = expectedAnnualChange.uniformValue.lowerBound;
      const uvUpper = expectedAnnualChange.uniformValue.upperBound;
      return 1.0 + ((uvLower + Math.random() * (uvUpper - uvLower)) / 100);
      
    case 'uniformPercentage':
      // Sample from uniform distribution (percentage)
      const upLower = expectedAnnualChange.uniformPercentage.lowerBound;
      const upUpper = expectedAnnualChange.uniformPercentage.upperBound;
      return 1.0 + ((upLower + Math.random() * (upUpper - upLower)) / 100);
      
    default:
      return 1.0; // No change by default
  }
}

/**
 * Process an income event
 * @param {Object} event - Income event to process
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @param {Object} previousEventState - Previous state of this event
 * @returns {Object} - Updated state
 */
function processIncomeEvent(event, params, yearState, previousEventState) {
  // Skip processing if no income details
  if (!event.income || !event.income.initialAmount) {
    return { amount: 0 };
  }

  const {
    inflationRate,
    userAlive,
    spouseAlive,
    scenarioType
  } = yearState;
  
  // Get initial values or values from previous year
  let amount = previousEventState?.amount || event.income.initialAmount;
  
  // Apply expected annual change if this isn't the first year we're processing this event
  if (previousEventState) {
    const changeMultiplier = calculateExpectedAnnualChange(event.income.expectedAnnualChange);
    amount *= changeMultiplier;
  }
  
  // Apply inflation adjustment if enabled
  if (event.income.inflationAdjustment && inflationRate) {
    amount *= (1 + inflationRate);
  }
  
  // Adjust for user/spouse alive state
  if (scenarioType === 'married') {
    const marriedPercentage = event.income.marriedPercentage || 50; // Default to 50% if not specified
    const userPercentage = 100 - marriedPercentage;
    
    if (!userAlive) {
      amount = amount * (marriedPercentage / 100);
    } else if (!spouseAlive) {
      amount = amount * (userPercentage / 100);
    }
  } else if (!userAlive) {
    // If individual and not alive, no income
    amount = 0;
  }
  
  return { amount };
}

/**
 * Run all income events for the current simulation year
 * @param {Array} events - Array of events to process
 * @param {Object} params - Simulation parameters
 * @param {Object} yearState - Current state of the simulation year
 * @param {Object} previousEventsState - Previous state of all events
 * @returns {Object} - Updated year state and events state
 */
function runIncomeEvents(events, params, yearState, previousEventsState = {}) {
  if (!events || events.length === 0) {
    return {
      yearState: {
        ...yearState,
        curYearIncome: 0,
        curYearSS: 0
      },
      eventsState: {}
    };
  }
  
  // Create a deep copy of the year state to avoid mutating the original
  const updatedYearState = { ...yearState };
  const eventsState = {};
  
  // Initialize totals
  updatedYearState.curYearIncome = updatedYearState.curYearIncome || 0;
  updatedYearState.curYearSS = updatedYearState.curYearSS || 0;
  
  // Find the cash investment to add income to
  const cashInvestment = updatedYearState.investments.find(inv => inv.name.toLowerCase().includes('cash'));
  
  if (!cashInvestment) {
    throw new Error('No cash investment found to add income to');
  }
  
  // Filter to include only income events that are active this year
  const activeIncomeEvents = events.filter(event => 
    event.type === 'income' && 
    event.startYear <= updatedYearState.year &&
    (event.startYear + event.duration > updatedYearState.year)
  );
  
  // Process each active income event
  for (const event of activeIncomeEvents) {
    const previousState = previousEventsState[event.id] || null;
    const eventState = processIncomeEvent(event, params, updatedYearState, previousState);
    
    if (eventState.amount > 0) {
      // Add income to cash investment
      cashInvestment.value += eventState.amount;
      
      // Update income totals
      // For pre-tax investments, income is taxable when withdrawn, not when received
      if (!event.income.isPreTax) {
        updatedYearState.curYearIncome += eventState.amount;
      }
      
      // Update social security total if this is a social security income
      if (event.income.isSocialSecurity) {
        updatedYearState.curYearSS += eventState.amount;
      }
    }
    
    // Save event state for next year
    eventsState[event.id] = eventState;
  }
  
  return {
    yearState: updatedYearState,
    eventsState
  };
}

module.exports = {
  runIncomeEvents,
  processIncomeEvent,
  calculateExpectedAnnualChange
}; 