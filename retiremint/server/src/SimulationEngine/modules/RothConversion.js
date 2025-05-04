/**
 * RothConversion.js - Module for processing Roth conversions
 * 
 * This module handles:
 * 1. Calculating the optimal amount for Roth conversion based on tax brackets
 * 2. Converting pre-tax investments to after-tax (Roth) investments
 * 3. Updating taxable income to reflect conversions
 */

/**
 * Process Roth conversions for the current year
 * @param {Array} rothConversionSourceAccounts - List of investment names to consider for conversion
 * @param {Object} adjustedIncomeTaxBrackets - Inflation-adjusted federal income tax brackets
 * @param {Number} adjustedStandardDeduction - Inflation-adjusted standard deduction
 * @param {Number} curYearIncome - Current year's income
 * @param {Number} curYearSS - Current year's Social Security income
 * @param {Array} investments - Array of investment objects
 * @param {Number} currentYear - The current year being simulated
 * @param {Boolean} rothOptimizerEnable - Whether Roth optimization is enabled
 * @param {Number} rothOptimizerStartYear - Year to start optimizing Roth conversions
 * @param {Number} rothOptimizerEndYear - Year to end optimizing Roth conversions
 * @returns {Object} - An object containing the updated investments array, the updated taxable income, and the amount converted.
 *                     { investments: Array, curYearIncome: Number, conversionAmount: Number }
 */
