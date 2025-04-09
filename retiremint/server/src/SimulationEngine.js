/**
 * Financial Simulation Engine for RetireMint
 * Adapted from standalone_sim.js for integration with MongoDB and frontend
 */
const TaxData = require('./Schemas/TaxData');
const Report = require('./Schemas/Report');
const IncomeTax = require('./Schemas/IncomeTax');
const StandardDeduction = require('./Schemas/StandardDeductions');
const CapitalGain = require('./Schemas/CapitalGain');
const { fetchAndLogModelData } = require('./FetchModelData');

// Track if we've already logged data for debugging
let hasLoggedDataThisSession = false;

/**
 * Runs multiple simulations based on user scenarios and tax data
 * @param {Object} scenario - User's financial scenario
 * @param {Object} userData - User data (age, spouse, etc.)
 * @param {Object} taxData - Tax brackets and other tax info
 * @param {Number} numSimulations - Number of simulations to run
 * @returns {Object} - Simulation results including visualizations
 */
async function runSimulations(scenario, userData, taxData, numSimulations = 100, numYears = 30) {
  try {
    console.log(`Running ${numSimulations} simulations for scenario ${scenario.name}...`);
    
    // Validate necessary parameters
    if (!scenario) {
      console.error('No scenario provided to runSimulations');
      throw new Error('No scenario provided to simulation engine');
    }
    
    // Fetch and log model data for verification - only once per session
    if (!hasLoggedDataThisSession) {
      console.log('Validating input data before running simulation...');
      const { scenario: fetchedScenario, taxData: fetchedTaxData } = await fetchAndLogModelData(scenario._id);
      hasLoggedDataThisSession = true; // Mark that we've logged data
    } else {
      console.log('Data verification already performed this session, skipping detailed logging.');
    }
    
    // We'll continue with the parameters passed to this function,
    // but the logging will help us verify what's in the database
    
    if (!userData) {
      console.warn('No userData provided, using defaults');
      userData = {
        _id: 'guest',
        age: 30,
        hasSpouse: false,
        spouseAge: null
      };
    }
    
    if (!taxData) {
      console.warn('No taxData provided, fetching from database');
      
      // Fetch tax data from their respective collections
      const taxDataObj = await TaxData.findOne().sort({ taxYear: -1 });
      
      // Fetch income tax data for single and married
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
      
      // Fetch standard deduction data for single and married
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
      
      // Fetch capital gains data for single and married
      const capitalGainsData = await CapitalGain.find({
        filingStatus: { $in: ['single', 'married', 'jointly'] }
      }).sort({ year: -1 });
      
      // Map 'jointly' to 'married' for consistency
      const mappedCapitalGainsData = capitalGainsData.map(capitalGain => {
        if (capitalGain.filingStatus === 'jointly') {
          return {
            ...capitalGain.toObject(),
            filingStatus: 'married'
          };
        }
        return capitalGain;
      });
      
      if (taxDataObj) {
        taxData = {
          ...taxDataObj.toObject(),
          incomeTax: mappedIncomeTaxData,
          standardDeduction: mappedStandardDeductionData,
          capitalGain: mappedCapitalGainsData
        };
      } else {
        // Use default tax data structure
        taxData = {
          taxYear: new Date().getFullYear(),
          federal: {},
          rmdTable: {},
          incomeTax: [],
          standardDeduction: [],
          capitalGain: []
        };
      }
    }
    
    // For now, we'll just return a basic report structure with the fetched data
    // instead of running the actual simulation
    //console.log('Skipping actual simulation for debugging purposes');
    
    return {
      metadata: {
        numSimulations,
        numYears,
        scenarioName: scenario.name || 'Unnamed Scenario',
        scenarioId: scenario._id,
        dateRun: new Date().toISOString(),
        userId: userData._id || 'guest'
      },
      status: 'data_verification_only',
      dataVerified: true,
      reportId: null,
      message: 'Data verification complete. No simulation was run.'
    };
    
    // Comment out the rest of the function for now
    /*
    // Create base simulation parameters
    console.log('Creating base parameters from scenario...');
    const baseParams = createBaseParamsFromScenario(scenario, userData, taxData);
    
    // Rest of original function...
    */
  } catch (error) {
    console.error('Error in runSimulations:', error);
    return {
      error: true,
      message: error.message,
      stack: error.stack
    };
  }
}

// Export public API
module.exports = {
  runSimulations,
  // Reset flag for testing purposes
  resetLogFlag: () => { hasLoggedDataThisSession = false; }
}; 