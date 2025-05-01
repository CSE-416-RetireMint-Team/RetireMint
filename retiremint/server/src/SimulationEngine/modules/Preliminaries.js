/**
 * Helper to parse currency strings like "$1,234" or "1234" into numbers.
 * Handles "And up" or other non-numeric strings by returning Infinity.
 */
function parseCurrencyString(currencyStr) {
    if (typeof currencyStr !== 'string') return null;
    const numStr = currencyStr.replace(/[$,]/g, '');
    if (isNaN(numStr)) return Infinity;
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
}

/**
 * Calculates inflation-adjusted tax data for a given year.
 * 
 * @param {Object} taxData - The raw tax data from modelData.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentYear - The simulation year.
 * @param {number} currentYearIndex - The 0-based index of the simulation year.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year.
 * @param {string} userState - The user's state code (e.g., 'NY').
 * @returns {Object} - Contains adjustedStandardDeduction, adjustedIncomeTaxBrackets, 
 *                     adjustedStateTaxBrackets, adjustedCapitalGainsBrackets.
 */
function calculateAdjustedTaxData(taxData, maritalStatusThisYear, currentYear, currentYearIndex, currentInflationFactor, userState) {
    
    // --- Find Applicable Raw Tax Data (Ignoring Year, based on Status) ---
    let currentIncomeTaxBracketsRaw = null;
    let currentStandardDeductionRaw = 0;
    let currentCapitalGainsBracketsRaw = null;
    let userStateTaxDataRaw = null;

    // Income Tax Brackets
    if (taxData.incomeTax && taxData.incomeTax.length > 0) {
        const matchingBracketData = taxData.incomeTax.find(data => data.filingStatus === maritalStatusThisYear);
        if (matchingBracketData) {
            currentIncomeTaxBracketsRaw = matchingBracketData.brackets;
        } else {
            console.error(`Preliminaries Error: No income tax brackets found for filing status '${maritalStatusThisYear}'.`);
        }
    } else {
        console.error(`Preliminaries Error: taxData.incomeTax is missing or empty.`);
    }

    // Standard Deduction
    if (taxData.standardDeduction && taxData.standardDeduction.length > 0) {
        const matchingDeductionData = taxData.standardDeduction.find(data => data.filingStatus === maritalStatusThisYear);
        if (matchingDeductionData) {
            currentStandardDeductionRaw = matchingDeductionData.standardDeduction;
        } else {
            console.error(`Preliminaries Error: No standard deduction found for filing status '${maritalStatusThisYear}'.`);
        }
    } else {
        console.error(`Preliminaries Error: taxData.standardDeduction is missing or empty.`);
    }

    // Capital Gains Tax Brackets
    if (taxData.capitalGains && taxData.capitalGains.length > 0) {
        const matchingCapGainsData = taxData.capitalGains.find(data => data.filingStatus === maritalStatusThisYear);
        if (matchingCapGainsData && matchingCapGainsData.longTermCapitalGains) {
            currentCapitalGainsBracketsRaw = matchingCapGainsData.longTermCapitalGains;
        } else {
            console.error(`Preliminaries Error: No capital gains data or longTermCapitalGains array found for filing status '${maritalStatusThisYear}'.`);
        }
    } else {
        console.error(`Preliminaries Error: taxData.capitalGains is missing or empty.`);
    }

    // State Tax Data
    if (taxData.stateTaxes && taxData.stateTaxes.length > 0) {
        userStateTaxDataRaw = taxData.stateTaxes.find(state => state.stateCode === userState);
        if (!userStateTaxDataRaw) {
             console.warn(`Preliminaries Warn: State tax data not found for stateCode '${userState}'. State taxes will not be calculated.`);
        }
    } else {
        console.error(`Preliminaries Error: taxData.stateTaxes is missing or empty.`);
    }

    // --- Adjust Tax Thresholds for Inflation --- 
    // Apply inflation starting from the second year (index 1)
    const inflationFactorToApply = currentYearIndex === 0 ? 1.0 : currentInflationFactor;

    // Adjusted Standard Deduction
    const adjustedStandardDeduction = currentStandardDeductionRaw * inflationFactorToApply;
    // console.log(`Year ${currentYear} (Idx ${currentYearIndex}): Adjusted Standard Deduction = ${adjustedStandardDeduction}`); // LOG

    // Adjusted Federal Income Tax Brackets
    let adjustedIncomeTaxBrackets = null;
    if (currentIncomeTaxBracketsRaw) {
        adjustedIncomeTaxBrackets = currentIncomeTaxBracketsRaw.map(bracket => {
            const minIncomeNum = parseCurrencyString(bracket.minIncome);
            const maxIncomeNum = parseCurrencyString(bracket.maxIncome);
            return {
                rate: bracket.rate,
                adjustedMinIncome: minIncomeNum !== null ? minIncomeNum * inflationFactorToApply : 0,
                adjustedMaxIncome: maxIncomeNum !== null ? maxIncomeNum * inflationFactorToApply : Infinity
            };
        });
    }
    // console.log(`Year ${currentYear} (Idx ${currentYearIndex}): Adjusted Federal Brackets =`, adjustedIncomeTaxBrackets); // LOG

    // Adjusted State Income Tax Brackets
    let adjustedStateTaxBrackets = null;
    if (userStateTaxDataRaw && userStateTaxDataRaw.brackets) {
        const stateBracketsKey = maritalStatusThisYear === 'married' ? 'married' : 'single';
        const currentYearStateBrackets = userStateTaxDataRaw.brackets[stateBracketsKey];
        if (currentYearStateBrackets) {
            adjustedStateTaxBrackets = currentYearStateBrackets.map(bracket => {
                const minNum = Number(bracket.min) ?? 0;
                const maxNum = bracket.max === null ? Infinity : (Number(bracket.max) ?? Infinity);
                return {
                    rate: bracket.rate,
                    adjustedMin: minNum * inflationFactorToApply,
                    adjustedMax: maxNum === Infinity ? Infinity : maxNum * inflationFactorToApply
                };
            });
        } else {
            // Warning handled during raw data lookup
        }
    }
    // console.log(`Year ${currentYear} (Idx ${currentYearIndex}): Adjusted State Brackets (${maritalStatusThisYear}) =`, adjustedStateTaxBrackets); // LOG

    // Adjusted Capital Gains Tax Brackets
    let adjustedCapitalGainsBrackets = null;
    if (currentCapitalGainsBracketsRaw) {
        adjustedCapitalGainsBrackets = currentCapitalGainsBracketsRaw.map(bracket => {
            let minThresholdNum = 0;
            let maxThresholdNum = Infinity;
            if (typeof bracket.threshold === 'string') {
                const parts = bracket.threshold.split(/\s*–\s*/); // Split by ' – '
                if (parts.length > 0) {
                    minThresholdNum = parseCurrencyString(parts[0]) ?? 0;
                }
                if (parts.length > 1) {
                    maxThresholdNum = parseCurrencyString(parts[1]) ?? Infinity;
                }
            } else {
                console.warn(`Preliminaries Warn: Capital gains threshold is not a string:`, bracket.threshold);
            }
            return {
                rate: bracket.rate,
                adjustedMinThreshold: minThresholdNum * inflationFactorToApply,
                adjustedMaxThreshold: maxThresholdNum === Infinity ? Infinity : maxThresholdNum * inflationFactorToApply
            };
        });
    }
    // console.log(`Year ${currentYear} (Idx ${currentYearIndex}): Adjusted Capital Gains Brackets =`, adjustedCapitalGainsBrackets); // LOG
    
    // Return the calculated adjusted values
    return {
        adjustedStandardDeduction,
        adjustedIncomeTaxBrackets,
        adjustedStateTaxBrackets,
        adjustedCapitalGainsBrackets
    };
}

module.exports = {
    calculateAdjustedTaxData
};
