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
  return Math.max(0, z0 * stdDev + mean); // Ensure non-negative
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

    // --- Calculate Inflation Array ---
    const inflationArray = [];
    const inflationSettings = modelData.scenario.simulationSettings.inflationAssumption;
    try {
        switch (inflationSettings.method) {
            case 'fixedPercentage':
                const fixedRate = (inflationSettings.fixedPercentage ?? 2) / 100; // Default to 2% if null/undefined
                for (let i = 0; i < numYears; i++) {
                    inflationArray.push(fixedRate);
                }
                //console.log(`Sim ${simulationIndex + 1}: Using fixed inflation rate: ${fixedRate.toFixed(4)}`);
                break;
            case 'normalPercentage':
                const mean = (inflationSettings.normalPercentage?.mean ?? 4) / 100; // Default 4%
                const sd = (inflationSettings.normalPercentage?.sd ?? 3) / 100;     // Default 3%
                 if (sd < 0) throw new Error("Standard deviation for normal inflation cannot be negative.");
                //console.log(`Sim ${simulationIndex + 1}: Using normal inflation: mean=${mean.toFixed(4)}, sd=${sd.toFixed(4)}`);
                for (let i = 0; i < numYears; i++) {
                    // Use non-rounding sampleNormal for percentage
                    inflationArray.push(Math.max(0, sampleNormal(mean, sd))); // Ensure non-negative inflation
                }
                break;
            case 'uniformPercentage':
                const lower = (inflationSettings.uniformPercentage?.lowerBound ?? 1) / 100; // Default 1%
                const upper = (inflationSettings.uniformPercentage?.upperBound ?? 5) / 100; // Default 5%
                if (lower > upper) throw new Error("Lower bound for uniform inflation cannot exceed upper bound.");
                //console.log(`Sim ${simulationIndex + 1}: Using uniform inflation: lower=${lower.toFixed(4)}, upper=${upper.toFixed(4)}`);
                for (let i = 0; i < numYears; i++) {
                    inflationArray.push(sampleUniform(lower, upper));
                }
                break;
            default:
                console.warn(`Sim ${simulationIndex + 1}: Unknown inflation method '${inflationSettings.method}'. Defaulting to 2% fixed.`);
                const defaultRate = 0.02;
                 for (let i = 0; i < numYears; i++) {
                    inflationArray.push(defaultRate);
                }
        }
    } catch (error) {
        console.error(`Sim ${simulationIndex + 1}: Error calculating inflation: ${error.message}. Defaulting to 2% fixed.`);
        const defaultRate = 0.02;
        inflationArray.length = 0; // Clear potentially partial array
         for (let i = 0; i < numYears; i++) {
            inflationArray.push(defaultRate);
        }
    }
    // --- End Inflation Calculation ---
    //console.log("inflationArray", inflationArray);

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
