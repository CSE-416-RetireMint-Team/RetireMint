/**
 * IncomeEvents.js - Module for processing income events in the simulation
 * 
 * This module handles:
 * 1. Calculating the uninflated base income amount for the current year based on the previous year's base and expected annual changes.
 * 2. Adjusting the current base amount for inflation if applicable.
 * 3. Adjusting for marital status.
 * 4. Returning the calculated income totals (cash added, taxable income, SS income) and the *uninflated* base amounts for the next year's calculation.
 */

const { sampleNormal, sampleUniform, calculateCurrentBaseAmount } = require('../Utils/CalculationUtils');

/**
 * Run all active income events for the current simulation year.
 * @param {Object} modelData - Contains scenario, taxData, etc.
 * @param {Array<string>} eventsActiveThisYear - Array of active event names for the year.
 * @param {string} maritalStatusThisYear - 'single' or 'married'.
 * @param {number} currentInflationFactor - The cumulative inflation factor for the year (1.0 = base year).
 * @param {Object} previousIncomeEventStates - Map of event states from the previous year { eventName: { baseAmount: number } }.
 * @param {number} initialCash - Cash balance at the start of the year before income.
 * @param {Array} currentYearEventsLog - Array to push log entries into.
 * @param {number} currentYear - The current simulation year.
 * @returns {Object} - { cash: updatedCash, curYearIncome: totalTaxableIncome, curYearSS: totalSSIncome, incomeEventStates: stateForNextYear, incomeBreakdown: breakdownOfIncome }
 */
function runIncomeEvents(modelData, eventsActiveThisYear, maritalStatusThisYear, currentInflationFactor, previousIncomeEventStates = {}, initialCash = 0, currentYearEventsLog = [], currentYear) {

    let currentCash = initialCash;
    let curYearIncome = 0;
    let curYearSS = 0;
    let incomeBreakdown = {};

    if (!eventsActiveThisYear || eventsActiveThisYear.length === 0) {
        return { cash: currentCash, curYearIncome, curYearSS, incomeEventStates: {}, incomeBreakdown };
    }

    const allEvents = modelData.scenario.events;
    const inflationFactorToApply = currentInflationFactor;

    for (const eventName of eventsActiveThisYear) {
        const event = allEvents.find(e => e.name === eventName);

        if (!event || event.type !== 'income' || !event.income || event.income.initialAmount == null) {
            continue;
        }

        const incomeDetails = event.income;
        const previousState = previousIncomeEventStates[eventName] || null;
        const previousBaseAmount = previousState ? previousState.baseAmount : incomeDetails.initialAmount;

        const currentBaseAmount = calculateCurrentBaseAmount(incomeDetails.expectedAnnualChange, previousBaseAmount);

        let inflatedCurrentAmount;
        if (incomeDetails.inflationAdjustment) {
            inflatedCurrentAmount = currentBaseAmount * inflationFactorToApply;
        } else {
            inflatedCurrentAmount = currentBaseAmount;
        }

        if (maritalStatusThisYear === 'married') {
            const spousePercentage = (typeof incomeDetails.marriedPercentage === 'number' ? incomeDetails.marriedPercentage : 50);
        }

        currentCash += inflatedCurrentAmount;

        curYearIncome += inflatedCurrentAmount;

        if (incomeDetails.isSocialSecurity) {
            curYearSS += inflatedCurrentAmount;
        }

        incomeBreakdown[`Income - ${event.name}`] = (incomeBreakdown[`Income - ${event.name}`] || 0) + inflatedCurrentAmount;

        previousIncomeEventStates[eventName] = { baseAmount: currentBaseAmount };

        currentYearEventsLog.push({ 
            year: currentYear, 
            type: 'income', 
            details: `Received from '${event.name}': ${inflatedCurrentAmount.toFixed(2)}` 
        });
    }

    return {
        cash: currentCash,
        curYearIncome: curYearIncome,
        curYearSS: curYearSS,
        incomeEventStates: previousIncomeEventStates,
        incomeBreakdown,
    };
}

module.exports = {
  runIncomeEvents
}; 