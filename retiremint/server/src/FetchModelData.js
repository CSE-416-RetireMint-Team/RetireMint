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

/**
 * Safely require a module, returning null if not found
 * @param {string} path - Module path to require
 * @returns {Object|null} - The required module or null if not found
 */
function safeRequire(path) {
  try {
    return require(path);
  } catch (error) {
    console.log(`Module not found: ${path}`);
    return null;
  }
}

/**
 * Fetch all collections from the database
 * @returns {Promise<Object>} - Object containing all collections
 */
async function fetchAllCollections() {
  console.log('\n==== FETCHING DATABASE COLLECTIONS DATA ====');
  
  try {
    // Initialize result object to store all collections
    const result = {
      incomeTaxes: [],
      capitalGains: [],
      standardDeductions: [],
      stateTaxes: [],
      rmdTables: [],
      scenarios: [],
      reports: [],
      othersCount: {}
    };
    
    // Fetch specific tax-related collections
    
    // Income Tax Data
    result.incomeTaxes = await IncomeTax.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 }).lean();
    
    // Map 'jointly' to 'married' for consistency
    result.incomeTaxes = result.incomeTaxes.map(tax => {
      if (tax.filingStatus === 'jointly') {
        return {
          ...tax,
          filingStatus: 'married'
        };
      }
      return tax;
    });
    
    // Capital Gains Data
    result.capitalGains = await CapitalGain.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 }).lean();
    
    // Standard Deduction Data
    result.standardDeductions = await StandardDeduction.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 }).lean();
    
    // RMD Tables (if available)
    try {
      const RMDTable = mongoose.model('RMDTable');
      result.rmdTables = await RMDTable.find({}).lean();
    } catch (error) {
      console.log('RMD Tables collection not available:', error.message);
    }
    
    // State Taxes (if available)
    try {
      const StateTax = mongoose.model('StateTax');
      result.stateTaxes = await StateTax.find({}).lean();
    } catch (error) {
      console.log('State Taxes collection not available:', error.message);
    }
    
    console.log('Fetched tax data collections successfully:');
    console.log(`- Income Taxes: ${result.incomeTaxes.length} records`);
    console.log(`- Capital Gains: ${result.capitalGains.length} records`);
    console.log(`- Standard Deductions: ${result.standardDeductions.length} records`);
    console.log(`- RMD Tables: ${result.rmdTables.length} records`);
    console.log(`- State Taxes: ${result.stateTaxes.length} records`);
    
    // Get all collection names from the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} total collections in the database`);
    
    // List all collection names
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    console.log('\n==== COMPLETED FETCHING DATABASE COLLECTIONS ====');
    
    return result;
  } catch (error) {
    console.error('❌ ERROR fetching collection data:', error.message);
    // Return empty collections if there's an error
    return {
      incomeTaxes: [],
      capitalGains: [],
      standardDeductions: [],
      stateTaxes: [],
      rmdTables: [],
      scenarios: [],
      reports: [],
      othersCount: {}
    };
  }
}

/**
 * Fetch and print scenario and tax data for debugging
 * @param {string} scenarioId - The ID of the scenario to fetch
 * @returns {Object} - Object containing the fetched scenario and tax data
 */
async function fetchAndLogModelData(scenarioId) {
  //console.log('\n==== SIMULATION DATA VERIFICATION ====');
  
  try {
    // Fetch the scenario
    const scenario = await Scenario.findById(scenarioId);
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
    const mappedStandardDeductionData = standardDeductionData.map(deduction => {
      if (deduction.filingStatus === 'jointly') {
        return {
          ...deduction.toObject(),
          filingStatus: 'married'
        };
      }
      return deduction;
    });
    
    // Fetch capital gains data for 'single' and 'married' filing statuses
    const capitalGainsData = await CapitalGain.find({
      filingStatus: { $in: ['single', 'married', 'jointly'] }
    }).sort({ year: -1 });
    
    // Log the tax data information
    console.log('Tax data information loaded');
    
    // Return the scenario and tax data
    return { 
      scenario,
      taxData: {
        incomeTax: mappedIncomeTaxData,
        standardDeduction: standardDeductionData,
        capitalGains: capitalGainsData
      }
    };
  } catch (error) {
    console.error('❌ ERROR fetching model data:', error.message);
    return { scenario: null, taxData: null };
  }
}

module.exports = {
  fetchAndLogModelData,
  fetchAllCollections
};
