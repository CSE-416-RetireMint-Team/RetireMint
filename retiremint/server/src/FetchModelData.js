/**
 * Utility module to fetch and log simulation model data
 * This module is used for debugging purposes to verify data retrieval
 */
const mongoose = require('mongoose');
const Scenario = require('./Schemas/Scenario');
const TaxData = require('./Schemas/TaxData');
const IncomeTax = require('./Schemas/IncomeTax');
const StandardDeduction = require('./Schemas/StandardDeductions');
const CapitalGain = require('./Schemas/CapitalGain');

/**
 * Fetch and print scenario and tax data for debugging
 * @param {string} scenarioId - The ID of the scenario to fetch
 * @returns {Object} - Object containing the fetched scenario and tax data
 */
async function fetchAndLogModelData(scenarioId) {
  //console.log('\n==== SIMULATION DATA VERIFICATION ====');
  //console.log('Fetching model data for simulation...');
  //console.log(`Scenario ID: ${scenarioId}`);
  
  try {
    // Fetch the scenario
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      console.error('❌ ERROR: Scenario not found in database');
      return { scenario: null, taxData: null };
    }
    
    console.log('\nSCENARIO DATA RETRIEVED:');
    //console.log(JSON.stringify(scenario, null, 2));
    //console.log('\n----------------');
    
    // Fetch the most recent tax data
    const taxData = await TaxData.findOne().sort({ taxYear: -1 });
    if (!taxData) {
      console.error('❌ ERROR: Tax data not found in database');
      return { scenario, taxData: null };
    }
    
    console.log('\nTAX DATA RETRIEVED:');
    //console.log(JSON.stringify(taxData, null, 2));
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
    
    // console.log('\n✅ VALIDATION CHECKS:');
    // // Basic validation of scenario data
    // console.log(`- Scenario name: ${scenario.name || 'MISSING'}`);
    // console.log(`- Scenario type: ${scenario.scenarioType || 'MISSING'}`);
    // console.log(`- Number of investments: ${scenario.investments?.length || 0}`);
    // console.log(`- Number of events: ${scenario.events?.length || 0}`);
    
    // Basic validation of tax data
    //console.log(`\n✅ TAX DATA DETAILS:`);
    //console.log(`- Tax year: ${taxData.taxYear || 'MISSING'}`);
    
    // Print federal income tax brackets from IncomeTax collection
    if (mappedIncomeTaxData && mappedIncomeTaxData.length > 0) {
      console.log('\nFEDERAL INCOME TAX BRACKETS SUCCESSFULLY RETRIEVED');
    //   mappedIncomeTaxData.forEach(taxData => {
    //     console.log(`  Filing Status: ${taxData.filingStatus}`);
    //     taxData.brackets.forEach((bracket, index) => {
    //       console.log(`  [${index + 1}] ${bracket.rate} - Min: ${bracket.minIncome}, Max: ${bracket.maxIncome}`);
        //});
      //});
    } else {
      console.log('❌ Missing federal income tax brackets');
    }
    
    // Print standard deductions from StandardDeduction collection
    console.log('\nSTANDARD DEDUCTIONS SUCCESSFULLY RETRIEVED');
    if (mappedStandardDeductionData && mappedStandardDeductionData.length > 0) {
    //   mappedStandardDeductionData.forEach(deduction => {
    //     console.log(`  - ${deduction.filingStatus}: $${deduction.standardDeduction.toLocaleString()}`);
    //   });
    } else {
      console.log('❌ Missing standard deductions data');
    }
    
    // Print capital gains rates from CapitalGain collection
    console.log('\nCAPITAL GAINS RATES SUCCESSFULLY RETRIEVED');
    if (mappedCapitalGainsData && mappedCapitalGainsData.length > 0) {
    //   mappedCapitalGainsData.forEach(capitalGain => {
    //     console.log(`  Filing Status: ${capitalGain.filingStatus}`);
    //     capitalGain.longTermCapitalGains.forEach((gain, index) => {
    //       console.log(`  - Rate ${gain.rate}: ${gain.threshold}`);
    //     });
    //   });
    } else {
      console.log('❌ Missing capital gains data');
    }
    
    // Print RMD table sample
    if (taxData.rmdTable && Object.keys(taxData.rmdTable).length > 0) {
      console.log('\nRMD TABLE SUCCESSFULLY RETRIEVED');
    //   // Print just a sample of the RMD table
    //   const ages = Object.keys(taxData.rmdTable).sort((a, b) => parseInt(a) - parseInt(b));
    //   const sampleAges = ages.slice(0, Math.min(5, ages.length));
    //   sampleAges.forEach(age => {
    //     console.log(`  - Age ${age}: ${taxData.rmdTable[age]}`);
    //   });
    //  console.log(`  - (${ages.length} age entries total)`);
    } else {
      console.log('\n❌ Missing RMD table');
    }
    
    console.log('\n==== END OF DATA VERIFICATION ====\n');
    
    // Add the fetched tax data to the returned object
    return { 
      scenario, 
      taxData: {
        ...taxData.toObject(),
        incomeTax: mappedIncomeTaxData,
        standardDeduction: mappedStandardDeductionData,
        capitalGain: mappedCapitalGainsData
      } 
    };
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch model data:', error);
    return { scenario: null, taxData: null, error };
  }
}

module.exports = {
  fetchAndLogModelData
};
