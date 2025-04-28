/**
 * Utility module to fetch and log simulation model data
 * This module is used for debugging purposes to verify data retrieval
 */
const mongoose = require('mongoose');
const Scenario = require('./Schemas/Scenario');
// Import essential schemas that we know exist
const IncomeTax = require('./Schemas/IncomeTax');
const StandardDeduction = require('./Schemas/StandardDeductions');
const CapitalGain = require('./Schemas/CapitalGain');
const RMDTable = require('./Schemas/RMDTable');
const StateTax = require('./Schemas/StateTax');
const SimulationSettings = require('./Schemas/SimulationSettings');
const Inflation = require('./Schemas/Inflation');
const Investment = require('./Schemas/Investments'); 
const InvestmentType = require('./Schemas/InvestmentType');
const EventSeries = require('./Schemas/EventSeries');
const ExpectedReturnOrIncome = require('./Schemas/ExpectedReturnOrIncome');
const StartYear = require('./Schemas/StartYear');
const Duration = require('./Schemas/Duration');
const Income = require('./Schemas/Income');
const Expense = require('./Schemas/Expense');
const Invest = require('./Schemas/Invest');
const Rebalance = require('./Schemas/Rebalance');
const Allocation = require('./Schemas/Allocation');
const ExpectedAnnualChange = require('./Schemas/ExpectedAnnualChange');

/**
 * Safely require a module, returning null if not found
 * @param {string} path - Module path to require
 * @returns {Object|null} - The required module or null if not found
 */
// function safeRequire(path) {
//   try {
//     return require(path);
//   } catch (error) {
//     console.log(`Module not found: ${path}`);
//     return null;
//   }
// }

/**
 * Fetch and print scenario and tax data for debugging
 * @param {string} scenarioId - The ID of the scenario to fetch
 * @returns {Object} - Object containing the fetched scenario and tax data
 */
