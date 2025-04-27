/**
 * SimulateYear.js - Main module for simulating a single year in the financial model
 * 
 * This module integrates all simulation components to process a single year of financial activity:
 * 1. Process preliminary calculations (inflation, tax brackets)
 * 2. Process income events
 * 3. Handle Required Minimum Distributions (RMDs)
 * 4. Update investment values
 * 5. Process Roth conversions
 * 6. Pay non-discretionary expenses and taxes
 * 7. Pay discretionary expenses
 * 8. Process invest events
 * 9. Process rebalance events
 */

// Import all component modules
const { runPreliminaries } = require('./modules/1_Preliminaries');
const { runIncomeEvents } = require('./modules/2_IncomeEvents');
const { processRequiredMinimumDistributions } = require('./modules/3_RequiredMinimumDistributions');
const { processInvestmentReturns } = require('./modules/4_InvestmentReturns');
const { processRothConversion } = require('./modules/5_RothConversion');
const { processNonDiscretionaryExpenses } = require('./modules/6_NonDiscretionaryExpenses');
const { processDiscretionaryExpenses } = require('./modules/7_DiscretionaryExpenses');
const { processInvestEvents } = require('./modules/8_InvestEvents');
const { processRebalanceEvents } = require('./modules/9_RebalanceEvents');

/**
 * Determine if a person is alive in the current year based on their life expectancy
 * @param {Object} lifeExpectancy - Life expectancy configuration
 * @param {Number} currentAge - Current age
 * @returns {Boolean} - True if person is alive, false otherwise
 */
function isPersonAlive(lifeExpectancy, currentAge) {
  if (!lifeExpectancy) {
    return false;
  }
  
  // Handle both object and array formats for compatibility
  if (Array.isArray(lifeExpectancy)) {
    const [method, fixedValue, distribution] = lifeExpectancy;
    
    switch (method) {
      case 'fixedValue':
        return currentAge <= fixedValue;
        
      case 'normalDistribution':
        if (distribution && typeof distribution.mean === 'number' && typeof distribution.standardDeviation === 'number') {
          // Sample from the normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const sampleAge = z0 * distribution.standardDeviation + distribution.mean;
          
          return currentAge <= sampleAge;
        }
        return false;
        
      default:
        return false;
    }
  } 
  // Handle object format (from schema)
  else if (typeof lifeExpectancy === 'object') {
    const { lifeExpectancyMethod, fixedValue, normalDistribution, computedValue } = lifeExpectancy;
    
    // If there's a computed value already, use that
    if (typeof computedValue === 'number') {
      return currentAge <= computedValue;
    }
    
    switch (lifeExpectancyMethod) {
      case 'fixedValue':
        return currentAge <= fixedValue;
        
      case 'normalDistribution':
        if (normalDistribution && typeof normalDistribution.mean === 'number' && typeof normalDistribution.standardDeviation === 'number') {
          // Sample from the normal distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const sampleAge = z0 * normalDistribution.standardDeviation + normalDistribution.mean;
          
          return currentAge <= sampleAge;
        }
        return false;
        
      default:
        return false;
    }
  }
  
  // If lifeExpectancy is neither an array nor an object, return false
  return false;
}

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
 * Simulate a single year of financial activity
 * @param {Object} params - Simulation parameters
 * @param {Object} previousYearState - State from the previous year
 * @returns {Object} - Final state for the current year
 */
function simulateYear(params, previousYearState = null) {
  const {
    // User data
    userAge,
    spouseAge,
    lifeExpectancy,
    spouseLifeExpectancy,
    scenarioType,
    
    // Financial data
    investments,
    events,
    inflationAssumption,
    financialGoal,
    maximumCash,
    
    // Strategy data
    expenseWithdrawalStrategies,
    rmdStrategies,
    rothConversionStrategies,
    
    // Roth optimizer settings
    rothOptimizerEnable,
    rothOptimizerStartYear,
    rothOptimizerEndYear,
    
    // Tax data
    taxData,
    
    // Simulation year
    year
  } = params;
  
  // Initialize the state for this year
  let yearState = {
    year,
    userAge,
    spouseAge,
    scenarioType,
    
    // Determine if user and spouse are alive this year
    userAlive: isPersonAlive(lifeExpectancy, userAge),
    spouseAlive: scenarioType === 'married' ? isPersonAlive(spouseLifeExpectancy, spouseAge) : false,
    
    // Deep clone investments to avoid modifying the original
    investments: JSON.parse(JSON.stringify(investments)),
    
    // Initialize running totals
    curYearIncome: 0,
    curYearSS: 0, // Social Security income
    curYearGains: 0, // Capital gains
    curYearEarlyWithdrawals: 0 // Early withdrawals from retirement accounts
  };
  
  // Skip processing if both user and spouse are dead
  if (scenarioType === 'married' && !yearState.userAlive && !yearState.spouseAlive) {
    return yearState;
  } else if (scenarioType === 'individual' && !yearState.userAlive) {
    return yearState;
  }
  
  // 1. Preliminaries: Calculate inflation rate and adjust tax brackets
  const preliminaryData = runPreliminaries({ 
    inflationAssumption, 
    taxData, 
    year 
  }, previousYearState);
  
  // Merge preliminary data into year state
  yearState = { ...yearState, ...preliminaryData };
  
  // 2. Income events: Process all income events for the current year
  const incomeResult = runIncomeEvents(
    events, 
    params, 
    yearState, 
    previousYearState?.eventsState || {}
  );
  
  yearState = incomeResult.yearState;
  
  // Store events state for next year
  //yearState.eventsState = incomeResult.eventsState;
  
  // 3. Required Minimum Distributions: Process RMDs if applicable
  //yearState = processRequiredMinimumDistributions(
  //  { rmdStrategies, rmdTable: taxData?.rmdTable }, 
  //  yearState, 
  //  previousYearState || {}
  //);
  
  // 4. Investment Returns: Update investment values based on returns
  //yearState = processInvestmentReturns(params, yearState);
  
  // 5. Roth Conversion: Process Roth conversions based on tax optimization
  //yearState = processRothConversion({
  //  rothOptimizerEnable,
  //  rothOptimizerStartYear,
  //  rothOptimizerEndYear,
  //  rothConversionStrategies
  //}, yearState);
  
  // 6. Non-Discretionary Expenses: Pay necessary expenses and taxes
  //yearState = processNonDiscretionaryExpenses(
  //  { events, expenseWithdrawalStrategies }, 
  //  yearState, 
  //  previousYearState
  //);
  
  // 7. Discretionary Expenses: Pay discretionary expenses if they don't violate financial goal
  //yearState = processDiscretionaryExpenses(
  //  { events, expenseWithdrawalStrategies, financialGoal }, 
  //  yearState
  //);
  
  // 8. Invest Events: Process investments of excess cash
  //yearState = processInvestEvents(
  //  { events, maximumCash }, 
  //  yearState
  //);
  
  // 9. Rebalance Events: Rebalance portfolio according to target allocations
  //yearState = processRebalanceEvents(
  //  { events }, 
  //  yearState
  //);
  
  // Calculate total assets at the end of the year
  yearState.totalAssets = calculateTotalAssets(yearState.investments);
  
  // Check if financial goal is met
  yearState.financialGoalMet = yearState.totalAssets >= financialGoal;
  
  return yearState;
}

module.exports = {
  simulateYear,
  isPersonAlive,
  calculateTotalAssets
}; 