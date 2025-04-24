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
    // Fetch the scenario and populate life expectancy fields
    const scenario = await Scenario.findById(scenarioId)
      .populate('lifeExpectancy') 
      .populate('spouseLifeExpectancy');
      
    if (!scenario) {
      console.error('❌ ERROR: Scenario not found in database');
      return { scenario: null };
    }
    
    console.log('\nSCENARIO DATA RETRIEVED:');
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
    console.log('Tax data information loaded');
    
    // Return the scenario and tax data
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
    console.error('❌ ERROR fetching model data:', error.message);
    return { scenario: null, taxData: null };
  }
}

module.exports = {
  fetchAndLogModelData
};
