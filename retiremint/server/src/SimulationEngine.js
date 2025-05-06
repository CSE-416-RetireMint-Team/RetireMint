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
// Removed direct import of runOneSimulation
// const { runOneSimulation } = require('./RunOneSimulation'); 
const { Worker } = require('worker_threads');
const path = require('path'); // Needed for resolving worker script path
const fs = require('fs'); // <-- Require fs module for file writing

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
 * Runs multiple simulations based on user scenarios and tax data using Worker Threads
 * @param {Object} scenario - User's financial scenario
 * @param {Object} userData - User data (age, spouse, etc.)
 * @param {Object} taxData - Tax brackets and other tax info
 * @param {Number} numSimulations - Number of simulations to run
 * @returns {Object} - Simulation results including visualizations
 */
async function runSimulations(scenario, userData, taxData, numSimulations = 100) {
    try {
        // Fetch model data ONCE in the main thread
        console.log('Fetching model data from the database...');
        const modelData = await fetchAndLogModelData(scenario._id);

        // Check if data fetching failed
        if (!modelData || !modelData.scenario) {
            console.error('Failed to fetch valid model data. Aborting simulations.');
            throw new Error('Failed to fetch necessary simulation data.');
        }

        // Only log data once per session for debugging
        if (!hasLoggedDataThisSession) {
          console.log('\n--- Result from fetchAndLogModelData ---');
          console.log(JSON.stringify(modelData, null, 2)); // Log the actual fetched data
          console.log('\n--- Result from fetchAndLogModelData (Scenario Only) ---');
          console.log(JSON.stringify({ scenario: modelData.scenario }, null, 2)); 
          console.log('-------------------------------------\n');
          console.log('Database model data logged to console (first run this session)');
          hasLoggedDataThisSession = true;
        }
        
        console.log(`Starting ${numSimulations} simulations using worker threads...`);

        // --- Run Simulations in Parallel using Workers ---
        const simulationPromises = [];
        const workerResults = new Array(numSimulations); // Array to hold results in order
        let completedCount = 0;
        let firstError = null; // Track the first error encountered

        const workerScriptPath = path.resolve(__dirname, 'simulationWorker.js');

        for (let i = 0; i < numSimulations; i++) {
            const promise = new Promise((resolve, reject) => {
                const worker = new Worker(workerScriptPath, {
                    workerData: { 
                        modelData: modelData, 
                        simulationIndex: i 
                    }
                });

                worker.on('message', (message) => {
                    if (message.error) {
                        console.error(`Worker for sim #${message.simulationIndex + 1} reported error: ${message.error}`);
                        if (!firstError) {
                            firstError = new Error(`Worker Error (Sim #${message.simulationIndex + 1}): ${message.error}${message.stack ? '\n' + message.stack : ''}`);
                        }
                        resolve({ error: true, index: message.simulationIndex }); 
                    } else {
                        workerResults[message.simulationIndex] = message.result;
                        resolve({ error: false, index: message.simulationIndex });

                        // --- Log results for the FIRST simulation --- 
                        if (message.simulationIndex === 0 && message.result) {
                            writeSimulationLogs(userData, message.result);
                        }
                        // -----------------------------------------
                    }
                    completedCount++;
                });

                worker.on('error', (error) => {
                    console.error(`Worker Error (Sim #${i + 1}):`, error);
                    if (!firstError) {
                        firstError = error;
                    }
                    resolve({ error: true, index: i }); 
                    completedCount++;
                });

                worker.on('exit', (code) => {
                    if (code !== 0 && !firstError) {
                        const errorMessage = `Worker (Sim #${i + 1}) stopped with exit code ${code}`;
                        console.error(errorMessage);
                        firstError = new Error(errorMessage);
                        resolve({ error: true, index: i });
                        completedCount++;
                    } else if (!workerResults[i] && !firstError && code === 0) {
                        const errorMessage = `Worker (Sim #${i + 1}) exited cleanly but did not return a result.`;
                        console.error(errorMessage);
                        firstError = new Error(errorMessage);
                        resolve({ error: true, index: i});
                        completedCount++;
                    }
                });
            });
            simulationPromises.push(promise);
        }

        // Wait for all workers to complete (or report errors)
        await Promise.all(simulationPromises);
        
        // After all promises resolve, check if any worker encountered an error
        if (firstError) {
            console.error("One or more simulations failed.");
            throw firstError; // Throw the first encountered error
        }

        console.log(`All ${numSimulations} worker simulations completed.`);

        // --- Aggregate Detailed Results --- 
        const aggregatedResults = {
            yearlyResults: [],        
            cashArrays: [],           
            investmentValueArrays: [],
            expensesArrays: [],      
            earlyWithdrawalArrays: [], 
            incomeArrays: [],          
            discretionaryRatioArrays: [] 
        };

        workerResults.forEach(singleResult => {
            if (singleResult) { 
                aggregatedResults.yearlyResults.push(singleResult.yearlyResults);
                aggregatedResults.cashArrays.push(singleResult.cashArray);
                aggregatedResults.investmentValueArrays.push(singleResult.investmentsValueArray);
                aggregatedResults.expensesArrays.push(singleResult.expensesArray);
                aggregatedResults.earlyWithdrawalArrays.push(singleResult.earlyWithdrawalArray);
                aggregatedResults.incomeArrays.push(singleResult.incomeArrays);
                aggregatedResults.discretionaryRatioArrays.push(singleResult.discretionaryRatioArray);
            } else {
                 console.warn("Found null/undefined result in workerResults array, skipping aggregation for this simulation.");
                 // Potentially push placeholder data or handle differently
                 aggregatedResults.yearlyResults.push([]); // Example placeholder
                 // ... add placeholders for other arrays ...
            }
        });

        // --- Log Final Results --- 
        console.log(`Total simulations run: ${aggregatedResults.yearlyResults.length}`);
        const numSimsToLog = Math.min(4, aggregatedResults.yearlyResults.length); 
        if (numSimsToLog > 0) {
            for (let i = 0; i < numSimsToLog; i++) {
                console.log(`\n--- Details from Simulation #${i + 1} ---`);
                // console.log(`  Yearly Results (Net Worth/Goal Met - First 5):`, aggregatedResults.yearlyResults[i]?.slice(0, 5)); 
                //console.log(`  Cash Array (First 5):`, aggregatedResults.cashArrays[i]/*?.slice(0, 5)*/); 
                //console.log(`  Investment Value Array (First 5 Years):`, aggregatedResults.investmentValueArrays[i]/*?.slice(0, 5)*/); 
                // console.log(`  Expenses Array (First 5 Years):`, aggregatedResults.expensesArrays[i]/*?.slice(0, 5)*/); 
                // console.log(`  Early Withdrawal Array (First 5):`, aggregatedResults.earlyWithdrawalArrays[i]/*?.slice(0, 5)*/);
                // console.log(`  Income Array (First 5 Years):`, aggregatedResults.incomeArrays[i]?.slice(0, 5));
                // console.log(`  Discretionary Ratio Array (First 5):`, aggregatedResults.discretionaryRatioArrays[i]/*?.slice(0, 5)*/); 
            }
        }
        
        // --- Return Results --- 
        return {
          status: 'simulations_completed',
          message: `Successfully ran ${numSimulations} simulations.`,
          numSimulationsRun: aggregatedResults.yearlyResults.length,
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

// --- Helper function to write simulation logs --- 
function writeSimulationLogs(userData, firstSimResult) {
    try {
        const userName = userData?.name?.replace(/\s+/g, '_') || 'UnknownUser'; // <-- Use userName again, sanitize spaces
        const now = new Date();
        // Format date/time to EST, filename-safe
        const estTimeString = now.toLocaleString('en-US', { 
            timeZone: 'America/New_York', 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: false // Use 24-hour format
        });
        // Replace characters unsuitable for filenames
        const datetime = estTimeString.replace(/[/\?%*:|"<>]/g, '-').replace(/, /g, 'T').replace(/ /g, '_'); 
        
        const logDir = path.join(__dirname, 'logs');

        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const csvFilename = path.join(logDir, `${userName}_${datetime}.csv`); // <-- Use userName in filename
        const logFilename = path.join(logDir, `${userName}_${datetime}.log`); // <-- Use userName in filename

        // --- Write CSV File --- 
        const investmentData = firstSimResult.investmentsValueArray || [];
        if (investmentData.length > 0) {
            // Determine headers
            const allKeys = new Set();
            investmentData.forEach(yearData => {
                Object.keys(yearData || {}).forEach(key => allKeys.add(key));
            });
             // Ensure 'Cash' is included and sort headers (optional, put Cash last?)
            allKeys.add('Cash');
            const headers = ['Year', ...Array.from(allKeys).sort((a, b) => a === 'Cash' ? 1 : b === 'Cash' ? -1 : a.localeCompare(b))];
            
            // Prepare CSV content
            let csvContent = headers.join(',') + '\n';
            const startYear = new Date().getFullYear(); 
            investmentData.forEach((yearData, index) => {
                const year = startYear + index;
                const row = [year];
                headers.slice(1).forEach(header => {
                    row.push(yearData[header]?.toFixed(2) ?? '0.00');
                });
                csvContent += row.join(',') + '\n';
            });

            fs.writeFileSync(csvFilename, csvContent);
            console.log(`Simulation CSV log written to: ${csvFilename}`);
        } else {
            console.warn("No investment data found for first simulation, skipping CSV log.");
        }

        // --- Write LOG File --- 
        const eventLogData = firstSimResult.financialEventsLog || [];
        if (eventLogData.length > 0) {
            let logContent = '';
            eventLogData.forEach(entry => {
                logContent += `Year: ${entry.year}, Type: ${entry.type}, Details: ${entry.details}\n`;
            });
            // Log before write, include sample data
            console.log(`[SimEngine Write] Preparing to write ${eventLogData.length} entries to ${logFilename}. Sample:`, JSON.stringify(eventLogData.slice(0, 3))); 
            fs.writeFileSync(logFilename, logContent);
            console.log(`Simulation event log written to: ${logFilename}`);
        } else {
             console.warn("No financial event data found for first simulation, skipping LOG file.");
        }

    } catch (err) {
        console.error("Error writing simulation logs:", err);
    }
}

module.exports = {
  runSimulations
}; 