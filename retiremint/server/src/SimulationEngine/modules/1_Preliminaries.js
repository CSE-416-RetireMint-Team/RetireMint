/**
 * Preliminaries.js - Module for handling preliminary calculations for each year of simulation
 * 
 * This module handles:
 * 1. Sampling inflation rate from probability distribution 
 * 2. Computing inflation-adjusted tax brackets
 * 3. Computing inflation-adjusted annual limits on retirement account contributions
 */

/**
 * Sample inflation rate based on the provided inflation assumption
 * @param {Object} inflationAssumption - Inflation assumption configuration
 * @returns {Number} - Sampled inflation rate
 */
function sampleInflationRate(inflationAssumption) {
  const { method, fixedPercentage, normalPercentage, uniformPercentage } = inflationAssumption;
  
  switch (method) {
    case 'fixedPercentage':
      return fixedPercentage / 100;
    
    case 'normalPercentage':
      // Sample from normal distribution
      const { mean, sd } = normalPercentage;
      // Box-Muller transform to generate normal random variable
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return (z0 * sd + mean) / 100;
    
    case 'uniformPercentage':
      // Sample from uniform distribution
      const { lowerBound, upperBound } = uniformPercentage;
      return (lowerBound + Math.random() * (upperBound - lowerBound)) / 100;
    
    default:
      // Default to 2% inflation if method is not specified
      return 0.02;
  }
}

/**
 * Compute inflation-adjusted tax brackets for the current year
 * @param {Array} previousYearBrackets - Previous year's tax brackets
 * @param {Number} inflationRate - Inflation rate for the current year
 * @returns {Array} - Updated tax brackets adjusted for inflation
 */
function computeInflationAdjustedTaxBrackets(previousYearBrackets, inflationRate) {
  if (!previousYearBrackets || !Array.isArray(previousYearBrackets)) {
    return [];
  }
  
  return previousYearBrackets.map(bracket => {
    return {
      ...bracket,
      lowerBound: bracket.lowerBound * (1 + inflationRate),
      upperBound: bracket.upperBound ? bracket.upperBound * (1 + inflationRate) : null,
    };
  });
}

/**
 * Compute inflation-adjusted annual limits on retirement account contributions
 * @param {Object} previousYearLimits - Previous year's contribution limits
 * @param {Number} inflationRate - Inflation rate for the current year
 * @returns {Object} - Updated contribution limits adjusted for inflation
 */
function computeInflationAdjustedContributionLimits(previousYearLimits, inflationRate) {
  if (!previousYearLimits) {
    return {
      preTax: 20500, // Default 2022 pre-tax limit if not provided
      afterTax: 6000  // Default 2022 after-tax (Roth) limit if not provided
    };
  }
  
  return {
    preTax: Math.round(previousYearLimits.preTax * (1 + inflationRate)),
    afterTax: Math.round(previousYearLimits.afterTax * (1 + inflationRate))
  };
}

/**
 * Perform preliminary calculations for the current simulation year
 * @param {Object} params - Simulation parameters
 * @param {Object} previousYearData - Data from the previous year
 * @returns {Object} - Preliminary data for the current year
 */
function runPreliminaries(params, previousYearData) {
  // Extract necessary parameters
  const { inflationAssumption, taxData, year } = params;
  const { taxBrackets: previousYearTaxBrackets, contributionLimits: previousYearContributionLimits } = previousYearData || {};
  
  // Sample inflation rate for the current year
  const inflationRate = sampleInflationRate(inflationAssumption);
  
  // Compute inflation-adjusted tax brackets
  const federalIncomeTaxBrackets = computeInflationAdjustedTaxBrackets(
    previousYearData?.federalIncomeTaxBrackets || taxData?.federalIncomeTax, 
    inflationRate
  );
  
  const federalCapitalGainsTaxBrackets = computeInflationAdjustedTaxBrackets(
    previousYearData?.federalCapitalGainsTaxBrackets || taxData?.federalCapitalGainsTax, 
    inflationRate
  );
  
  const stateTaxBrackets = computeInflationAdjustedTaxBrackets(
    previousYearData?.stateTaxBrackets || taxData?.stateTax, 
    inflationRate
  );
  
  // Compute inflation-adjusted contribution limits
  const contributionLimits = computeInflationAdjustedContributionLimits(
    previousYearContributionLimits || taxData?.contributionLimits, 
    inflationRate
  );
  
  // Standard deduction adjustment
  const standardDeduction = previousYearData?.standardDeduction 
    ? previousYearData.standardDeduction * (1 + inflationRate)
    : (taxData?.standardDeduction || 12950) * (1 + inflationRate); // Default to 2022 standard deduction
  
  return {
    year,
    inflationRate,
    federalIncomeTaxBrackets,
    federalCapitalGainsTaxBrackets,
    stateTaxBrackets,
    contributionLimits,
    standardDeduction
  };
}

module.exports = {
  runPreliminaries,
  sampleInflationRate,
  computeInflationAdjustedTaxBrackets,
  computeInflationAdjustedContributionLimits
}; 