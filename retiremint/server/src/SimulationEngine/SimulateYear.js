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
const { calculateCurrentNonDiscExpenses } = require('./modules/NonDiscretionaryExpenseEvents'); // Import new expense calculator
const { processDiscretionaryExpenses } = require('./modules/DiscretionaryExpenses'); // Import new discretionary expense processor
const { processInvestEvents } = require('./modules/InvestEvents'); // Import Invest processor
const { processRebalanceEvents } = require('./modules/RebalanceEvents'); // Import Rebalance processor
const { calculateAdjustedTaxData } = require('./modules/Preliminaries'); // Import the tax data adjuster
const { calculateIncomeTax, calculateCapitalGainsTax } = require('./Utils/TaxCalculators'); // Import tax calculators
const { performWithdrawal } = require('./Utils/WithdrawalUtils'); // Import withdrawal utility

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
  const spendingStrategy = simulationSettings.spendingStrategy;
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
    // Initialize investments: carry over if exists, otherwise map from scenario adding costBasis
    investments: previousYearState?.investments 
        ? JSON.parse(JSON.stringify(previousYearState.investments)) 
        : (scenario.investments 
            ? JSON.parse(JSON.stringify(scenario.investments)).map(inv => ({ ...inv, costBasis: inv.value || 0 })) 
            : []),
    incomeEventStates: previousYearState?.incomeEventStates || {},
    curYearIncome: 0, // Initialize yearly totals
    curYearExpenses: 0,
    curYearTaxes: 0,
    curYearSS: 0,
    curYearGains: 0,
    curYearEarlyWithdrawals: 0,
    totalInvestmentValue: 0, // Placeholder
    nonDiscExpenseEventStates: previousYearState?.nonDiscExpenseEventStates || {}, // Initialize expense states
    discExpenseEventStates: previousYearState?.discExpenseEventStates || {}, // Initialize disc expense states
  };

  // Initial asset calculation if first year
   if (currentYearIndex === 0) {
       // Cost basis is initialized above when mapping scenario.investments
       yearState.totalInvestmentValue = calculateTotalAssets(yearState.investments); // Calculate initial investment value
       yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash; // Initial total assets
   } else if (previousYearState) {
       // Carry over total assets from previous year before modifications THIS YEAR
       yearState.totalAssets = previousYearState.totalAssets;
       yearState.totalInvestmentValue = previousYearState.totalInvestmentValue;
       // Cash, investments (including costBasis), and expense states are carried over
   }

  // --- Core Simulation Logic --- 
  let previousYearTaxes = 0;
  let currentNonDiscExpenses = 0;

  // Calculate Previous Year's Taxes (if not the first year)
  if (currentYearIndex > 0 && previousYearState) {
      // Recalculate the PREVIOUS year's adjusted tax data
      const prevYearIndex = currentYearIndex - 1;
      const prevYearMaritalStatus = maritalStatusArray[prevYearIndex];
      const prevYearInflationFactor = inflationArray[prevYearIndex];
      const prevYear = currentYear - 1;
      
      const {
          adjustedStandardDeduction: prevAdjStdDed, 
          adjustedIncomeTaxBrackets: prevAdjFedBrackets, 
          adjustedStateTaxBrackets: prevAdjStateBrackets, 
          adjustedCapitalGainsBrackets: prevAdjCapGainsBrackets
      } = calculateAdjustedTaxData(
          taxData, 
          prevYearMaritalStatus, 
          prevYear, 
          prevYearIndex, 
          prevYearInflationFactor, 
          userState
      );

      const prevData = previousYearState;
    
      // a. Previous Federal Income Tax
      const prevFedTaxableIncomeGross = prevData.curYearIncome - (0.15 * prevData.curYearSS);
      const prevFedTaxableIncomeNet = Math.max(0, prevFedTaxableIncomeGross - prevAdjStdDed);
      const prevFedIncomeTax = calculateIncomeTax(prevFedTaxableIncomeNet, prevAdjFedBrackets);
      
      // a. Previous State Income Tax (Simplified)
      const prevStateTaxableIncomeNet = prevFedTaxableIncomeNet; // Simplification
      const prevStateIncomeTax = calculateIncomeTax(prevStateTaxableIncomeNet, prevAdjStateBrackets);
      
      // b. Previous Capital Gains Tax
      const prevCapGainsTax = calculateCapitalGainsTax(prevData.curYearGains, prevFedTaxableIncomeNet, prevAdjCapGainsBrackets);
      
      // c. Previous Early Withdrawal Tax (10% penalty)
      const prevEarlyWithdrawalPenalty = 0.10 * prevData.curYearEarlyWithdrawals;
      
      previousYearTaxes = prevFedIncomeTax + prevStateIncomeTax + prevCapGainsTax + prevEarlyWithdrawalPenalty;
      // console.log(`Year ${currentYear}: Calculated Previous Year (${prevYear}) Taxes: Fed=${prevFedIncomeTax.toFixed(2)}, State=${prevStateIncomeTax.toFixed(2)}, CapGains=${prevCapGainsTax.toFixed(2)}, EarlyPenalty=${prevEarlyWithdrawalPenalty.toFixed(2)}, Total=${previousYearTaxes.toFixed(2)}`);
  } else if (currentYearIndex === 0) {
      //  console.log(`Year ${currentYear}: First year, no previous taxes to calculate.`);
  } else if (currentYearIndex > 0 && !previousYearState) {
      // Add a specific warning if previousYearState is unexpectedly null/undefined after year 0
      console.warn(`Year ${currentYear}: Cannot calculate previous year's taxes. Missing previousYearState data.`);
  }

  // Calculate Current Year's Non-Discretionary Expenses
  try {
      const expenseResult = calculateCurrentNonDiscExpenses(
          modelData,
          eventsActiveThisYear,
          maritalStatusThisYear,
          currentInflationFactor,
          previousYearState?.nonDiscExpenseEventStates // Pass previous state for expense events
      );
      currentNonDiscExpenses = expenseResult.totalNonDiscExpenses;
      yearState.nonDiscExpenseEventStates = expenseResult.expenseEventStates; // Store new state
      // console.log(`Year ${currentYear}: Calculated Current Non-Discretionary Expenses: ${currentNonDiscExpenses.toFixed(2)}`);
  } catch (error) {
      console.error(`Year ${currentYear}: Error calculating current non-discretionary expenses:`, error);
      currentNonDiscExpenses = 0; // Proceed with zero expenses if calculation fails
  }

  // Total Payment Amount Needed for Step 6
  const totalPaymentNeededForStep6 = previousYearTaxes + currentNonDiscExpenses;

  // 2) Run Income Events
  // console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Processing Income Events ---`);
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
      // console.log(`Year ${currentYear}: Income Processed. Returned -> Cash: ${incomeResult.cash}, Taxable Income: ${incomeResult.curYearIncome}, SS Income: ${incomeResult.curYearSS}`);

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

  // 3) Required Minimum Distributions
  // console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Processing RMDs ---`);
  try {
      // Pass necessary data: strategies, tables, age, current state, previous state
      yearState = processRequiredMinimumDistributions(
          rmdStrategies, 
          taxData.rmdTables, // Pass the raw RMD tables 
          userAge, 
          yearState, 
          previousYearState
      );
      // console.log(`Year ${currentYear}: RMDs processed. curYearIncome: ${yearState.curYearIncome}`);
  } catch (error) {
       console.error(`Year ${currentYear}: Error processing RMDs:`, error);
       // Decide how to handle error
  }

  // 4) Process Investment Returns
  // console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Processing Investment Returns ---`);
  try {
      // Pass the current yearState. The function will modify investments and income totals within it.
      yearState = processInvestmentReturns(null, yearState);
      
      // After investment returns, update total investment value and total assets
      yearState.totalInvestmentValue = calculateTotalAssets(yearState.investments);
      yearState.totalAssets = yearState.totalInvestmentValue + yearState.cash;
      
      // console.log(`Year ${currentYear}: Investment Returns processed. curYearIncome: ${yearState.curYearIncome.toFixed(2)}, totalAssets: ${yearState.totalAssets.toFixed(2)}`); 

  } catch (error) {
       console.error(`Year ${currentYear}: Error processing investment returns:`, error);
       // Decide how to handle error - potentially revert investment changes?
  }

  // 5) Process Roth Conversions
  // console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Processing Roth Conversions ---`); // Optional: Keep for debugging which step it is
  try {
      // Skip if no Roth conversion strategies defined
      if (rothConversionStrategies && rothConversionStrategies.length > 0) {
          // Store income before potential conversion for comparison
          const incomeBeforeConversion = yearState.curYearIncome; 
          
          const rothResult = processRothConversion(
              rothConversionStrategies,
              adjustedIncomeTaxBrackets, // Pass the adjusted brackets
              adjustedStandardDeduction,
              yearState.curYearIncome,
              yearState.curYearSS,
              yearState.investments,
              currentYear,
              rothOptimizerEnable,
              rothOptimizerStartYear,
              rothOptimizerEndYear
          );
          
          // Update year state with conversion results
          yearState.investments = rothResult.investments;
          yearState.curYearIncome = rothResult.curYearIncome;
          yearState.rothConversionAmount = rothResult.conversionAmount;
          
          // Only log if a conversion actually happened
          if (rothResult.conversionAmount > 0) {
              // console.log(`--- Year ${currentYear} (Idx ${currentYearIndex}): Roth Conversion Occurred ---`);
              // console.log(`    Before: curYearIncome=${incomeBeforeConversion.toFixed(2)}, curYearSS=${yearState.curYearSS.toFixed(2)}, adjStdDed=${adjustedStandardDeduction.toFixed(2)}`);
              // console.log(`    After:  conversionAmount=${rothResult.conversionAmount.toFixed(2)}, newCurYearIncome=${yearState.curYearIncome.toFixed(2)}`);
          }
          
          // Recalculate total investment value after conversions
          yearState.totalInvestmentValue = calculateTotalAssets(yearState.investments);
      }
  } catch (error) {
      console.error(`Year ${currentYear}: Error processing Roth conversions:`, error);
      // Continue with simulation, no Roth conversions applied
  }

  // 6) Pay Non-Discretionary Expenses and Previous Year's Taxes
  try {
      yearState = processNonDiscretionaryExpenses(
          totalPaymentNeededForStep6,
          yearState,
          expenseWithdrawalStrategies, 
          userAge
      );
      yearState.curYearTaxes = previousYearTaxes; 
  } catch (error) {
       console.error(`Year ${currentYear}: Error processing non-discretionary expenses/withdrawals:`, error);
  }

  // 7) Pay Discretionary Expenses 
  try {
      yearState = processDiscretionaryExpenses(
          modelData, 
          eventsActiveThisYear,
          spendingStrategy, // Pass the correctly named variable
          expenseWithdrawalStrategies, 
          financialGoal,
          userAge,
          maritalStatusThisYear,
          currentInflationFactor,
          yearState, 
          previousYearState?.discExpenseEventStates 
      );
      // Note: curYearExpenses is updated inside processDiscretionaryExpenses
  } catch (error) {
      console.error(`Year ${currentYear}: Error processing discretionary expenses:`, error);
  }

  // 8) Process Invest Events
  try {
    // Get the strategy info for the current year from the pre-calculated array
    const currentInvestStrategyInfo = investArray[currentYearIndex];
    yearState = processInvestEvents(
        currentInvestStrategyInfo, 
        yearState, 
        currentInflationFactor,
        modelData // Pass full modelData to access initial investment definitions
    );
  } catch (error) {
      console.error(`Year ${currentYear}: Error processing invest events:`, error);
  }

  // 9) Process Rebalance Events
  try {
    const currentRebalanceInfo = rebalanceArray[currentYearIndex];
    yearState = processRebalanceEvents(currentRebalanceInfo, yearState);
  } catch (error) {
      console.error(`Year ${currentYear}: Error processing rebalance events:`, error);
  }

  // Check if financial goal is met
  yearState.financialGoalMet = yearState.totalAssets >= financialGoal;

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