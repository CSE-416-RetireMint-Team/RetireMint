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
  return Math.max(1, Math.round(z0 * stdDev + mean)); // Ensure non-negative and round
}

function runOneSimulation(modelData, simulationIndex) {
    const currentYear = 2025;
    let numYears = 30; // Default

    try {
        const scenario = modelData.scenario;
        if (!scenario || !scenario.birthYear) {
            throw new Error("Scenario or birthYear missing in modelData");
        }

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
                    userTargetAge = sampleNormal(mean, stdDev);
                } else {
                  console.warn(`Simulation ${simulationIndex+1}: Missing mean/stdDev for user normal distribution, using default.`);
                }
            }
        }
        
        // Clamp user target age to be at least current age + 1
        userTargetAge = Math.max(currentUserAge + 1, userTargetAge);
        let userNumYears = userTargetAge - currentUserAge;
        numYears = userNumYears;

        // Consider spouse if married
        if (scenario.scenarioType === 'married' && scenario.spouseBirthYear && scenario.spouseLifeExpectancy) {
            const currentSpouseAge = currentYear - scenario.spouseBirthYear;
            let spouseTargetAge = currentSpouseAge + 30; // Default target

            if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'fixedValue') {
                spouseTargetAge = scenario.spouseLifeExpectancy.fixedValue;
            } else if (scenario.spouseLifeExpectancy.lifeExpectancyMethod === 'normalDistribution') {
                const mean = scenario.spouseLifeExpectancy.normalDistribution?.mean;
                const stdDev = scenario.spouseLifeExpectancy.normalDistribution?.standardDeviation;
                 if (mean != null && stdDev != null) {
                    spouseTargetAge = sampleNormal(mean, stdDev);
                } else {
                  console.warn(`Simulation ${simulationIndex+1}: Missing mean/stdDev for spouse normal distribution, using default.`);
                }
            }
            
            // Clamp spouse target age
            spouseTargetAge = Math.max(currentSpouseAge + 1, spouseTargetAge);
            let spouseNumYears = spouseTargetAge - currentSpouseAge;
            numYears = Math.max(numYears, spouseNumYears); // Use the longer duration
        }

    } catch (error) {
        console.error(`Simulation ${simulationIndex+1}: Error calculating numYears:`, error);
        console.warn(`Simulation ${simulationIndex+1}: Defaulting simulation duration to 30 years.`);
        numYears = 30; // Fallback to default
    }
    
    numYears = Math.ceil(numYears); // Ensure integer

    console.log(`Running simulation #${simulationIndex + 1} for calculated ${numYears} years (mock).`);
    const yearlyResults = [];
    const mockNetWorth = 1000000 + (simulationIndex * 10000); // Vary slightly per simulation
    const mockFailedStatus = false; // Hardcoded

    for (let i = 0; i < numYears; i++) {
        // In the future, actual simulation logic for the year would go here.
        yearlyResults.push([mockNetWorth + (i * 5000), mockFailedStatus]); // Hardcoded tuple
    }

    return yearlyResults;
}

module.exports = {
    runOneSimulation
};
