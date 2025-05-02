/**
 * Financial Simulation Engine for RetireMint
 * 
 * This engine runs multiple financial simulations for retirement planning based on user scenarios and parameters.
 * The simulation process is:
 * 1. Verify the input data and prepare simulation parameters
 * 2. Run multiple independent simulations in parallel using Promise.all
 * 3. Analyze the results to determine success rate and statistics
 * 4. Format the results into visualizations for the frontend
 */

// const { simulateYear } = require('./SimulationEngine/SimulateYear');
// const Report = require('./Schemas/Report');
// //const IncomeTax = require('./Schemas/IncomeTax');
// //const StandardDeduction = require('./Schemas/StandardDeductions');
// //const CapitalGain = require('./Schemas/CapitalGain');
const { fetchAndLogModelData } = require('./FetchModelData');
const LifeExpectancy = require('./Schemas/LifeExpectancy'); // Import LifeExpectancy schema
const { runOneSimulation } = require('./RunOneSimulation'); // Import the new function

// Track if we've already logged data for debugging
let hasLoggedDataThisSession = false;


/**
 * Create asset trajectory data for visualization
 * @param {Array} simulations - Results of all simulations
 * @param {Number} numYears - Number of years simulated
 * @returns {Object} - Asset trajectory data
 */
/*
function createAssetTrajectories(simulations, numYears) {
  if (!simulations || simulations.length === 0) {
    return {
      xAxis: [],
      yAxis: {
        median: [],
        p90: [],
        p10: [],
        min: [],
        max: []
      }
    };
  }
  
  const currentYear = new Date().getFullYear();
  const xAxis = Array.from({ length: numYears }, (_, i) => currentYear + i);
  
  // Initialize arrays for each metric
  const medianValues = Array(numYears).fill(0);
  const p90Values = Array(numYears).fill(0);
  const p10Values = Array(numYears).fill(0);
  const minValues = Array(numYears).fill(0);
  const maxValues = Array(numYears).fill(0);
  
  // Calculate statistics for each year
  for (let yearIndex = 0; yearIndex < numYears; yearIndex++) {
    // Extract asset values for this year across all simulations
    const yearValues = simulations
      .map(sim => sim.yearlyResults[yearIndex]?.totalAssets || 0)
      .sort((a, b) => a - b);
    
    const count = yearValues.length;
    
    // Calculate metrics
    minValues[yearIndex] = yearValues[0];
    maxValues[yearIndex] = yearValues[count - 1];
    
    // Calculate median (50th percentile)
    medianValues[yearIndex] = count % 2 === 0 
      ? (yearValues[count / 2 - 1] + yearValues[count / 2]) / 2
      : yearValues[Math.floor(count / 2)];
    
    // Calculate 10th and 90th percentiles
    const p10Index = Math.floor(count * 0.1);
    const p90Index = Math.floor(count * 0.9);
    
    p10Values[yearIndex] = yearValues[p10Index];
    p90Values[yearIndex] = yearValues[p90Index];
  }
  
  return {
    xAxis,
    yAxis: {
      median: medianValues,
      p90: p90Values,
      p10: p10Values,
      min: minValues,
      max: maxValues
    }
  };
}
*/

/**
 * Runs multiple simulations based on user scenarios and tax data
 * @param {Object} scenario - User's financial scenario
 * @param {Object} userData - User data (age, spouse, etc.)
 * @param {Object} taxData - Tax brackets and other tax info
 * @param {Number} numSimulations - Number of simulations to run
 * @returns {Object} - Simulation results including visualizations
 */
