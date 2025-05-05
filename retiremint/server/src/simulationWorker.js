const { workerData, parentPort } = require('worker_threads');
const { runOneSimulation } = require('./RunOneSimulation'); 

// Received data: { modelData: Object, simulationIndex: number }
const { modelData, simulationIndex } = workerData;

if (!modelData || simulationIndex == null) {
    parentPort.postMessage({ error: 'Worker received invalid data.', simulationIndex });
    process.exit(1); // Exit with error code
}

try {
    // Run the simulation - runOneSimulation should be synchronous or return data directly
    // If runOneSimulation itself becomes async, it needs different handling.
    //console.log(`Worker starting simulation #${simulationIndex + 1}`);
    const result = runOneSimulation(modelData, simulationIndex);
    //console.log(`Worker finished simulation #${simulationIndex + 1}`);
    
    // Post the result back to the main thread
    parentPort.postMessage({ result, simulationIndex });
    
} catch (error) {
    console.error(`Error in worker for simulation #${simulationIndex + 1}:`, error);
    // Post error back to the main thread
    parentPort.postMessage({ 
        error: error.message, 
        stack: error.stack, // Send stack for better debugging 
        simulationIndex 
    });
    process.exit(1); // Ensure worker exits on error
} 