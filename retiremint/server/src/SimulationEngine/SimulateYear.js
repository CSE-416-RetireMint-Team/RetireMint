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
const { runIncomeEvents } = require('./modules/IncomeEvents');
const { processRequiredMinimumDistributions } = require('./modules/RequiredMinimumDistributions');
const { processInvestmentReturns } = require('./modules/InvestmentReturns');
const { processRothConversion } = require('./modules/RothConversion');
const { processNonDiscretionaryExpenses } = require('./modules/NonDiscretionaryExpenses');
const { processDiscretionaryExpenses } = require('./modules/DiscretionaryExpenses');
const { processInvestEvents } = require('./modules/InvestEvents');
const { processRebalanceEvents } = require('./modules/RebalanceEvents');
const { calculateAdjustedTaxData } = require('./modules/Preliminaries'); // Import the new function

/**
 * Simulate a single year of financial activity
 * @param {Object} modelData - Contains scenario, taxData, etc.
 * @param {Array} investArray - Yearly investment strategy info or null
 * @param {Array} eventsByYear - Array of active event names per year
 * @param {Array} rebalanceArray - Yearly rebalance info or null
 * @param {Array} inflationArray - Yearly compounded inflation factor
 * @param {Array} maritalStatusArray - Yearly marital status ('single' or 'married')
 * @param {Number} currentYearIndex - The index (0 to numYears-1) of the year being simulated
 * @param {Object} previousYearState - State object from the previous year's simulation
 * @returns {Object} - Final state for the current year
 */
function simulateYear(modelData, investArray, eventsByYear, rebalanceArray, inflationArray, maritalStatusArray, currentYearIndex, previousYearState = null) {
  
  // --- Extract Core Data from modelData --- 
  const scenario = modelData.scenario;
  const taxData = modelData.taxData;
  if (!scenario || !taxData) {
      throw new Error(`SimulateYear Error: Missing scenario or taxData in modelData for year index ${currentYearIndex}.`);
  }
  const currentYear = new Date().getFullYear() + currentYearIndex;
  
  // --- Extract Data Specific to This Year --- 
  const currentInvestStrategyInfo = investArray[currentYearIndex]; 
  const currentRebalanceInfo = rebalanceArray[currentYearIndex];   
  const currentInflationFactor = inflationArray[currentYearIndex]; 
  const eventsActiveThisYear = eventsByYear[currentYearIndex];     
  const maritalStatusThisYear = maritalStatusArray[currentYearIndex]; // Get status for the current year

  // --- User/Spouse Ages & Status (derive from scenario and index) --- 
  const userAge = scenario.birthYear ? (currentYear - scenario.birthYear) : null;
  const spouseAge = (scenario.scenarioType === 'married' && scenario.spouseBirthYear) ? (currentYear - scenario.spouseBirthYear) : null;
  
  // --- Extract Other Necessary Parameters --- 
  const financialGoal = scenario.financialGoal;
  // Extract strategies from simulationSettings within scenario
  const simulationSettings = scenario.simulationSettings || {}; 
  const spendingStrategies = simulationSettings.spendingStrategies;
  const expenseWithdrawalStrategies = simulationSettings.expenseWithdrawalStrategies;
  const rmdStrategies = simulationSettings.rmdStrategies;
  const rothConversionStrategies = simulationSettings.rothConversionStrategies;
  const rothOptimizerEnable = simulationSettings.rothOptimizerEnable;
  const rothOptimizerStartYear = simulationSettings.rothOptimizerStartYear;
  const rothOptimizerEndYear = simulationSettings.rothOptimizerEndYear;

  const userState = scenario.stateOfResidence;
  // 1) preliminaries.js
  
  // --- Calculate Adjusted Tax Data using Preliminaries module --- 
  const {
      adjustedStandardDeduction,
      adjustedIncomeTaxBrackets,
      adjustedStateTaxBrackets,
      adjustedCapitalGainsBrackets
  } = calculateAdjustedTaxData(
      taxData, 
      maritalStatusThisYear, 
      currentYear, 
      currentYearIndex, 
      currentInflationFactor, 
      userState
  );

  // Initialize the state for this year based on the previous state
  let yearState = {
    year: currentYear,
    userAge,
    spouseAge,
    scenarioType: maritalStatusThisYear,
    cash: previousYearState?.cash ?? (scenario.initialCash || 0), // Initialize cash correctly
    totalAssets: 0, // Will be calculated later
    investments: previousYearState?.investments ? JSON.parse(JSON.stringify(previousYearState.investments)) : (scenario.investments ? JSON.parse(JSON.stringify(scenario.investments)) : []),
    incomeEventStates: previousYearState?.incomeEventStates || {},
    curYearIncome: 0, // Initialize yearly totals
    curYearExpenses: 0,
    curYearTaxes: 0,
    curYearSS: 0,
    curYearGains: 0,
    curYearEarlyWithdrawals: 0,
    totalInvestmentValue: 0, // Placeholder
    // incomeEventStates will be set after income calc
  };

  // Initial asset calculation if first year
   if (currentYearIndex === 0) {
       yearState.totalInvestmentValue = calculateTotalAssets(yearState.investments); // Calculate initial investment value
       yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash; // Initial total assets
   } else if (previousYearState) {
       // Carry over total assets from previous year before modifications THIS YEAR
       yearState.totalAssets = previousYearState.totalAssets;
       yearState.totalInvestmentValue = previousYearState.totalInvestmentValue;
       // Cash is already carried over
   }

  // --- Core Simulation Logic --- 

  // 2) Run Income Events
  console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Processing Income Events ---`);
  try {
      const initialCashForYear = yearState.cash; // Cash before income is added
      const incomeResult = runIncomeEvents(
          modelData,                // Pass full model data (contains events)
          eventsActiveThisYear,     // Pass active event names
          maritalStatusThisYear,
          currentInflationFactor,
          previousYearState?.incomeEventStates, // Pass the income states from the *previous* year
          initialCashForYear        // Pass cash *before* income processing
      );

      // Update yearState with the results from runIncomeEvents
      yearState.cash = incomeResult.cash;
      yearState.curYearIncome = incomeResult.curYearIncome;
      yearState.curYearSS = incomeResult.curYearSS;
      // Store the calculated states for the *next* year's previous state
      yearState.incomeEventStates = incomeResult.incomeEventStates;

      // Log the returned values
      console.log(`Year ${currentYear}: Income Processed. Returned -> Cash: ${incomeResult.cash}, Taxable Income: ${incomeResult.curYearIncome}, SS Income: ${incomeResult.curYearSS}`);

  } catch (error) {
       console.error(`Year ${currentYear}: Error processing income events:`, error);
       // Decide how to handle error - stop simulation? Continue with 0 income impact?
       // Resetting calculated income for safety in case of partial processing
       yearState.curYearIncome = 0;
       yearState.curYearSS = 0;
       // Cash might be inconsistent if error occurred mid-way. Revert or use last known good?
       yearState.cash = previousYearState?.cash ?? (scenario.initialCash || 0); // Revert cash to previous state
       yearState.incomeEventStates = previousYearState?.incomeEventStates || {}; // Revert states
  }

  // Check if financial goal is met
  yearState.financialGoalMet = yearState.totalAssets >= financialGoal; // Use final totalAssets

  return yearState;
}

function calculateTotalAssets(investments) {
    let total = 0;
    (investments || []).forEach(inv => { total += inv?.value || 0 });
    return total;
}

module.exports = {
  simulateYear,
}; 