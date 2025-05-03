/**
 * TaxCalculators.js - Utility functions for calculating various taxes.
 */

/**
 * Calculates income tax based on progressive tax brackets.
 * Assumes taxableIncome is already calculated (Income - Deductions).
 * @param {number} taxableIncome - The income amount subject to tax.
 * @param {Array} brackets - Array of bracket objects { rate: string, adjustedMinIncome: number, adjustedMaxIncome: number }.
 * @returns {number} - Calculated income tax amount.
 */
function calculateIncomeTax(taxableIncome, brackets) {
    let tax = 0;
    let incomeToTax = Math.max(0, taxableIncome); // Work with non-negative income

    if (!brackets || brackets.length === 0) {
        console.warn("Tax Calculation Warning: No income tax brackets provided.");
        return 0;
    }

    // Determine bracket property names based on the first bracket
    const firstBracket = brackets[0];
    const minKey = firstBracket.hasOwnProperty('adjustedMinIncome') ? 'adjustedMinIncome' : 'adjustedMin';
    const maxKey = firstBracket.hasOwnProperty('adjustedMaxIncome') ? 'adjustedMaxIncome' : 'adjustedMax';

    // Ensure brackets are sorted by the determined min key
    const sortedBrackets = [...brackets].sort((a, b) => a[minKey] - b[minKey]);

    let lastBracketMax = 0;
    for (const bracket of sortedBrackets) {
        const bracketMin = bracket[minKey];
        const bracketMax = bracket[maxKey];
        // Handle both string ('10%') and numeric (0.04) rates
        const rate = typeof bracket.rate === 'string' 
            ? parseFloat(bracket.rate) / 100 
            : bracket.rate;

        // Amount of income that falls into this specific bracket range
        const incomeInThisBracketRange = Math.max(0, Math.min(incomeToTax, bracketMax) - Math.max(lastBracketMax, bracketMin));
        
        if (incomeInThisBracketRange > 0) {
            tax += incomeInThisBracketRange * rate;
        } else if (incomeToTax < bracketMin) {
            // Optimization: If remaining income is less than the current bracket's min, we're done.
            break; 
        }
        
        lastBracketMax = bracketMax;
        if (incomeToTax <= bracketMax) {
            // Optimization: If all income is taxed, break.
            break;
        }
    }
    
    return tax;
}

/**
 * Calculates long-term capital gains tax.
 * Uses federal taxable income (including gains) to determine the applicable rate bracket.
 * @param {number} netGains - Net capital gains for the year (must be > 0 for tax).
 * @param {number} taxableIncome - Federal taxable income (Regular Income - Deductions). Should NOT include netGains initially.
 * @param {Array} capGainsBrackets - Array of bracket objects { rate: string, adjustedMinThreshold: number, adjustedMaxThreshold: number }.
 * @returns {number} - Calculated capital gains tax amount (>= 0).
 */
function calculateCapitalGainsTax(netGains, taxableIncome, capGainsBrackets) {
    if (netGains <= 0) return 0; // No tax on losses or zero gains
    if (!capGainsBrackets || capGainsBrackets.length === 0) {
        console.warn("Tax Calculation Warning: No capital gains brackets provided.");
        return 0;
    }

    let gainsTax = 0;
    let gainsRemainingToTax = netGains;
    const baseTaxableIncome = Math.max(0, taxableIncome); // Regular taxable income

    // Ensure brackets are sorted by threshold
    const sortedBrackets = [...capGainsBrackets].sort((a, b) => a.adjustedMinThreshold - b.adjustedMinThreshold);

    for (const bracket of sortedBrackets) {
        if (gainsRemainingToTax <= 0) break;

        const bracketMinThreshold = bracket.adjustedMinThreshold;
        const bracketMaxThreshold = bracket.adjustedMaxThreshold;
        const rate = parseFloat(bracket.rate) / 100;

        // Calculate how much of the gains fall into this bracket's income threshold range
        // The 'taxable space' for gains in this bracket starts after regular income fills the lower part of the threshold
        const gainsBracketFloor = Math.max(bracketMinThreshold, baseTaxableIncome);
        const gainsBracketCeiling = bracketMaxThreshold;
        
        // Amount of gains actually taxed at this rate
        const taxableGainsInBracket = Math.min(
            gainsRemainingToTax, 
            Math.max(0, gainsBracketCeiling - gainsBracketFloor)
        );

        if (taxableGainsInBracket > 0) {
            gainsTax += taxableGainsInBracket * rate;
            gainsRemainingToTax -= taxableGainsInBracket;
        }
        
        // If the ceiling of this bracket is below the base income, no gains can be taxed here or higher.
        if (gainsBracketCeiling <= baseTaxableIncome) continue; 
    }

    return Math.max(0, gainsTax); // Ensure tax is not negative
}

module.exports = {
    calculateIncomeTax,
    calculateCapitalGainsTax
}; 