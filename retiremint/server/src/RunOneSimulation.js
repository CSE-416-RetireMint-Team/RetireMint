/**
 * Runs a single simulation trial.
 * Calculates its own numYears based on life expectancy data.
 * For now, it returns a hardcoded array representing yearly net worth and failure status.
 * 
 * @param {Object} modelData - The fetched model data (scenario, tax info, etc.).
 * @param {Number} simulationIndex - The index of this specific simulation run.
 * @returns {Array<Array<Number|Boolean>>} - An array where each element is [netWorth, failedStatus] for a year.
 */

// Helper function to sample from a normal distribution using Box-Muller transform
function sampleNormal(mean, stdDev) {
  let u1 = 0, u2 = 0;
  // Convert [0,1) to (0,1)
  while(u1 === 0) u1 = Math.random();
  while(u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean; // Allow negative values
}

// Helper function to sample from a uniform distribution
function sampleUniform(min, max) {
  return Math.random() * (max - min) + min;
}

// --- Event Timing Calculation Helper ---
function getOrCalculateEventTiming(eventName, events, currentYear, eventTimingsCache, processing = new Set()) {
    if (eventTimingsCache.has(eventName)) {
        return eventTimingsCache.get(eventName);
    }

    if (processing.has(eventName)) {
        throw new Error(`Circular dependency detected involving event: ${eventName}`);
    }

    const event = events.find(e => e.name === eventName);
    if (!event) {
        throw new Error(`Referenced event not found: ${eventName}`);
    }

    processing.add(eventName);

    let startYear = currentYear; // Default
    let duration = 1; // Default

    // --- Calculate Start Year --- 
    if (event.startYear) {
        if (event.startYear.fixedValue) {
            startYear = event.startYear.fixedValue;
        } else if (event.startYear.normalValue) {
            const mean = event.startYear.normalValue.mean || currentYear + 1; // Sensible default
            const sd = event.startYear.normalValue.sd || 1;
            startYear = Math.max(currentYear, Math.round(sampleNormal(mean, sd))); // Ensure >= currentYear
        } else if (event.startYear.uniformValue) {
            const min = event.startYear.uniformValue.lowerBound || currentYear + 1;
            const max = event.startYear.uniformValue.upperBound || currentYear + 5;
            startYear = Math.max(currentYear, Math.round(sampleUniform(min, max))); // Ensure >= currentYear
        } else if (event.startYear.sameYearAsAnotherEvent) {
            const refEventName = event.startYear.sameYearAsAnotherEvent;
            try {
                const refTiming = getOrCalculateEventTiming(refEventName, events, currentYear, eventTimingsCache, processing);
                startYear = refTiming.startYear;
            } catch (error) {
                console.error(`Error calculating start year for ${eventName} based on ${refEventName}: ${error.message}`);
                // Decide on fallback behavior - use default or re-throw?
                throw error; // Re-throw for now to indicate failure
            }
        } else if (event.startYear.yearAfterAnotherEventEnd) {
            const refEventName = event.startYear.yearAfterAnotherEventEnd;
             try {
                const refTiming = getOrCalculateEventTiming(refEventName, events, currentYear, eventTimingsCache, processing);
                startYear = refTiming.startYear + refTiming.duration;
            } catch (error) {
                console.error(`Error calculating start year for ${eventName} based on end of ${refEventName}: ${error.message}`);
                throw error; // Re-throw 
            }
        }
    }
    // Ensure startYear is at least the current year
    startYear = Math.max(currentYear, startYear);

    // --- Calculate Duration --- (Should be independent of start year calculation)
    if (event.duration) {
        if (event.duration.fixedValue) {
            duration = event.duration.fixedValue;
        } else if (event.duration.normalValue) {
            const mean = event.duration.normalValue.mean || 1;
            const sd = event.duration.normalValue.sd || 0.5;
            duration = Math.max(1, Math.round(sampleNormal(mean, sd)));
        } else if (event.duration.uniformValue) {
            const min = event.duration.uniformValue.lowerBound || 1;
            const max = event.duration.uniformValue.upperBound || 5;
            duration = Math.max(1, Math.round(sampleUniform(min, max)));
        }
    }
    duration = Math.max(1, duration); // Ensure duration is at least 1

    const timing = { startYear, duration };
    eventTimingsCache.set(eventName, timing);
    processing.delete(eventName); // Remove from processing set after successful calculation

    return timing;
}
// --- End Event Timing Helper ---

function runOneSimulation(modelData, simulationIndex) {
    const currentYear = new Date().getFullYear();
    let numYears = 30; // Default
    let initialMaritalStatus = 'single';
    let userTargetAge = 0; 
    let spouseTargetAge = Infinity; // Default to infinite if single or missing data

    try {
        const scenario = modelData.scenario;
        if (!scenario || !scenario.birthYear || !scenario.lifeExpectancy) {
            throw new Error("Scenario, birthYear, or lifeExpectancy missing");
        }
        if (!scenario.simulationSettings || !scenario.simulationSettings.inflationAssumption) {
            throw new Error("inflationAssumption missing");
        }

        initialMaritalStatus = scenario.scenarioType === 'married' ? 'married' : 'single';
        const currentUserAge = currentYear - scenario.birthYear;

        // --- Calculate User Target Age ---
        if (scenario.lifeExpectancy.lifeExpectancyMethod === 'fixedValue') {
            userTargetAge = scenario.lifeExpectancy.fixedValue;
        } else if (scenario.lifeExpectancy.lifeExpectancyMethod === 'normalDistribution') {
            const mean = scenario.lifeExpectancy.normalDistribution?.mean;
            const stdDev = scenario.lifeExpectancy.normalDistribution?.standardDeviation;
            if (mean != null && stdDev != null) {
                userTargetAge = Math.round(sampleNormal(mean, stdDev));
            } else {
                console.warn(`Sim ${simulationIndex+1}: Missing mean/stdDev for user LE, using default age.`);
                userTargetAge = currentUserAge + 30; // Fallback
            }
        } else {
             userTargetAge = currentUserAge + 30; // Fallback for unknown method
        }
        userTargetAge = Math.max(currentUserAge + 1, userTargetAge); // Clamp: ensure at least 1 year sim
        numYears = Math.ceil(userTargetAge - currentUserAge); // Calculate simulation years

        // --- Calculate Spouse Target Age (only if married & data exists) ---
        if (initialMaritalStatus === 'married' && scenario.spouseBirthYear && scenario.spouseLifeExpectancy) {
            const currentSpouseAge = currentYear - scenario.spouseBirthYear;
            if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'fixedValue') {
                spouseTargetAge = scenario.spouseLifeExpectancy.fixedValue;
            } else if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'normalDistribution') {
                 const mean = scenario.spouseLifeExpectancy.normalDistribution?.mean;
                 const stdDev = scenario.spouseLifeExpectancy.normalDistribution?.standardDeviation;
                 if (mean != null && stdDev != null) {
                    spouseTargetAge = Math.round(sampleNormal(mean, stdDev));
                    console.log(`Simulation ${simulationIndex+1}: Spouse sampled target age: ${spouseTargetAge}`);
                 } else {
                    console.warn(`Sim ${simulationIndex+1}: Missing mean/stdDev for spouse LE, using default age.`);
                    spouseTargetAge = currentSpouseAge + 30; // Fallback
                 }
            } else {
                spouseTargetAge = currentSpouseAge + 30; // Fallback
            }
            spouseTargetAge = Math.max(currentSpouseAge + 1, spouseTargetAge); // Clamp: ensure at least 1 year sim
        } 
        // If single, or married but missing data, spouseTargetAge remains Infinity

    } catch (error) {
        console.error(`Simulation ${simulationIndex+1}: Error calculating ages/numYears:`, error);
        console.warn(`Simulation ${simulationIndex+1}: Defaulting simulation duration to 30 years.`);
        numYears = 30; // Fallback
        initialMaritalStatus = modelData.scenario?.scenarioType === 'married' ? 'married' : 'single';
        // Cannot reliably determine spouse age on error, assume they outlive primary user for this sim
        spouseTargetAge = Infinity; 
    }

    numYears = Math.max(1, numYears); // Final check: ensure at least 1 year

    // --- Determine Marital Status Array --- 
    let maritalStatusArray = Array(numYears).fill(initialMaritalStatus);

    if (initialMaritalStatus === 'married' && spouseTargetAge !== Infinity) {
        const currentSpouseAge = currentYear - modelData.scenario.spouseBirthYear; // Recalculate here safely
        // Index of the last year the spouse is alive in the simulation's timeframe
        const spouseLastYearIndex = Math.ceil(spouseTargetAge - currentSpouseAge) - 1; 
        
        // If spouse dies before the user within the simulation period
        if (spouseLastYearIndex < numYears - 1) { 
            // Start changing status from the year *after* the spouse's last year
            for (let i = spouseLastYearIndex + 1; i < numYears; i++) {
                if (i >= 0) { // Just in case index calculation is negative (shouldn't happen)
                    maritalStatusArray[i] = 'single';
                }
            }
             console.log(`Sim ${simulationIndex + 1}: Marital status changes to single in year ${currentYear + spouseLastYearIndex + 1} (index ${spouseLastYearIndex + 1}) due to spouse LE.`);
        }
    }

    //console.log(`Simulation ${simulationIndex + 1} - Marital Status Array:`, maritalStatusArray);
    console.log(`Running simulation #${simulationIndex + 1} for calculated ${numYears} years.`);

    //------------------------------------------------------------------------------------------------------
    // --- Calculate Inflation Array ---
    const inflationArray = [];
    const inflationSettings = modelData.scenario.simulationSettings.inflationAssumption;
    try {
        let cumulativeInflation = 0; // Track cumulative inflation
        
        switch (inflationSettings.method) {
            case 'fixedPercentage':
                const fixedRate = (inflationSettings.fixedPercentage ?? 2) / 100; // Default to 2% if null/undefined
                for (let i = 0; i < numYears; i++) {
                    cumulativeInflation += fixedRate;
                    inflationArray.push(cumulativeInflation);
                }
                break;
            case 'normalPercentage':
                const mean = (inflationSettings.normalPercentage?.mean ?? 4) / 100; // Default 4%
                const sd = (inflationSettings.normalPercentage?.sd ?? 3) / 100;     // Default 3%
                 if (sd < 0) throw new Error("Standard deviation for normal inflation cannot be negative.");
                for (let i = 0; i < numYears; i++) {
                    // Sample new inflation value and add to cumulative total
                    cumulativeInflation += sampleNormal(mean, sd);
                    inflationArray.push(cumulativeInflation);
                }
                break;
            case 'uniformPercentage':
                const lower = (inflationSettings.uniformPercentage?.lowerBound ?? 1) / 100; // Default 1%
                const upper = (inflationSettings.uniformPercentage?.upperBound ?? 5) / 100; // Default 5%
                if (lower > upper) throw new Error("Lower bound for uniform inflation cannot exceed upper bound.");
                for (let i = 0; i < numYears; i++) {
                    // Sample new inflation value and add to cumulative total
                    cumulativeInflation += sampleUniform(lower, upper);
                    inflationArray.push(cumulativeInflation);
                }
                break;
            default:
                console.warn(`Sim ${simulationIndex + 1}: Unknown inflation method '${inflationSettings.method}'. Defaulting to 2% fixed.`);
                const defaultRate = 0.02;
                 for (let i = 0; i < numYears; i++) {
                    cumulativeInflation += defaultRate;
                    inflationArray.push(cumulativeInflation);
                }
        }
    } catch (error) {
        console.error(`Sim ${simulationIndex + 1}: Error calculating inflation: ${error.message}. Defaulting to 2% fixed.`);
        const defaultRate = 0.02;
        inflationArray.length = 0; // Clear potentially partial array
        let cumulativeInflation = 0;
         for (let i = 0; i < numYears; i++) {
            cumulativeInflation += defaultRate;
            inflationArray.push(cumulativeInflation);
        }
    }
    // --- End Inflation Calculation ---
    //console.log("inflationArray", inflationArray);

    //------------------------------------------------------------------------------------------------------

    // --- Calculate Event Timings ---
    const eventsByYear = Array(numYears).fill().map(() => []);
    const events = modelData.scenario.events;
    const eventTimingsCache = new Map(); // Cache for memoization

    try {
        // Process each event to determine when it occurs using the helper function
        events.forEach(event => {
            const timing = getOrCalculateEventTiming(event.name, events, currentYear, eventTimingsCache);
            const startYear = timing.startYear;
            const duration = timing.duration;
            
            // Map event to simulation years based on calculated timing
            const startIndex = startYear - currentYear;
            const endIndex = startIndex + duration;
            
            // Add event to eventsByYear for each year it occurs, if within simulation boundaries
            for (let i = startIndex; i < endIndex && i < numYears; i++) {
                if (i >= 0) { // Ensure index is non-negative 
                    eventsByYear[i].push(event.name);
                }
            }
        });
    } catch (error) {
        console.error(`Simulation ${simulationIndex + 1}: Failed to calculate event timings: ${error.message}`);
        // Handle the error appropriately - maybe stop the simulation or proceed with no events?
        // For now, just log and potentially clear eventsByYear if calculation failed mid-way
        for(let i=0; i<eventsByYear.length; i++) { eventsByYear[i] = []; } // Clear partially filled events
    }
    
    // Print events by year in a simple format (optional debugging)

    /*
    let printYear = currentYear;
    for (let i = 0; i < eventsByYear.length; i++) {
        console.log("printing " + printYear + ": " + (eventsByYear[i].length > 0 ? eventsByYear[i].join(', ') : 'No Events') + "\n");
        printYear++;
    }
    */

    //------------------------------------------------------------------------------------------------------
    // --- Calculate Investment Strategies Array ---
    const investArray = Array(numYears).fill().map(() => []);
    const allEventObjects = modelData.scenario.events; // Keep a reference to full event objects


    // Helper to format the raw strategy object into the layered array structure
    function formatLayeredAllocation(allocationName, strategyObject) {
        const formatted = [[allocationName, -1]];
        if (!strategyObject) return formatted; // Handle empty strategy

        // Sort layer names for consistent output (optional)
        const layerNames = Object.keys(strategyObject).sort();

        layerNames.forEach(layerName => {
            if (Object.prototype.hasOwnProperty.call(strategyObject, layerName)) {
                const layerData = strategyObject[layerName];
                const layerItems = [];
                if (layerData && typeof layerData === 'object') {
                    // Exclude mongoose internal fields explicitly and filter out non-numeric values
                    const validKeys = Object.keys(layerData)
                                       .filter(key => key !== '_id' && key !== '__v' && typeof layerData[key] === 'number');

                    // Sort item keys alphabetically for consistent output order (optional)
                    validKeys.sort(); 
                    
                    validKeys.forEach(itemName => {
                        layerItems.push([itemName, layerData[itemName]]);
                    });
                }
                 if (layerItems.length > 0) { // Only add layer if it has items
                     formatted.push([layerName, layerItems]);
                 }
            }
        });
        return formatted;
    }

    // Helper to parse the layered array structure back into a strategy object
    function parseLayeredAllocation(layeredArray) {
        const strategyObject = {};
        if (!layeredArray || layeredArray.length < 1) return strategyObject;

        for (let i = 1; i < layeredArray.length; i++) { // Start from index 1 to skip [allocationName, -1]
            const layer = layeredArray[i];
            if (layer && layer.length === 2 && typeof layer[0] === 'string' && Array.isArray(layer[1])) {
                const layerName = layer[0];
                const items = layer[1];
                const layerMap = {};
                items.forEach(item => {
                    if (item && item.length === 2 && typeof item[0] === 'string' && typeof item[1] === 'number') {
                        layerMap[item[0]] = item[1];
                    }
                });
                 if (Object.keys(layerMap).length > 0) { // Only add layer if it has items
                    strategyObject[layerName] = layerMap;
                 }
            }
        }
        return strategyObject;
    }

    // NOTE: getInitialAllocationMap returns a FLAT map, which doesn't fit the layered structure directly.
    // This initial state needs careful handling, especially for the first glide path event.
    // const initialAllocationMap = getInitialAllocationMap(modelData.scenario.investments || []);

    for (let i = 0; i < numYears; i++) {
        if (investArray[i].length > 0) continue; // Already processed by a glide path

        const eventsThisYear = eventsByYear[i];
        let investEventName = null;
        for (let j = eventsThisYear.length - 1; j >= 0; j--) {
            const eventName = eventsThisYear[j];
            const eventData = allEventObjects.find(e => e.name === eventName);
            if (eventData && eventData.type === 'invest') {
                investEventName = eventName;
                break;
            }
        }

        if (investEventName) {
            const eventData = allEventObjects.find(e => e.name === investEventName);
            if (!eventData || !eventData.invest || !eventData.invest.allocations || !eventData.invest.investmentStrategy) {
                 console.error(`Simulation ${simulationIndex + 1}: Invest event '${investEventName}' data is incomplete. Skipping year ${currentYear + i}.`);
                 continue;
            }

            const allocationMethod = eventData.invest.allocations.method;
            const targetStrategyObject = eventData.invest.investmentStrategy; // The target structure

            if (allocationMethod === 'fixedAllocation') {
                // Format the raw strategy object directly
                investArray[i] = formatLayeredAllocation(eventData.name, targetStrategyObject);

            } else if (allocationMethod === 'glidePath') {
                // 1. Determine Glide Duration
                let glideDuration = 0;
                for (let k = i; k < numYears; k++) {
                    if (eventsByYear[k].includes(investEventName)) {
                        glideDuration++;
                    } else {
                        break;
                    }
                }
                if (glideDuration === 0) continue;

                // 2. Find Start Allocation Object
                let startStrategyObject = null;
                let previousStateIndex = -1;
                if (i > 0) {
                    for (let prev_i = i - 1; prev_i >= 0; prev_i--) {
                        if (investArray[prev_i].length > 0) {
                            startStrategyObject = parseLayeredAllocation(investArray[prev_i]);
                            previousStateIndex = prev_i;
                            break;
                        }
                    }
                }

                // 3. Interpolate and Fill investArray
                let effectiveStartObject = startStrategyObject;
                let glideStartIndex = 0;

                if (!startStrategyObject) {
                    // Handle the case where this is the first invest event or no prior state found
                    // Set the first year to the target, and glide from target for the remaining duration
                    console.warn(`Simulation ${simulationIndex + 1}: Glide path '${investEventName}' starting at year ${currentYear + i} has no defined previous state. Setting first year to target.`);
                    investArray[i] = formatLayeredAllocation(eventData.name, targetStrategyObject);
                    effectiveStartObject = targetStrategyObject; // Glide from target for the rest
                    glideStartIndex = 1; // Start interpolation from the second year
                }

                // Combine all layer names and item names from start and target
                const allLayerNames = new Set([...Object.keys(effectiveStartObject || {}), ...Object.keys(targetStrategyObject)]);
                const allItemNamesByLayer = {};

                allLayerNames.forEach(layerName => {
                    allItemNamesByLayer[layerName] = new Set([
                        ...Object.keys((effectiveStartObject || {})[layerName] || {}),
                        ...Object.keys(targetStrategyObject[layerName] || {})
                    ]);
                });

                for (let j = glideStartIndex; j < glideDuration; j++) {
                    const currentYearIndex = i + j;
                    if (currentYearIndex >= numYears) break; // Boundary check

                    // Interpolation factor: t goes from a small value towards 1 over the remaining duration
                    // For j=glideStartIndex=1, t = 1 / (glideDuration - glideStartIndex + 1) ? No, simpler.
                    // If j=1 (second year), t = 1 / (duration -1) ? Needs care if duration = 1.
                    // Let t represent the fraction of the way *through* the glide (excluding the first year if handled separately)
                    const remainingDuration = glideDuration - glideStartIndex;
                    const t = remainingDuration <= 0 ? 1 : (j - glideStartIndex + 1) / remainingDuration;

                    const interpolatedStrategyObject = {};

                    allLayerNames.forEach(layerName => {
                        interpolatedStrategyObject[layerName] = {};
                        const startLayer = (effectiveStartObject || {})[layerName] || {};
                        const targetLayer = targetStrategyObject[layerName] || {};

                        allItemNamesByLayer[layerName].forEach(itemName => {
                            const startPercent = startLayer[itemName] || 0;
                            const targetPercent = targetLayer[itemName] || 0;
                            const interpolatedPercent = startPercent + (targetPercent - startPercent) * t;
                            // Store even if zero during interpolation, formatLayered will filter later
                            interpolatedStrategyObject[layerName][itemName] = interpolatedPercent;
                        });
                    });

                    investArray[currentYearIndex] = formatLayeredAllocation(eventData.name, interpolatedStrategyObject);
                }

                // 4. Advance Outer Loop
                i += glideDuration - 1;
            }
        }
    }
    //console.log(`Sim ${simulationIndex + 1} - Final Invest Array:`, JSON.stringify(investArray));

    //------------------------------------------------------------------------------------------------------
    // determine investment strategy
    
    // --- Placeholder for Yearly Simulation Loop ---
    const yearlyResults = []; 
    const scenario = modelData.scenario; // Get scenario for financial goal
    //console.log("scenario financial goal", scenario.financialGoal);
    const financialGoal = scenario?.financialGoal ?? 0; // Default to 0 if not found
    const hardcodedNetWorth = 2000000; // Hardcoded value for now

    for (let i = 0; i < numYears; i++) {
        // TODO: Implement actual year simulation logic using:
        // - modelData (scenario, taxData)
        // - simulationIndex
        // - currentYear + i (the actual year being simulated)
        // - maritalStatusArray[i] (marital status for this year)
        // - inflationArray[i] (inflation rate for this year)
        // - previous year's state (investments, income, etc.)
        
        const meetingFinancialGoal = hardcodedNetWorth > financialGoal;

        yearlyResults.push({ 
            netWorth: hardcodedNetWorth,
            meetingFinancialGoal: meetingFinancialGoal
        }); 
    }
    // --- End Placeholder ---

    // Return ONLY the yearlyResults array
    return yearlyResults;
}

module.exports = {
    runOneSimulation
};
