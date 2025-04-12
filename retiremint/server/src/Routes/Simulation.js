const express = require('express');
const router = express.Router();
const { runSimulations } = require('../SimulationEngine');
const Scenario = require('../Schemas/Scenario');
const Report = require('../Schemas/Report');
const TaxData = require('../Schemas/TaxData');
const fs = require('fs');
const path = require('path');

// Run simulation for a scenario
router.post('/run', async (req, res) => {
  try {
    const { scenarioId, numSimulations, numYears, userId } = req.body;
    
    console.log(`Starting simulation for scenario: ${scenarioId}, user: ${userId}`);
    console.log(`Simulation parameters: ${numSimulations} simulations over ${numYears} years`);
    
    // Fetch the scenario from the database
    const scenario = await Scenario.findById(scenarioId)
      .populate({
        path: 'simulationSettings',
        populate: {
          path: 'inflationAssumption'
        }
      })
      .populate({
        path: 'investments',
        populate: {
          path: 'investmentType',
          populate: ['expectedAnnualReturn']
        }
      })
      .populate({
        path: 'events',
        populate: ['startYear', 'duration', 'income', 'expense', 'invest', 'rebalance']
      });
    
    if (!scenario) {
      console.error(`Scenario not found with ID: ${scenarioId}`);
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    console.log(`Found scenario: ${scenario.name}`);
    //console.log('Scenario structure:', {
    //  hasSimulationSettings: !!scenario.simulationSettings,
    //  investments: scenario.investments ? scenario.investments.length : 0,
    //  events: scenario.events ? scenario.events.length : 0,
    //  birthYear: scenario.birthYear,
    //  financialGoal: scenario.financialGoal
    //});
    
    // Fetch the most recent tax data
    //console.log('Fetching tax data from database...');
    let taxData = await TaxData.findOne().sort({ taxYear: -1 });
    
    if (!taxData) {
      console.error('No tax data found in the database');
      
      // Create default tax data as fallback with only rmdTable
      console.log('Creating default tax data as fallback');
      taxData = {
        taxYear: new Date().getFullYear(),
        rmdTable: {
          74: 25.5,
          75: 24.6,
          80: 18.7,
          85: 14.8,
          90: 11.4,
          95: 8.6,
          100: 6.3
        }
      };
    } else {
      console.log(`Found tax data`);
    }
    
    // Run the simulations
    console.log('Running simulations...');
    const result = await runSimulations(
      scenario, 
      { 
        _id: userId,
        age: new Date().getFullYear() - scenario.birthYear,
        hasSpouse: scenario.scenarioType === 'married',
        spouseAge: scenario.spouseBirthYear ? 
          new Date().getFullYear() - scenario.spouseBirthYear : null
      }, 
      taxData, 
      numSimulations, 
      numYears
    );
    
    // Check if this is just a data verification run
    if (result.status === 'data_verification_only') {
      console.log('Data verification completed successfully');
      
      // Create a simple log file for the data verification
      const logDir = path.join(__dirname, '..', '..', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const datetime = new Date().toISOString().replace(/[:.]/g, '-');
      const username = userId || 'anonymous';
      const logFile = path.join(logDir, `data_verification_${username}_${datetime}.log`);
      
      let logContent = `Data Verification for Scenario: ${scenario.name}\n`;
      logContent += `User ID: ${userId}\n`;
      logContent += `Scenario ID: ${scenarioId}\n`;
      logContent += `Timestamp: ${new Date().toISOString()}\n\n`;
      logContent += `Verification Status: ${result.dataVerified ? 'SUCCESS' : 'FAILED'}\n`;
      logContent += `Message: ${result.message}\n`;
      
      fs.writeFileSync(logFile, logContent);
      
      // Return a simplified result to the client
      return res.json({
        success: true,
        status: 'data_verification_only',
        message: result.message,
        scenarioId: scenarioId,
        // Mock a report for the frontend to display
        mockReport: {
          _id: `mock_${new Date().getTime()}`,
          name: `Data Verification for ${scenario.name}`,
          userId: userId,
          scenarioId: scenarioId,
          numSimulations: numSimulations,
          numYears: numYears,
          createdAt: new Date().toISOString(),
          // Default statistics to avoid frontend errors
          successRate: 0,
          financialGoal: scenario.financialGoal || 0,
          finalAssetStatistics: {
            min: 0,
            max: 0,
            mean: 0,
            median: 0
          },
          // Empty simulation results - frontend should handle this gracefully
          simulationResults: []
        }
      });
    }
    
    // For the regular simulation case, continue with existing code
    // Create log files for debugging
    const logDir = path.join(__dirname, '..', '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const datetime = new Date().toISOString().replace(/[:.]/g, '-');
    const username = userId || 'anonymous';
    
    // Log first simulation to CSV
    const csvFile = path.join(logDir, `${username}_${datetime}.csv`);
    let csvContent = 'Year,';
    
    // Add column headers for each investment
    if (result.simulationResults && result.simulationResults[0]) {
      const firstSimulation = result.simulationResults[0];
      
      // Convert to CSV
      csvContent += 'Total Assets,Income,Social Security,Capital Gains,Inflation Rate\n';
      
      // Add rows for each year
      firstSimulation.yearlyResults.forEach(yearResult => {
        csvContent += `${yearResult.year},${yearResult.totalAssets},${yearResult.income},${yearResult.socialSecurity},${yearResult.capitalGains},${yearResult.inflationRate}\n`;
      });
      
      fs.writeFileSync(csvFile, csvContent);
    }
    
    // Log detailed events
    const logFile = path.join(logDir, `${username}_${datetime}.log`);
    let logContent = `Simulation Report for ${scenario.name}\n`;
    logContent += `User ID: ${userId}\n`;
    logContent += `Number of Simulations: ${numSimulations}\n`;
    logContent += `Number of Years: ${numYears}\n`;
    
    // Ensure successRate is a valid number for toFixed
    const safeSuccessRate = typeof result.successRate === 'number' && !isNaN(result.successRate) 
      ? result.successRate 
      : 0;
    logContent += `Success Rate: ${safeSuccessRate.toFixed(2)}%\n`;
    
    // Log simulation results
    if (result.simulationResults) {
      logContent += `\nSimulation Results:\n`;
      result.simulationResults.forEach((simulation, index) => {
        logContent += `Simulation ${index + 1}:\n`;
        logContent += `Final Asset Statistics: ${JSON.stringify(simulation.finalAssetStatistics)}\n`;
        logContent += `Success Rate: ${simulation.successRate.toFixed(2)}%\n`;
        logContent += `\nYearly Results:\n`;
        simulation.yearlyResults.forEach(yearResult => {
          logContent += `Year: ${yearResult.year}, Total Assets: ${yearResult.totalAssets}, Income: ${yearResult.income}, Social Security: ${yearResult.socialSecurity}, Capital Gains: ${yearResult.capitalGains}, Inflation Rate: ${yearResult.inflationRate}\n`;
        });
        logContent += `\n`;
      });
    }
    
    fs.writeFileSync(logFile, logContent);
    
    // Create a report document
    const report = new Report({
      userId: userId,
      scenarioId: scenarioId,
      numSimulations: numSimulations,
      numYears: numYears,
      successRate: result.successRate,
      finalAssetStatistics: result.finalAssetStatistics,
      simulationResults: result.simulationResults,
      createdAt: new Date()
    });
    
    await report.save();
    
    // Return the result to the client
    return res.json({
      success: true,
      status: 'simulation_completed',
      message: 'Simulation completed successfully',
      scenarioId: scenarioId,
      reportId: report._id,
      report: {
        _id: report._id,
        userId: userId,
        scenarioId: scenarioId,
        numSimulations: numSimulations,
        numYears: numYears,
        successRate: result.successRate,
        finalAssetStatistics: result.finalAssetStatistics,
        simulationResults: result.simulationResults,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return res.status(500).json({ error: 'An error occurred while running the simulation' });
  }
});

module.exports = router;