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
 * @param {Array} rothConversionStrategies - List of investment names to consider for conversion
 * @param {Object} adjustedIncomeTaxBrackets - Inflation-adjusted federal income tax brackets
 * @param {Number} adjustedStandardDeduction - Inflation-adjusted standard deduction
 * @param {Number} curYearIncome - Current year's income
 * @param {Number} curYearSS - Current year's Social Security income
 * @param {Array} investments - Array of investment objects
 * @param {Number} currentYear - The current year being simulated
 * @param {Boolean} rothOptimizerEnable - Whether Roth optimization is enabled
 * @param {Number} rothOptimizerStartYear - Year to start optimizing Roth conversions
 * @param {Number} rothOptimizerEndYear - Year to end optimizing Roth conversions
 * @returns {Object} - Result object with updated investments and income
 */
function processRothConversion(
  rothConversionStrategies,
  adjustedIncomeTaxBrackets,
  adjustedStandardDeduction,
  curYearIncome,
  curYearSS,
  investments,
  currentYear,
  rothOptimizerEnable,
  rothOptimizerStartYear,
  rothOptimizerEndYear
) {
  // Check if Roth conversion should be performed this year
  if (!rothConversionStrategies || rothConversionStrategies.length === 0) {
    return { investments, curYearIncome, conversionAmount: 0 };
  }

  // Skip if Roth optimizer is enabled but outside the specified year range
  if (rothOptimizerEnable && 
      (currentYear < rothOptimizerStartYear || currentYear > rothOptimizerEndYear)) {
    return { investments, curYearIncome, conversionAmount: 0 };
  }

  // a. Calculate federal taxable income (with partial SS taxation)
  const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;
  //console.log(`Roth Conv Year ${currentYear}: curYearFedTaxableIncome=${curYearFedTaxableIncome.toFixed(2)}`);
  
  // Find the user's current tax bracket
  let currentBracket = null;
  let upperLimit = 0;

  // Ensure brackets are provided and sorted by minimum income
  if (!adjustedIncomeTaxBrackets || adjustedIncomeTaxBrackets.length === 0) {
    console.error(`Roth Conversion Error Year ${currentYear}: No adjusted income tax brackets provided.`);
    return { investments, curYearIncome, conversionAmount: 0 };
  }
  const sortedBrackets = [...adjustedIncomeTaxBrackets].sort((a, b) => a.adjustedMinIncome - b.adjustedMinIncome);
  
  // Find the bracket the user is in
  for (let i = 0; i < sortedBrackets.length; i++) {
    const bracket = sortedBrackets[i];
    // Check if income is within the current bracket's range
    if (curYearFedTaxableIncome >= bracket.adjustedMinIncome && curYearFedTaxableIncome < bracket.adjustedMaxIncome) {
      currentBracket = bracket;
      upperLimit = bracket.adjustedMaxIncome; // The upper limit of the *current* bracket
      break; // Found the bracket
    }
    // Handle the case where income is in the highest bracket (>= min of last bracket)
    if (i === sortedBrackets.length - 1 && curYearFedTaxableIncome >= bracket.adjustedMinIncome) {
        currentBracket = bracket;
        upperLimit = bracket.adjustedMaxIncome; // This will be Infinity for the top bracket
        break;
    }
  }

  // If no bracket found (should not happen if income >= 0 and brackets cover all ranges)
  if (!currentBracket) {
    console.error(`Roth Conversion Error Year ${currentYear}: Unable to determine tax bracket for income ${curYearFedTaxableIncome.toFixed(2)} using provided brackets:`, sortedBrackets);
    return { investments, curYearIncome, conversionAmount: 0 };
  }

  //console.log(`Roth Conv Year ${currentYear}: Current Tax Bracket Rate=${currentBracket.rate} (Range: ${currentBracket.adjustedMinIncome.toFixed(2)} - ${upperLimit < Infinity ? upperLimit.toFixed(2) : 'Infinity'})`);

  // b. Calculate amount of Roth conversion to fill the current bracket
  const conversionRoomInBracket = upperLimit - curYearFedTaxableIncome;
  const rc = Math.max(0, conversionRoomInBracket);
  //console.log(`Roth Conv Year ${currentYear}: Calculated initial Roth conversion amount (rc) = ${rc.toFixed(2)} (Room in bracket: ${conversionRoomInBracket.toFixed(2)})`);
  
  if (rc <= 0) {
    console.log(`Roth Conv Year ${currentYear}: Skipping conversion as calculated amount is zero or less.`);
    return { investments, curYearIncome, conversionAmount: 0 };
  }

  // c. Iterate over investments in the Roth conversion strategy
  let remainingConversion = rc;
  const updatedInvestments = [...investments];
  
  // Find investments to convert
  for (const investmentName of rothConversionStrategies) {
    if (remainingConversion <= 0) break;
    
    // Find the investment in the array
    const index = updatedInvestments.findIndex(
      inv => inv.name === investmentName && inv.accountTaxStatus === 'pre-tax'
    );
    
    if (index === -1) continue; // Investment not found or not pre-tax
    
    const investment = updatedInvestments[index];
    
    // Calculate amount to convert from this investment
    const conversionFromThis = Math.min(remainingConversion, investment.value);
    
    if (conversionFromThis <= 0) continue;
    
    // Reduce value of pre-tax investment
    updatedInvestments[index].value -= conversionFromThis;
    
    // Find or create corresponding after-tax investment
    let afterTaxIndex = updatedInvestments.findIndex(
      inv => inv.name === investmentName + ' (Roth)' && 
             inv.accountTaxStatus === 'after-tax' &&
             inv.investmentType._id === investment.investmentType._id
    );
    
    if (afterTaxIndex === -1) {
      // Create new after-tax investment with same properties
      const newRothInvestment = {
        ...JSON.parse(JSON.stringify(investment)),
        name: investmentName + ' (Roth)',
        accountTaxStatus: 'after-tax',
        value: 0
      };
      
      updatedInvestments.push(newRothInvestment);
      afterTaxIndex = updatedInvestments.length - 1;
    }
    
    // Add value to after-tax investment
    updatedInvestments[afterTaxIndex].value += conversionFromThis;
    
    // Update remaining conversion amount
    remainingConversion -= conversionFromThis;
    
    //console.log(`Roth Conv Year ${currentYear}: Converted ${conversionFromThis.toFixed(2)} from '${investmentName}' to Roth. Remaining rc: ${remainingConversion.toFixed(2)}`);
  }

  // d. Update income to reflect the conversion
  const actualConversion = rc - remainingConversion;
  const updatedIncome = curYearIncome + actualConversion;
  
  return {
    investments: updatedInvestments,
    curYearIncome: updatedIncome,
    conversionAmount: actualConversion
  };
}

module.exports = {
  processRothConversion
};