async function fetchAndLogModelData(scenarioId) {
  //console.log('\n==== SIMULATION DATA VERIFICATION ====');
  
  try {
    // Fetch the scenario and populate nested fields
    const scenario = await Scenario.findById(scenarioId)
      .populate('lifeExpectancy') 
      .populate('spouseLifeExpectancy')
      .populate({
        path: 'simulationSettings',
        populate: {
          path: 'inflationAssumption'
        }
      })
      .populate({
        path: 'investments',
        populate: {
            path: 'investmentType',
            populate: [
                { path: 'expectedAnnualReturn' },
                { path: 'expectedAnnualIncome' }
            ]
        }
      })
      .populate({
        path: 'events', 
        populate: [
            { path: 'startYear' },
            { path: 'duration' },
            { path: 'income',
              populate: { path: 'expectedAnnualChange' }
            },
            { path: 'expense',
              populate: { path: 'expectedAnnualChange' }
            },
            { path: 'invest',
              populate: { path: 'allocations' }
            },
            { path: 'rebalance',
              populate: { path: 'allocations' }
            }
        ]
      });
      
    if (!scenario) {
      console.error('❌ ERROR: Scenario not found in database');
      return { scenario: null };
    }
    
    // Add checks to ensure population worked
    if (!scenario.simulationSettings) {
        console.error('❌ ERROR: Failed to populate simulationSettings for scenario:', scenarioId);
        return { scenario: null };
    }
    if (!scenario.simulationSettings.inflationAssumption) {
        console.error('❌ ERROR: Failed to populate inflationAssumption within simulationSettings for scenario:', scenarioId);
        return { scenario: null };
    }
    
    // Add checks for investments and events population
    if (!scenario.investments || (scenario.investments.length > 0 && !scenario.investments[0]._id)) {
        console.error('❌ ERROR: Failed to populate investments for scenario:', scenarioId);
        return { scenario: null };
    }
    if (scenario.investments.length > 0 && scenario.investments[0].investmentType && !scenario.investments[0].investmentType._id) {
        console.error('❌ ERROR: Failed to populate nested investmentType within investments for scenario:', scenarioId);
        return { scenario: null };
    }
    // Check deeper population within investmentType
    if (scenario.investments.length > 0 && scenario.investments[0].investmentType?.expectedAnnualReturn && !scenario.investments[0].investmentType.expectedAnnualReturn._id) {
        console.error('❌ ERROR: Failed to populate nested expectedAnnualReturn within investmentType for scenario:', scenarioId);
        return { scenario: null };
    }
    if (scenario.investments.length > 0 && scenario.investments[0].investmentType?.expectedAnnualIncome && !scenario.investments[0].investmentType.expectedAnnualIncome._id) {
        console.error('❌ ERROR: Failed to populate nested expectedAnnualIncome within investmentType for scenario:', scenarioId);
        return { scenario: null };
    }
    if (!scenario.events || (scenario.events.length > 0 && !scenario.events[0]._id)) {
        console.error('❌ ERROR: Failed to populate events for scenario:', scenarioId);
        return { scenario: null };
    }
    // Check event sub-populations (only check if the first event exists and has the field populated)
    if (scenario.events.length > 0 && scenario.events[0].startYear && !scenario.events[0].startYear._id) {
        console.error('❌ ERROR: Failed to populate events.startYear for scenario:', scenarioId);
        return { scenario: null };
    }
     if (scenario.events.length > 0 && scenario.events[0].duration && !scenario.events[0].duration._id) {
        console.error('❌ ERROR: Failed to populate events.duration for scenario:', scenarioId);
        return { scenario: null };
    }
    // Check event sub-populations deeper
    if (scenario.events.length > 0 && scenario.events[0].income?.expectedAnnualChange && !scenario.events[0].income.expectedAnnualChange._id) {
        console.error('❌ ERROR: Failed to populate events.income.expectedAnnualChange for scenario:', scenarioId);
        return { scenario: null };
    }
     if (scenario.events.length > 0 && scenario.events[0].expense?.expectedAnnualChange && !scenario.events[0].expense.expectedAnnualChange._id) {
        console.error('❌ ERROR: Failed to populate events.expense.expectedAnnualChange for scenario:', scenarioId);
        return { scenario: null };
    }
     if (scenario.events.length > 0 && scenario.events[0].invest?.allocations && !scenario.events[0].invest.allocations._id) {
        console.error('❌ ERROR: Failed to populate events.invest.allocations for scenario:', scenarioId);
        return { scenario: null };
    }
     if (scenario.events.length > 0 && scenario.events[0].rebalance?.allocations && !scenario.events[0].rebalance.allocations._id) {
        console.error('❌ ERROR: Failed to populate events.rebalance.allocations for scenario:', scenarioId);
        return { scenario: null };
    }
    
    console.log('\nSCENARIO DATA RETRIEVED');
    //console.log(JSON.stringify(scenario, null, 2));
    //console.log('\n----------------');
    
    // Fetch income tax data for 'single' and 'married' filing statuses
    const incomeTaxData = await IncomeTax.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 });
    
    // Map 'jointly' to 'married' for consistency
    const mappedIncomeTaxData = incomeTaxData.map(tax => {
      if (tax.filingStatus === 'jointly') {
        return {
          ...tax.toObject(),
          filingStatus: 'married'
        };
      }
      return tax;
    });
    
    // Fetch standard deduction data for 'single' and 'married' filing statuses
    const standardDeductionData = await StandardDeduction.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 });
    
    // Map 'jointly' to 'married' for consistency
    // const mappedStandardDeductionData = standardDeductionData.map(deduction => {
    //   if (deduction.filingStatus === 'jointly') {
    //     return {
    //       ...deduction.toObject(),
    //       filingStatus: 'married'
    //     };
    //   }
    //   return deduction;
    // });
    
    // Fetch capital gains data for 'single' and 'married' filing statuses
    const capitalGainsData = await CapitalGain.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 });

    // Fetch RMD Table data (limit to 5 for logging)
    const rmdTableData = await RMDTable.find().limit(5);

    // Fetch State Tax data
    const stateTaxData = await StateTax.find();
    
    // Log the tax data information
    //console.log('Tax data information loaded');
    
    // Return the fully populated scenario and tax data
    return { 
      scenario,
      taxData: {
        incomeTax: mappedIncomeTaxData,
        standardDeduction: standardDeductionData,
        capitalGains: capitalGainsData,
        rmdTables: rmdTableData,
        stateTaxes: stateTaxData
      }
    };
  } catch (error) {
    console.error('❌ ERROR fetching or populating model data:', error.message);
    console.error(error.stack);
    return { scenario: null, taxData: null };
  }
}

module.exports = {
  fetchAndLogModelData
};
