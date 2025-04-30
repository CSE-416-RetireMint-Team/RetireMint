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
    //console.log(`[Timing Calc] Enter: Calculating timing for "${eventName}"...`); // LOG: Function entry

    if (eventTimingsCache.has(eventName)) {
        const cachedTiming = eventTimingsCache.get(eventName);
        //console.log(`[Timing Calc] Cache Hit: Found timing for "${eventName}":`, cachedTiming); // LOG: Cache hit
        return cachedTiming;
    }
    //console.log(`[Timing Calc] Cache Miss: No cached timing for "${eventName}".`); // LOG: Cache miss

    if (processing.has(eventName)) {
        console.error(`[Timing Calc] Error: Circular dependency detected involving event: ${eventName}`); // Use console.error for actual errors
        throw new Error(`Circular dependency detected involving event: ${eventName}`);
    }

    const event = events.find(e => e.name === eventName);
    if (!event) {
        console.error(`[Timing Calc] Error: Referenced event not found: ${eventName}`); // Use console.error
        throw new Error(`Referenced event not found: ${eventName}`);
    }

    //console.log(`[Timing Calc] Processing: Adding "${eventName}" to processing set.`); // LOG: Add to processing
    processing.add(eventName);

    let startYear = currentYear; // Default
    let duration = 1; // Default
    // --- Calculate Start Year ---
    if (event.startYear && event.startYear.method) { // Check if startYear and method exist
        const method = event.startYear.method;
        //console.log(`[Timing Calc] Start Year Method for "${eventName}": ${method}`); // LOG: Start year method

        switch (method) {
            case 'fixedValue':
                if (event.startYear.fixedValue != null) {
                     startYear = event.startYear.fixedValue;
                } else {
                    //console.warn(`[Timing Calc] Warn: Method is fixedValue but fixedValue is null/undefined for "${eventName}". Using default.`);
                }
                break;
            case 'normalValue':
                if (event.startYear.normalValue) {
                    const mean = event.startYear.normalValue.mean ?? currentYear + 1;
                    const sd = event.startYear.normalValue.sd ?? 1;
                    startYear = Math.max(currentYear, Math.round(sampleNormal(mean, sd)));
                } else {
                     //console.warn(`[Timing Calc] Warn: Method is normalValue but normalValue details are missing for "${eventName}". Using default.`);
                }
                break;
            case 'uniformValue':
                 if (event.startYear.uniformValue) {
                    const min = event.startYear.uniformValue.lowerBound ?? currentYear + 1;
                    const max = event.startYear.uniformValue.upperBound ?? currentYear + 5;
                    startYear = Math.max(currentYear, Math.round(sampleUniform(min, max)));
                 } else {
                     //console.warn(`[Timing Calc] Warn: Method is uniformValue but uniformValue details are missing for "${eventName}". Using default.`);
                 }
                break;
            case 'sameYearAsAnotherEvent':
                const refEventNameSame = event.startYear.sameYearAsAnotherEvent;
                if (refEventNameSame) {
                    try {
                        //console.log(`[Timing Calc] Dependency: "${eventName}" start depends on SAME YEAR as "${refEventNameSame}". Making recursive call...`); // LOG: Before recursive call (same year)
                        const refTiming = getOrCalculateEventTiming(refEventNameSame, events, currentYear, eventTimingsCache, processing);
                        //console.log(`[Timing Calc] Dependency Result: Received timing for "${refEventNameSame}":`, refTiming); // LOG: After recursive call (same year)
                        startYear = refTiming.startYear;
                    } catch (error) {
                        console.error(`[Timing Calc] Error: Failed calculating start for "${eventName}" based on "${refEventNameSame}": ${error.message}`);
                        processing.delete(eventName); // Clean up processing set on error before throwing
                        throw error;
                    }
                } else {
                     //console.warn(`[Timing Calc] Warn: Method is sameYearAsAnotherEvent but reference event name is missing for "${eventName}". Using default.`);
                }
                break;
            case 'yearAfterAnotherEventEnd':
                const refEventNameAfter = event.startYear.yearAfterAnotherEventEnd;
                 if (refEventNameAfter) {
                    try {
                        //console.log(`[Timing Calc] Dependency: "${eventName}" start depends on YEAR AFTER end of "${refEventNameAfter}". Making recursive call...`); // LOG: Before recursive call (year after)
                        const refTiming = getOrCalculateEventTiming(refEventNameAfter, events, currentYear, eventTimingsCache, processing);
                        //console.log(`[Timing Calc] Dependency Result: Received timing for "${refEventNameAfter}":`, refTiming); // LOG: After recursive call (year after)
                        startYear = refTiming.startYear + refTiming.duration;
                    } catch (error) {
                        console.error(`[Timing Calc] Error: Failed calculating start for "${eventName}" based on end of "${refEventNameAfter}": ${error.message}`);
                        processing.delete(eventName); // Clean up processing set on error before throwing
                        throw error;
                    }
                 } else {
                     //console.warn(`[Timing Calc] Warn: Method is yearAfterAnotherEventEnd but reference event name is missing for "${eventName}". Using default.`);
                 }
                break;
            default:
                 //console.warn(`[Timing Calc] Warn: Unknown startYear method "${method}" for "${eventName}". Using default.`);
        }
    } else {
         //console.log(`[Timing Calc] Start Year Method for "${eventName}": No startYear or method defined, using default ${currentYear}.`); // LOG: No start year/method
    }
    // Ensure startYear is at least the current year
    startYear = Math.max(currentYear, startYear);
    //console.log(`[Timing Calc] Calculated Raw Start Year for "${eventName}": ${startYear} (clamped to >= ${currentYear})`); // LOG: Calculated start year

    // --- Calculate Duration --- (Should be independent of start year calculation)
    if (event.duration && event.duration.method) { // Check if duration and method exist
        const method = event.duration.method;
        //console.log(`[Timing Calc] Duration Method for "${eventName}": ${method}`); // LOG: Duration method
        if (event.duration.fixedValue != null) {
            duration = event.duration.fixedValue;
        } else if (event.duration.normalValue) {
            const mean = event.duration.normalValue.mean ?? 1;
            const sd = event.duration.normalValue.sd ?? 0.5;
            duration = Math.max(1, Math.round(sampleNormal(mean, sd)));
        } else if (event.duration.uniformValue) {
            const min = event.duration.uniformValue.lowerBound ?? 1;
            const max = event.duration.uniformValue.upperBound ?? 5;
            duration = Math.max(1, Math.round(sampleUniform(min, max)));
        } else {
             //console.warn(`[Timing Calc] Warn: Unknown duration method "${method}" or missing details for "${eventName}". Using default.`);
        }
    } else {
        //console.log(`[Timing Calc] Duration Method for "${eventName}": No duration or method defined, using default 1.`); // LOG: No duration/method
    }
    duration = Math.max(1, duration); // Ensure duration is at least 1
    //console.log(`[Timing Calc] Calculated Raw Duration for "${eventName}": ${duration} (clamped to >= 1)`); // LOG: Calculated duration

    const timing = { startYear, duration };
    //console.log(`[Timing Calc] Caching: Storing timing for "${eventName}":`, timing); // LOG: Caching result
    eventTimingsCache.set(eventName, timing);

    //console.log(`[Timing Calc] Processing: Removing "${eventName}" from processing set.`); // LOG: Remove from processing
    processing.delete(eventName); // Remove from processing set after successful calculation

    //console.log(`[Timing Calc] Exit: Returning timing for "${eventName}":`, timing); // LOG: Function exit
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
        let cumulativeFactor = 1.0; // Track cumulative inflation FACTOR, start at 1

        for (let i = 0; i < numYears; i++) {
            let sampledRate = 0.02; // Default rate if method is unknown or fails

            switch (inflationSettings.method) {
                case 'fixedPercentage':
                    sampledRate = (inflationSettings.fixedPercentage ?? 2) / 100;
                    break;
                case 'normalPercentage':
                    const mean = (inflationSettings.normalPercentage?.mean ?? 4) / 100;
                    const sd = (inflationSettings.normalPercentage?.sd ?? 3) / 100;
                    if (sd < 0) throw new Error("Standard deviation for normal inflation cannot be negative.");
                    sampledRate = sampleNormal(mean, sd);
                    break;
                case 'uniformPercentage':
                    const lower = (inflationSettings.uniformPercentage?.lowerBound ?? 1) / 100;
                    const upper = (inflationSettings.uniformPercentage?.upperBound ?? 5) / 100;
                    if (lower > upper) throw new Error("Lower bound for uniform inflation cannot exceed upper bound.");
                    sampledRate = sampleUniform(lower, upper);
                    break;
                default:
                    if (i === 0) { // Log warning only once per simulation
                         console.warn(`Sim ${simulationIndex + 1}: Unknown inflation method '${inflationSettings.method}'. Defaulting to 2% fixed for simulation.`);
                    }
                    sampledRate = 0.02;
            }

            // Compound the factor
            cumulativeFactor *= (1 + sampledRate);
            inflationArray.push(cumulativeFactor);
        }
    } catch (error) {
        console.error(`Sim ${simulationIndex + 1}: Error calculating inflation: ${error.message}. Defaulting to 2% fixed compound factor.`);
        const defaultRate = 0.02;
        inflationArray.length = 0; // Clear potentially partial array
        let cumulativeFactor = 1.0; // Reset factor for fallback
         for (let i = 0; i < numYears; i++) {
            cumulativeFactor *= (1 + defaultRate);
            inflationArray.push(cumulativeFactor);
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
            
            // --- DEBUG: Log calculated timing for each event ---
            //console.log(`Sim ${simulationIndex + 1} - Event: "${event.name}", Calculated Start: ${timing.startYear}, Calculated Duration: ${timing.duration}`);
            // --- END DEBUG ---
            
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
    
    // Print events by year
    //console.log(`\n--- Simulation ${simulationIndex + 1} - Calculated eventsByYear ---`);
    //eventsByYear.forEach((eventsInYear, index) => {
    //    const year = currentYear + index;
    //    console.log(`Year ${year} (Index ${index}): ${eventsInYear.length > 0 ? eventsInYear.join(', ') : 'No Events'}`);
    //});
    //console.log(`--- End eventsByYear ---\n`);

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