function processRothConversion(
  rothConversionSourceAccounts,
  adjustedIncomeTaxBrackets,
  adjustedStandardDeduction,
  curYearIncome,
  curYearSS,
  investments,
  currentYear,
  rothOptimizerEnable = false,
  rothOptimizerStartYear = null,
  rothOptimizerEndYear = null
) {
  let totalAmountConverted = 0;
  let updatedInvestments = JSON.parse(JSON.stringify(investments)); // Deep clone
  let updatedTaxableIncome = curYearIncome;

  if (!rothConversionSourceAccounts || rothConversionSourceAccounts.length === 0) {
    return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
  }
  
  // --- Check if optimizer is active AND if current year is outside its window ---
  if (rothOptimizerEnable) {
    const isOptimizerActiveYear = 
      (!rothOptimizerStartYear || currentYear >= rothOptimizerStartYear) && 
      (!rothOptimizerEndYear || currentYear <= rothOptimizerEndYear);
      
    if (!isOptimizerActiveYear) {
      // Optimizer is enabled, but we are outside the active years, so do nothing.
      // console.log(`Year ${currentYear}: Skipping Roth conversion (Optimizer enabled but outside active window [${rothOptimizerStartYear}-${rothOptimizerEndYear}])`);
      return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
    }
    // If we are here, optimizer is enabled AND it's an active year.
  } else {
    // Optimizer is not enabled, skip conversion
    // console.log(`Year ${currentYear}: Skipping Roth conversion (Optimizer not enabled).`);
    return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
  }
  // --- If optimizer is enabled and within the active year window, proceed ---
  
  // --- Calculate Target Conversion Amount (rc) based on filling current tax bracket --- 
  
  // a. Calculate federal taxable income before conversion (considering SS taxation and standard deduction)
  const curYearFedTaxableIncomeBeforeConv = curYearIncome - 0.15 * curYearSS; 
  const netTaxableIncomeBeforeConv = Math.max(0, curYearFedTaxableIncomeBeforeConv - adjustedStandardDeduction);
  
  // Find the user's current tax bracket upper limit (u)
  let upperLimit = 0;
  if (!adjustedIncomeTaxBrackets || adjustedIncomeTaxBrackets.length === 0) {
    console.error(`Roth Conversion Error Year ${currentYear}: No adjusted income tax brackets provided.`);
    return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
  }
  const sortedBrackets = [...adjustedIncomeTaxBrackets].sort((a, b) => a.adjustedMinIncome - b.adjustedMinIncome);
  
  let foundBracket = false;
  for (let i = 0; i < sortedBrackets.length; i++) {
    const bracket = sortedBrackets[i];
    if (netTaxableIncomeBeforeConv >= bracket.adjustedMinIncome && netTaxableIncomeBeforeConv < bracket.adjustedMaxIncome) {
      upperLimit = bracket.adjustedMaxIncome; 
      foundBracket = true;
      break; 
    }
    if (i === sortedBrackets.length - 1 && netTaxableIncomeBeforeConv >= bracket.adjustedMinIncome) {
      upperLimit = bracket.adjustedMaxIncome; // Infinity for the top bracket
      foundBracket = true;
      break;
    }
  }
  
  if (!foundBracket) {
    console.error(`Roth Conversion Error Year ${currentYear}: Unable to determine tax bracket for net income ${netTaxableIncomeBeforeConv.toFixed(2)}`);
    return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
  }

  // b. Calculate amount of Roth conversion (rc) needed to fill the bracket
  // rc = u - netTaxableIncomeBeforeConv
  let targetConversionAmount = 0;
  if (upperLimit === Infinity) { 
    // If in the highest bracket, maybe convert a fixed amount or based on another rule?
    // For now, assume no conversion if already in the highest bracket.
    // console.log(`Year ${currentYear}: Skipping Roth conversion (already in highest bracket).`);
    targetConversionAmount = 0;
  } else {
    targetConversionAmount = Math.max(0, upperLimit - netTaxableIncomeBeforeConv);
  }
  
  // console.log(`Year ${currentYear}: Roth Optimizer - Net Income Before: ${netTaxableIncomeBeforeConv.toFixed(2)}, Bracket Upper Limit: ${upperLimit === Infinity ? 'Inf' : upperLimit.toFixed(2)}, Target Conversion (rc): ${targetConversionAmount.toFixed(2)}`);
  
  if (targetConversionAmount <= 0.01) { // Use threshold for floating point
    // console.log(`Year ${currentYear}: Skipping Roth conversion (target amount is zero or negligible).`);
    return { investments: updatedInvestments, curYearIncome: updatedTaxableIncome, conversionAmount: 0 };
  }

  // --- c. Iterate over source accounts and perform conversion --- 
  let amountRemainingToConvert = targetConversionAmount;

  for (const sourceAccountName of rothConversionSourceAccounts) {
    if (amountRemainingToConvert <= 0.01) break; // Target met

    // Find the source pre-tax investment account
    const sourceAccountIndex = updatedInvestments.findIndex(inv => 
      inv.name === sourceAccountName && 
      inv.taxStatus === 'pre-tax'
    );

    if (sourceAccountIndex === -1) {
      // console.log(`Year ${currentYear}: Roth source account '${sourceAccountName}' not found or not pre-tax.`);
      continue; // Try next source account
    }
    
    const sourceAccount = updatedInvestments[sourceAccountIndex];
    if (sourceAccount.value <= 0) {
      // console.log(`Year ${currentYear}: Roth source account '${sourceAccountName}' has zero value.`);
      continue; // Try next source account
    }

    // Determine amount to convert from this specific source
    const amountToConvertFromThisSource = Math.min(amountRemainingToConvert, sourceAccount.value);

    // Determine target account name and find/create it
    const targetAccountName = `${sourceAccount.name} (Roth)`;
    let targetAccountIndex = updatedInvestments.findIndex(inv => 
      inv.name === targetAccountName && 
      inv.taxStatus === 'tax-exempt' // Using 'tax-exempt' for Roth based on InvestmentReturns logic
    );

    if (targetAccountIndex === -1) {
      // Create the target Roth account if it doesn't exist
      // console.log(`Year ${currentYear}: Creating target Roth account '${targetAccountName}' for conversion.`);
      const newRothInvestment = {
        ...JSON.parse(JSON.stringify(sourceAccount)), // Base structure on source
        name: targetAccountName,
        taxStatus: 'tax-exempt', 
        value: 0, // Start with zero value
        costBasis: 0, // Initial cost basis is 0
        _id: `temp-roth-${sourceAccountName}-${Date.now()}` // Generate a unique-ish temp ID
      };
       // Remove fields that shouldn't be copied or are set above
      delete newRothInvestment.maxAnnualContribution; // Roth limits handled differently
      // Add other fields specific to Roth if needed by schemas
      
      updatedInvestments.push(newRothInvestment);
      targetAccountIndex = updatedInvestments.length - 1; 
    }
    
    const targetAccount = updatedInvestments[targetAccountIndex];

    // Perform the transfer
    sourceAccount.value -= amountToConvertFromThisSource;
    targetAccount.value += amountToConvertFromThisSource;
    targetAccount.costBasis = (targetAccount.costBasis || 0) + amountToConvertFromThisSource;

    // Update tracking variables
    totalAmountConverted += amountToConvertFromThisSource;
    amountRemainingToConvert -= amountToConvertFromThisSource;
    
    // console.log(`Year ${currentYear}: Converted ${amountToConvertFromThisSource.toFixed(2)} from '${sourceAccountName}' to '${targetAccountName}'. Total converted: ${totalAmountConverted.toFixed(2)}. Remaining target: ${amountRemainingToConvert.toFixed(2)}`);
  }
  
  // --- d. Update overall taxable income --- 
  updatedTaxableIncome += totalAmountConverted;

  return { 
    investments: updatedInvestments, 
    curYearIncome: updatedTaxableIncome, 
    conversionAmount: totalAmountConverted 
  };
}

module.exports = {
  processRothConversion
};
