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
          populate: ['expectedAnnualReturn', 'expectedAnnualIncome']
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
    console.log('Scenario structure:', {
      hasSimulationSettings: !!scenario.simulationSettings,
      investments: scenario.investments ? scenario.investments.length : 0,
      events: scenario.events ? scenario.events.length : 0,
      birthYear: scenario.birthYear,
      financialGoal: scenario.financialGoal
    });
    
    // Get the latest tax data from the database
    const currentYear = new Date().getFullYear();
    console.log(`Looking for tax data for year: ${currentYear}`);
    let taxData = await TaxData.findOne({ taxYear: currentYear });
    
    if (!taxData) {
      // If current year's data not available, get the most recent
      console.log(`No tax data found for ${currentYear}, looking for most recent data...`);
      taxData = await TaxData.findOne().sort({ taxYear: -1 });
      
      if (!taxData) {
        console.error('No tax data found in the database at all');
        
        // Create default tax data as fallback
        console.log('Creating default tax data as fallback...');
        taxData = {
          taxYear: currentYear,
          federal: {
            brackets: [
              { min: 0, max: 10275, rate: 0.10 },
              { min: 10275, max: 41775, rate: 0.12 },
              { min: 41775, max: 89075, rate: 0.22 },
              { min: 89075, max: 170050, rate: 0.24 },
              { min: 170050, max: 215950, rate: 0.32 },
              { min: 215950, max: 539900, rate: 0.35 },
              { min: 539900, max: Number.MAX_VALUE, rate: 0.37 }
            ],
            standardDeductions: {
              single: 12950,
              married: 25900
            },
            capitalGains: {
              thresholds: [40400, 445850],
              rates: [0, 0.15, 0.20]
            }
          },
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
        console.log(`Found tax data for year: ${taxData.taxYear}`);
      }
    }
    
    // Add taxBrackets for simulation engine
    if (!taxData.taxBrackets) {
      console.log('Adding taxBrackets property to tax data for simulation engine');
      taxData.taxBrackets = {
        federal: taxData.federal?.brackets.map(bracket => ({
          lowerBound: bracket.min || 0,
          upperBound: bracket.max || Number.MAX_VALUE,
          rate: bracket.rate || 0
        })) || [],
        state: [],
        capitalGains: [
          { lowerBound: 0, upperBound: 40400, rate: 0.0 },
          { lowerBound: 40400, upperBound: 445850, rate: 0.15 },
          { lowerBound: 445850, upperBound: Number.MAX_VALUE, rate: 0.20 }
        ],
        standardDeduction: taxData.federal?.standardDeductions?.single || 12950
      };
    }
    
    // Add retirement contribution limits if missing
    if (!taxData.retirementContribLimits) {
      console.log('Adding retirement contribution limits to tax data');
      taxData.retirementContribLimits = {
        preTax: 20500,
        afterTax: 6000
      };
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
    
    // Ensure financialGoal is a valid number for toLocaleString
    const safeFinancialGoal = typeof scenario.financialGoal === 'number' && !isNaN(scenario.financialGoal) 
      ? scenario.financialGoal 
      : 0;
    logContent += `Financial Goal: $${safeFinancialGoal.toLocaleString()}\n\n`;
    
    if (result.simulationResults && result.simulationResults[0]) {
      const firstSimulation = result.simulationResults[0];
      
      logContent += `Detailed events for first simulation:\n`;
      if (Array.isArray(firstSimulation.yearlyResults)) {
        firstSimulation.yearlyResults.forEach(yearResult => {
          // Ensure all values are numbers to avoid formatting errors
          const year = typeof yearResult.year === 'number' ? yearResult.year : 0;
          const totalAssets = typeof yearResult.totalAssets === 'number' && !isNaN(yearResult.totalAssets) 
            ? yearResult.totalAssets : 0;
          const income = typeof yearResult.income === 'number' && !isNaN(yearResult.income) 
            ? yearResult.income : 0;
          const socialSecurity = typeof yearResult.socialSecurity === 'number' && !isNaN(yearResult.socialSecurity) 
            ? yearResult.socialSecurity : 0;
          const capitalGains = typeof yearResult.capitalGains === 'number' && !isNaN(yearResult.capitalGains) 
            ? yearResult.capitalGains : 0;
          const inflationRate = typeof yearResult.inflationRate === 'number' && !isNaN(yearResult.inflationRate) 
            ? yearResult.inflationRate : 0;
          
          logContent += `Year ${year}:\n`;
          logContent += `  Total Assets: $${totalAssets.toLocaleString()}\n`;
          logContent += `  Income: $${income.toLocaleString()}\n`;
          logContent += `  Social Security: $${socialSecurity.toLocaleString()}\n`;
          logContent += `  Capital Gains: $${capitalGains.toLocaleString()}\n`;
          logContent += `  Inflation Rate: ${(inflationRate * 100).toFixed(2)}%\n\n`;
        });
      } else {
        logContent += "No yearly results available\n";
      }
      
      fs.writeFileSync(logFile, logContent);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Error running simulation' });
  }
});

// Get all reports for a user
router.get('/reports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Get all shared reports for a user
router.get('/sharedreports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await Report.find({ 'sharedUsers.userId' : userId}).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Get a specific report by ID
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Error fetching report' });
  }
});

// Delete a report
router.delete('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    await Report.findByIdAndDelete(reportId);
    return (res.json({ success: true }));
  } catch (error) {
    console.error('Error deleting report:' , error);
    res.status(500).json({ error: 'Error deleting report' });
  }
});


router.get('/report/:reportId/scenario', async(req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    if (!report) {
      return (res.status(404).json({ error: 'Report not Found' }));
    }
    const scenario = await Scenario.findById(report.scenarioId);
    if (!scenario) {
      return (res.status(404).json({ error: 'Scenario not Found' }));
    }
    res.json(scenario);
  } catch (error) {
    console.error(`Error fetching scenario from report: `, error)
  }
});

module.exports = router; 