async function runSimulations(scenario, userData, taxData, numSimulations = 100) {
  try {
    // Fetch model data EVERY time the function is called
    console.log('Fetching model data from the database...');
    const modelData = await fetchAndLogModelData(scenario._id);

    // Check if data fetching failed
    if (!modelData || !modelData.scenario) {
        console.error('Failed to fetch valid model data. Aborting simulations.');
        throw new Error('Failed to fetch necessary simulation data.');
    }

    // Only log data once per session for debugging
    if (!hasLoggedDataThisSession) {
      //console.log('\n--- Result from fetchAndLogModelData ---');
      //console.log(JSON.stringify(modelData, null, 2)); // Log the actual fetched data
      //console.log('\n--- Result from fetchAndLogModelData (Scenario Only) ---');
      // Log only the scenario part, excluding taxData
      //console.log(JSON.stringify({ scenario: modelData.scenario }, null, 2)); 
      //console.log('-------------------------------------\n');
      //console.log('Database model data logged to console (first run this session)');
      hasLoggedDataThisSession = true;
    }
    
    console.log(`Starting ${numSimulations} simulations...`);

    // --- Run Simulations in Parallel ---
    const simulationPromises = [];
    for (let i = 0; i < numSimulations; i++) {
        // Pass modelData and index to the simulation function
        // runOneSimulation should return a promise if it's async,
        // or wrap it in Promise.resolve() if it's synchronous but we want to treat it async here.
        // Assuming runOneSimulation is already async or returns a promise.
        simulationPromises.push(runOneSimulation(modelData, i));
    }

    // Wait for all simulations to complete
    const allSimulationResultsRaw = await Promise.all(simulationPromises);

    // --- Aggregate Detailed Results --- 
    const aggregatedResults = {
        yearlyResults: [],        // Array of yearlyResults arrays
        cashArrays: [],           // Array of cashArrays
        investmentValueArrays: [],// Array of investmentsValueArrays
        expensesArrays: [],       // Array of expensesArrays
        earlyWithdrawalArrays: [] // Array of earlyWithdrawalArrays
    };

    allSimulationResultsRaw.forEach(singleResult => {
        // singleResult is the object returned by runOneSimulation
        aggregatedResults.yearlyResults.push(singleResult.yearlyResults);
        aggregatedResults.cashArrays.push(singleResult.cashArray);
        aggregatedResults.investmentValueArrays.push(singleResult.investmentsValueArray);
        aggregatedResults.expensesArrays.push(singleResult.expensesArray);
        aggregatedResults.earlyWithdrawalArrays.push(singleResult.earlyWithdrawalArray);
    });

    // --- Log Final Results --- 
    //console.log('--- Aggregated Simulation Results ---');
    // Log a summary for clarity, full log might be too large
    console.log(`Total simulations run: ${aggregatedResults.yearlyResults.length}`);
    // Example: Log details from the first simulation's arrays
    const numSimsToLog = Math.min(4, aggregatedResults.yearlyResults.length); // Log up to 4 simulations
    if (numSimsToLog > 0) {
        for (let i = 0; i < numSimsToLog; i++) {
            console.log(`\n--- Details from Simulation #${i + 1} ---`);
            console.log(`  Yearly Results (Net Worth/Goal Met - First 5):`, aggregatedResults.yearlyResults[i]?.slice(0, 5)); 
            console.log(`  Cash Array:`, aggregatedResults.cashArrays[i]); // Log the full array
            // Keep others sliced for brevity, or remove if not needed
            // console.log(`  Investment Value Array:`, aggregatedResults.investmentValueArrays[i]?.slice(0, 5)); 
            // console.log(`  Expenses Array:`, aggregatedResults.expensesArrays[i]?.slice(0, 5));
            // console.log(`  Early Withdrawal Array:`, aggregatedResults.earlyWithdrawalArrays[i]?.slice(0, 5));
        }
    }
    //console.log('\n-------------------------------------\n');


    // --- Return Results --- 
    // Decide what needs to be returned. Returning everything might be large.
    // Maybe return aggregated statistics or just the success rate and trajectory data?
    // For now, returning the aggregated structure:
    return {
      status: 'simulations_completed',
      message: `Successfully ran ${numSimulations} simulations.`,
      numSimulationsRun: aggregatedResults.yearlyResults.length,
      // Return the aggregated data 
      aggregatedResults: aggregatedResults 
      // TODO: Add back statistical analysis and trajectory calculation if needed, 
      // using the data within aggregatedResults.
    };

  } catch (error) {
    console.error('Error in runSimulations:', error);
    return {
      error: true,
      message: error.message,
      stack: error.stack
    };
  }
}

module.exports = {
  runSimulations
}; 