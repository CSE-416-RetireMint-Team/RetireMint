const Inflation = require('../Schemas/Inflation');
const SimulationSettings = require('../Schemas/SimulationSettings');

// Helper function for converting YAML inflation format into DB format
function mapInflationAssumption(raw) {
  if (raw.type === 'fixed') {
    return {
      method: 'fixedPercentage',
      fixedPercentage: raw.value
    };
  } else if (raw.type === 'normal') {
    return {
      method: 'normalPercentage',
      normalPercentage: {
        mean: raw.mean,
        sd: raw.stdev
      }
    };
  } else if (raw.type === 'uniform') {
    return {
      method: 'uniformPercentage',
      uniformPercentage: {
        lowerBound: raw.lower,
        upperBound: raw.upper
      }
    };
  } else {
    throw new Error('Unsupported inflation type: ' + raw.type);
  }
}

async function mapToSimulationSettingsModel(yamlData) {
  const inflationInput = mapInflationAssumption(yamlData.inflationAssumption);
  const inflationDoc = await new Inflation(inflationInput).save();

  return new SimulationSettings({
    inflationAssumption: inflationDoc._id,
    contributionLimits: {
      afterTax: yamlData.afterTaxContributionLimit,
    },
    expenseWithdrawalStrategies: yamlData.expenseWithdrawalStrategy,
    spendingStrategy: yamlData.spendingStrategy,
    rmdStrategies: yamlData.RMDStrategy,
    rothConversionStrategies: yamlData.RothConversionStrategy,
    rothOptimizerEnable: yamlData.RothConversionOpt,
    rothOptimizerStartYear: yamlData.RothConversionStart,
    rothOptimizerEndYear: yamlData.RothConversionEnd,
  }).save();
}

module.exports = mapToSimulationSettingsModel;
