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

function runOneSimulation(modelData, simulationIndex) {
    const currentYear = new Date().getFullYear();
    let numYears = 30; // Default
    let initialMaritalStatus = 'single';
    let maritalStatusArray = []; // Initialize

    try {
        const scenario = modelData.scenario;
        if (!scenario || !scenario.birthYear) {
            throw new Error("Scenario or birthYear missing in modelData");
        }
        //console.log("scenario.simulationSettings", scenario.simulationSettings);
        //console.log("scenario.simulationSettings.inflationAssumption", scenario.simulationSettings.inflationAssumption);
        if (!scenario.simulationSettings || !scenario.simulationSettings.inflationAssumption) {
            throw new Error("inflationAssumption missing in scenario.simulationSettings");
        }

        initialMaritalStatus = scenario.scenarioType === 'married' ? 'married' : 'single';
        const currentUserAge = currentYear - scenario.birthYear;
        let userTargetAge = currentUserAge + 30; // Default target

        // Determine user target age based on life expectancy settings
        if (scenario.lifeExpectancy) {
            if (scenario.lifeExpectancy.lifeExpectancyMethod === 'fixedValue') {
                userTargetAge = scenario.lifeExpectancy.fixedValue;
            } else if (scenario.lifeExpectancy.lifeExpectancyMethod === 'normalDistribution') {
                const mean = scenario.lifeExpectancy.normalDistribution?.mean;
                const stdDev = scenario.lifeExpectancy.normalDistribution?.standardDeviation;
                if (mean != null && stdDev != null) {
                    // Use the existing sampleNormal for age (which rounds)
                    userTargetAge = Math.round(sampleNormal(mean, stdDev)); 
                } else {
                  console.warn(`Simulation ${simulationIndex+1}: Missing mean/stdDev for user normal distribution LE, using default age.`);
                }
            }
        }
        
        // Clamp user target age to be at least current age + 1 year simulation minimum
        userTargetAge = Math.max(currentUserAge + 1, userTargetAge);
        numYears = userTargetAge - currentUserAge; // User determines the primary simulation length

        let spouseNumYears = -1; // Sentinel value if not married or no spouse LE data

        // Calculate potential spouse simulation years if married
        if (initialMaritalStatus === 'married' && scenario.spouseBirthYear && scenario.spouseLifeExpectancy) {
            const currentSpouseAge = currentYear - scenario.spouseBirthYear;
            let spouseTargetAge = currentSpouseAge + 30; // Default target

            if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'fixedValue') {
                spouseTargetAge = scenario.spouseLifeExpectancy.fixedValue;
            } else if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'normalDistribution') {
                const mean = scenario.spouseLifeExpectancy.normalDistribution?.mean;
                const stdDev = scenario.spouseLifeExpectancy.normalDistribution?.standardDeviation;
                 if (mean != null && stdDev != null) {
                    // Use the existing sampleNormal for age (which rounds)
                    spouseTargetAge = Math.round(sampleNormal(mean, stdDev)); 
                } else {
                  console.warn(`Simulation ${simulationIndex+1}: Missing mean/stdDev for spouse normal distribution LE, using default age.`);
                }
            }
            
            // Clamp spouse target age
            spouseTargetAge = Math.max(currentSpouseAge + 1, spouseTargetAge);
            spouseNumYears = spouseTargetAge - currentSpouseAge; 
            // DO NOT set numYears = Math.max(numYears, spouseNumYears) here anymore
        }

    } catch (error) {
        console.error(`Simulation ${simulationIndex+1}: Error calculating numYears/ages:`, error);
        console.warn(`Simulation ${simulationIndex+1}: Defaulting simulation duration to 30 years.`);
        numYears = 30; // Fallback to default
        initialMaritalStatus = modelData.scenario?.scenarioType === 'married' ? 'married' : 'single'; // Attempt to get status
        spouseNumYears = -1; // Reset spouse years on error
    }
    
    numYears = Math.max(1, Math.ceil(numYears)); // Ensure at least 1 year and integer

    // Initialize maritalStatusArray based on calculated numYears
    maritalStatusArray = Array(numYears).fill(initialMaritalStatus);

    // Adjust maritalStatusArray if spouse's calculated lifespan is shorter
    if (initialMaritalStatus === 'married' && spouseNumYears > 0 && spouseNumYears < numYears) {
        for (let i = Math.ceil(spouseNumYears); i < numYears; i++) {
             if (i >= 0) { // Ensure index is not negative
                maritalStatusArray[i] = 'single';
            }
        }
        console.log(`Simulation ${simulationIndex + 1}: Marital status changes to single in year ${currentYear + Math.ceil(spouseNumYears)} (index ${Math.ceil(spouseNumYears)}) due to spouse LE.`);
    }

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
    console.log("inflationArray", inflationArray);

    //------------------------------------------------------------------------------------------------------

    // --- Calculate Event Timings ---
    const eventsByYear = Array(numYears).fill().map(() => []);
    const events = modelData.scenario.events;
    
    // Process each event to determine when it occurs
    events.forEach(event => {
        let startYear = currentYear;
        let duration = 1;
        
        // Determine start year based on available fields
        if (event.startYear) {
            if (event.startYear.fixedValue) {
                startYear = event.startYear.fixedValue;
            } else if (event.startYear.normalValue) {
                const mean = event.startYear.normalValue.mean || 2025;
                const sd = event.startYear.normalValue.sd || 1;
                startYear = Math.max(2025, Math.round(sampleNormal(mean, sd)));
            } else if (event.startYear.uniformValue) {
                const min = event.startYear.uniformValue.lowerBound || 2025;
                const max = event.startYear.uniformValue.upperBound || 2030;
                startYear = Math.max(2025, Math.round(sampleUniform(min, max)));
            } else if (event.startYear.sameYearAsAnotherEvent) {
                // Find the referenced event
                const refEventName = event.startYear.sameYearAsAnotherEvent;
                const refEvent = events.find(e => e.name === refEventName);
                if (refEvent) {
                    // Recursion is avoided since we're only reading, not setting
                    const refStartYear = event.startYear.fixedValue || 2025;
                    startYear = refStartYear;
                }
            } else if (event.startYear.yearAfterAnotherEventEnd) {
                // Find the referenced event
                const refEventName = event.startYear.yearAfterAnotherEventEnd;
                const refEvent = events.find(e => e.name === refEventName);
                if (refEvent) {
                    // Determine when the referenced event ends
                    let refStartYear = currentYear;
                    let refDuration = 1;
                    
                    if (refEvent.startYear && refEvent.startYear.fixedValue) {
                        refStartYear = refEvent.startYear.fixedValue;
                    }
                    
                    if (refEvent.duration && refEvent.duration.fixedValue) {
                        refDuration = refEvent.duration.fixedValue;
                    } else if (refEvent.duration && refEvent.duration.normalValue) {
                        const mean = refEvent.duration.normalValue.mean || 1;
                        const sd = refEvent.duration.normalValue.sd || 0.5;
                        refDuration = Math.max(1, Math.round(sampleNormal(mean, sd)));
                    } else if (refEvent.duration && refEvent.duration.uniformValue) {
                        const min = refEvent.duration.uniformValue.lowerBound || 1;
                        const max = refEvent.duration.uniformValue.upperBound || 5;
                        refDuration = Math.max(1, Math.round(sampleUniform(min, max)));
                    }
                    
                    startYear = refStartYear + refDuration;
                }
            }
        }
        
        // Determine duration based on available fields
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
        
        // Map event to simulation years
        const startIndex = startYear - currentYear;
        const endIndex = startIndex + duration;
        
        // Add event to eventsByYear for each year it occurs, if within simulation boundaries
        for (let i = startIndex; i < endIndex && i < numYears; i++) {
            if (i >= 0) {
                eventsByYear[i].push(event.name);
            }
        }
    });
    
    //console.log(`Simulation ${simulationIndex + 1}: Events by year:`, eventsByYear.map((events, i) => 
    //    `Year ${currentYear + i}: ${events.length > 0 ? events.join(', ') : 'No events'}`).join('; '));
    //console.log(eventsByYear)
    
    // Print events by year in a simple format
    // let year = currentYear;
    // for (let i = 0; i < eventsByYear.length; i++) {
    //     console.log("printing " + year + ": " + eventsByYear[i] + "\n");
    //     year++;
    // }

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
