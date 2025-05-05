const mapInflation = require('./mapInflation');

function mapSimulationSettings(settings, allInvestments) {
  return {
    inflationAssumption: mapInflation(settings?.inflationAssumption),
    afterTaxContributionLimit:
      allInvestments.find(inv => inv.accountTaxStatus === 'after-tax')?.maxAnnualContribution ?? 0,
    spendingStrategy: settings?.spendingStrategy || [],
    expenseWithdrawalStrategy: settings?.expenseWithdrawalStrategies || [],
    RMDStrategy: settings?.rmdStrategies || [],
    RothConversionOpt: settings?.rothOptimizerEnable || false,
    RothConversionStart: settings?.rothOptimizerStartYear ?? null,
    RothConversionEnd: settings?.rothOptimizerEndYear ?? null,
    RothConversionStrategy: settings?.rothConversionStrategies || []
  };
}

module.exports = mapSimulationSettings;
