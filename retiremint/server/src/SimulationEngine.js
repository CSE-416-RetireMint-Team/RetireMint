/**
 * Financial Simulation Engine for RetireMint
 * Adapted from standalone_sim.js for integration with MongoDB and frontend
 */
const TaxData = require('./Schemas/TaxData');
const Report = require('./Schemas/Report');

/**
 * Runs multiple simulations based on user scenarios and tax data
 * @param {Object} scenario - User's financial scenario
 * @param {Object} userData - User data (age, spouse, etc.)
 * @param {Object} taxData - Tax brackets and other tax info
 * @param {Number} numSimulations - Number of simulations to run
 * @returns {Object} - Simulation results including visualizations
 */
async function runSimulations(scenario, userData, taxData, numSimulations = 100, numYears = 30) {
  try {
    console.log(`Running ${numSimulations} simulations for scenario ${scenario.name}...`);
    
    // Validate necessary parameters
    if (!scenario) {
      console.error('No scenario provided to runSimulations');
      throw new Error('No scenario provided to simulation engine');
    }
    
    if (!userData) {
      console.warn('No userData provided, using defaults');
      userData = {
        _id: 'guest',
        age: 30,
        hasSpouse: false,
        spouseAge: null
      };
    }
    
    if (!taxData) {
      console.warn('No taxData provided, using defaults');
      // Use default tax data
      taxData = {
        taxYear: new Date().getFullYear(),
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
        rmdTable: {}
      };
    }
    
    // Create base simulation parameters
    console.log('Creating base parameters from scenario...');
    const baseParams = createBaseParamsFromScenario(scenario, userData, taxData);
    
    // Store all simulation results
    const allResults = [];
    
    // Run simulations
    for (let i = 0; i < numSimulations; i++) {
      try {
        // Create randomized parameters for this simulation
        const simulationParams = randomizeParameters(baseParams);
        
        // Run a single simulation
        const result = runOneSimulation(simulationParams, numYears);
        
        // Store the result
        allResults.push(result);
        
        // Log progress every 10 simulations
        if (i % 10 === 0) {
          console.log(`Completed ${i} simulations...`);
        }
      } catch (simError) {
        console.error(`Error in simulation ${i}:`, simError);
        // Continue with next simulation
      }
    }
    
    if (allResults.length === 0) {
      throw new Error('All simulations failed to run');
    }
    
    console.log(`Successfully completed ${allResults.length} out of ${numSimulations} simulations`);
    console.log('All simulations completed, analyzing results...');
    
    // Analyze results
    const analysis = analyzeResults(allResults);
    
    // Create visualizations
    const visualizations = createVisualizations(allResults, analysis);
    
    // Create a report object
    const reportData = {
      metadata: {
        numSimulations,
        numYears,
        scenarioName: scenario.name || 'Unnamed Scenario',
        scenarioId: scenario._id,
        dateRun: new Date().toISOString(),
        userId: userData._id || 'guest'
      },
      simulationParams: baseParams,
      results: {
        summary: analysis,
        visualizations,
        simulationResults: allResults.slice(0, 5) // Only include first 5 simulations to reduce size
      }
    };
    
    // Save the report to the database
    console.log('Saving simulation report to database...');
    try {
      // Helper function to sanitize numeric values
      const sanitizeNumber = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
          return 0; // Replace NaN with 0
        }
        return value;
      };

      // Sanitize simulation results to avoid NaN values
      const sanitizedResults = allResults.slice(0, 5).map(result => {
        // Sanitize finalState numeric values
        const sanitizedFinalState = {
          totalAssets: sanitizeNumber(result.finalState?.totalAssets),
          curYearIncome: sanitizeNumber(result.finalState?.curYearIncome),
          curYearSS: sanitizeNumber(result.finalState?.curYearSS),
          curYearGains: sanitizeNumber(result.finalState?.curYearGains),
          inflationRate: sanitizeNumber(result.finalState?.inflationRate)
        };

        // Sanitize yearlyResults numeric values
        const sanitizedYearlyResults = (result.yearlyResults || []).map(year => ({
          year: sanitizeNumber(year.year),
          totalAssets: sanitizeNumber(year.totalAssets),
          income: sanitizeNumber(year.income),
          socialSecurity: sanitizeNumber(year.socialSecurity),
          capitalGains: sanitizeNumber(year.capitalGains),
          inflationRate: sanitizeNumber(year.inflationRate)
        }));

        return {
          finalState: sanitizedFinalState,
          yearlyResults: sanitizedYearlyResults
        };
      });

      // Make sure success rate is a valid number
      const sanitizedSuccessRate = sanitizeNumber(analysis.successRate);
      
      // Sanitize final asset statistics
      const sanitizedAssetStats = {};
      if (analysis.finalAssetStatistics) {
        Object.keys(analysis.finalAssetStatistics).forEach(key => {
          sanitizedAssetStats[key] = sanitizeNumber(analysis.finalAssetStatistics[key]);
        });
      }
      
      const report = new Report({
        name: `${scenario.name || 'Unnamed Scenario'} - ${new Date().toLocaleDateString()}`,
        userId: userData._id || 'guest',
        scenarioId: scenario._id,
        numSimulations,
        numYears,
        financialGoal: sanitizeNumber(scenario.financialGoal) || 0,
        simulationResults: sanitizedResults,
        visualizationData: visualizations,
        successRate: sanitizedSuccessRate,
        finalAssetStatistics: sanitizedAssetStats
      });
      
      await report.save();
      console.log('Report saved with ID:', report._id);
      
      // Return complete report with the report ID
      return {
        ...reportData,
        reportId: report._id
      };
    } catch (error) {
      console.error('Error saving report:', error);
      
      // Return data without saving to database
      return {
        ...reportData,
        reportId: null,
        error: 'Failed to save report to database'
      };
    }
    
  } catch (error) {
    console.error('Error running simulations:', error);
    throw error;
  }
}

/**
 * Run a single simulation for multiple years
 */
function runOneSimulation(baseParams, numYears, simulationIndex) {
  try {
    // If baseParams is undefined, log and provide default params
    if (!baseParams) {
      console.error(`baseParams is undefined in simulation ${simulationIndex}. Using default parameters.`);
      baseParams = {
        startYear: new Date().getFullYear(),
        currentYear: new Date().getFullYear(),
        userAge: 30,
        spouseAge: null,
        isUserAlive: true,
        isSpouseAlive: false,
        inflationAssumption: { type: 'fixed', value: 0.025 },
        taxBrackets: {
          federal: [
            { lowerBound: 0, upperBound: 10275, rate: 0.10 },
            { lowerBound: 10275, upperBound: 41775, rate: 0.12 },
            { lowerBound: 41775, upperBound: 89075, rate: 0.22 },
            { lowerBound: 89075, upperBound: 170050, rate: 0.24 },
            { lowerBound: 170050, upperBound: 215950, rate: 0.32 },
            { lowerBound: 215950, upperBound: 539900, rate: 0.35 },
            { lowerBound: 539900, upperBound: Infinity, rate: 0.37 }
          ],
          state: [],
          capitalGains: [
            { lowerBound: 0, upperBound: 40400, rate: 0.0 },
            { lowerBound: 40400, upperBound: 445850, rate: 0.15 },
            { lowerBound: 445850, upperBound: Infinity, rate: 0.20 }
          ],
          standardDeduction: 12950
        },
        investments: [],
        incomeEvents: [],
        expenses: [],
        financialGoal: 1000000
      };
    }

    // Clone the base parameters to avoid modifying the original
    // Wrap in try/catch to handle any JSON stringify/parse errors
    let params;
    try {
      params = JSON.parse(JSON.stringify(baseParams));
    } catch (error) {
      console.error(`Error cloning parameters in simulation ${simulationIndex}:`, error);
      // Use the original parameters without cloning
      params = baseParams;
    }
    
    // Add some randomness
    randomizeParameters(params, simulationIndex);
    
    // Ensure startYear is initialized
    if (!params.startYear) {
      params.startYear = new Date().getFullYear();
    }
    
    const yearlyResults = [];
    let currentState = null;
    
    // Run simulation year by year
    for (let year = 0; year < numYears; year++) {
      try {
        const currentYear = params.startYear + year;
        
        const yearParams = {
          ...params,
          currentYear,
          prevYear: currentState,
          userAge: params.userAge + year,
          spouseAge: params.spouseAge ? params.spouseAge + year : null
        };
        
        // Simulate this year
        currentState = simulateYear(yearParams);
        
        // Store results for this year
        yearlyResults.push({
          year: currentYear,
          totalAssets: currentState.totalAssets || 0,
          income: currentState.curYearIncome || 0,
          socialSecurity: currentState.curYearSS || 0,
          capitalGains: currentState.curYearGains || 0,
          inflationRate: currentState.inflationRate || 0.025
        });
      } catch (yearError) {
        console.error(`Error simulating year ${params.startYear + year} in simulation ${simulationIndex}:`, yearError);
        
        // If this is the first year and we don't have a currentState yet,
        // create a default one so simulation can continue
        if (year === 0 || !currentState) {
          currentState = {
            totalAssets: params.investments?.reduce((sum, inv) => sum + (inv.value || 0), 0) || 100000,
            curYearIncome: 0,
            curYearSS: 0,
            curYearGains: 0,
            inflationRate: 0.025
          };
        }
        
        // Add an estimate for this year using previous state
        yearlyResults.push({
          year: params.startYear + year,
          totalAssets: currentState.totalAssets * 1.02, // Simple growth estimate
          income: currentState.curYearIncome,
          socialSecurity: currentState.curYearSS,
          capitalGains: currentState.curYearGains,
          inflationRate: 0.025
        });
        
        // Update current state with estimate
        currentState.totalAssets = currentState.totalAssets * 1.02;
      }
    }
    
    return {
      simulationIndex,
      finalState: currentState || { 
        totalAssets: 0,
        curYearIncome: 0,
        curYearSS: 0,
        curYearGains: 0,
        inflationRate: 0.025
      },
      yearlyResults
    };
  } catch (simError) {
    console.error(`Critical error in simulation ${simulationIndex}:`, simError);
    
    // Return a minimal valid simulation result
    return {
      simulationIndex,
      finalState: { 
        totalAssets: 0,
        curYearIncome: 0,
        curYearSS: 0,
        curYearGains: 0,
        inflationRate: 0.025
      },
      yearlyResults: Array.from({ length: numYears }, (_, i) => ({
        year: (new Date().getFullYear()) + i,
        totalAssets: 0,
        income: 0,
        socialSecurity: 0,
        capitalGains: 0,
        inflationRate: 0.025
      }))
    };
  }
}

/**
 * Add randomness to parameters for Monte Carlo simulation
 */
function randomizeParameters(params, seed = 12345) {
  if (!params) {
    console.error('Cannot randomize undefined parameters');
    return params;
  }

  // Use seed for reproducible randomness
  // Make sure we have a numeric seed value
  let seedValue = 12345; // Default seed
  try {
    if (seed !== undefined) {
      // If seed is a number, use it directly
      if (typeof seed === 'number') {
        seedValue = seed;
      } 
      // If seed is a string that can be converted to a number, use that
      else if (typeof seed === 'string' && !isNaN(Number(seed))) {
        seedValue = Number(seed);
      }
      // If seed is an object with toString, convert to string then hash to number
      else if (seed && typeof seed.toString === 'function') {
        const stringValue = seed.toString();
        // Simple string hash to number
        seedValue = Array.from(stringValue).reduce(
          (hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0
        );
      }
    }
  } catch (e) {
    console.warn('Error processing seed value, using default:', e);
  }
  
  // Define a simple random function with the processed seed
  let currentSeed = seedValue;
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  try {
    // Adjust inflation assumption if it exists
    if (params.inflationAssumption) {
      if (params.inflationAssumption.type === 'normal' && 
          params.inflationAssumption.mean !== undefined) {
        // Add small random adjustment to mean
        params.inflationAssumption.mean += (random() * 0.01) - 0.005; // ±0.5%
      }
    }
    
    // Randomize investment returns if investments array exists
    if (params.investments && Array.isArray(params.investments)) {
      params.investments.forEach(inv => {
        if (inv && inv.valueChangeRate) {
          if (inv.valueChangeRate.type === 'normal' && 
              inv.valueChangeRate.mean !== undefined && 
              inv.valueChangeRate.stdDev !== undefined) {
            // Add small random adjustment to mean return
            inv.valueChangeRate.mean += (random() * 0.02) - 0.01; // ±1%
            
            // Add small random adjustment to volatility
            inv.valueChangeRate.stdDev *= 0.8 + (random() * 0.4); // ±20%
          }
        }
      });
    }
    
    // Randomize income growth rates if incomeEvents array exists
    if (params.incomeEvents && Array.isArray(params.incomeEvents)) {
      params.incomeEvents.forEach(event => {
        if (event && event.annualChangeRate && typeof event.annualChangeRate === 'object') {
          if (event.annualChangeRate.type === 'fixed' && 
              event.annualChangeRate.value !== undefined) {
            event.annualChangeRate.value += (random() * 0.01) - 0.005; // ±0.5%
          } else if (event.annualChangeRate.type === 'normal' && 
                    event.annualChangeRate.mean !== undefined) {
            event.annualChangeRate.mean += (random() * 0.01) - 0.005; // ±0.5%
          }
        }
      });
    }
    
    // Randomize expense growth rates for all expense types
    const allExpenses = [
      ...(Array.isArray(params.nonDiscretionaryExpenses) ? params.nonDiscretionaryExpenses : []),
      ...(Array.isArray(params.discretionaryExpenses) ? params.discretionaryExpenses : [])
    ];
    
    allExpenses.forEach(expense => {
      if (expense && expense.annualChangeRate && typeof expense.annualChangeRate === 'object') {
        if (expense.annualChangeRate.type === 'fixed' && 
            expense.annualChangeRate.value !== undefined) {
          expense.annualChangeRate.value += (random() * 0.01) - 0.005; // ±0.5%
        } else if (expense.annualChangeRate.type === 'normal' && 
                  expense.annualChangeRate.mean !== undefined) {
          expense.annualChangeRate.mean += (random() * 0.01) - 0.005; // ±0.5%
        }
      }
    });
    
    return params;
  } catch (error) {
    console.error('Error in randomizeParameters:', error);
    // Return original params on error
    return params;
  }
}

/**
 * Converts a scenario from MongoDB to simulation base parameters
 * @param {Object} scenario - The scenario data from MongoDB
 * @param {Object} userData - User data containing age, spouse age, etc.
 * @param {Object} taxData - Tax brackets and other tax information
 * @returns {Object} - Base parameters for simulation
 */
function createBaseParamsFromScenario(scenario, userData, taxData) {
  console.log('Creating base parameters from scenario:', {
    scenarioId: scenario?._id,
    scenarioName: scenario?.name,
    hasSimulationSettings: !!scenario?.simulationSettings,
    hasInflationAssumption: scenario?.simulationSettings?.inflationAssumption ? true : false,
    hasInvestments: scenario?.investments ? scenario.investments.length : 0,
    userDataPresent: !!userData,
    taxDataPresent: !!taxData
  });

  // Handle nested inflationAssumption in simulationSettings
  const inflationAssumption = scenario.simulationSettings ? 
    scenario.simulationSettings.inflationAssumption : null;
  
  console.log('Processing inflation assumption:', 
    inflationAssumption ? 
    `Type: ${inflationAssumption.method || 'not specified'}` : 
    'Not found');
    
  const baseParams = {
    startYear: new Date().getFullYear(),
    currentYear: new Date().getFullYear(),
    userAge: userData?.age || 30,
    spouseAge: userData?.spouseAge,
    isUserAlive: true,
    isSpouseAlive: userData?.hasSpouse || false,
    inflationAssumption: convertInflationAssumption(inflationAssumption),
    taxBrackets: taxData?.taxBrackets,
    retirementContribLimits: taxData?.retirementContribLimits,
    investments: convertInvestments(scenario?.investments),
    incomeEvents: convertIncomeEvents(scenario?.incomeEvents),
    rmdStrategy: scenario?.simulationSettings ? scenario.simulationSettings.rmdStrategies : [],
    rmdTable: taxData?.rmdTable,
    rothConversionEnabled: scenario?.simulationSettings ? 
      scenario.simulationSettings.rothOptimizerEnable : false,
    rothConversionStrategy: scenario?.simulationSettings ? 
      scenario.simulationSettings.rothConversionStrategies : [],
    nonDiscretionaryExpenses: convertExpenseEvents(scenario?.nonDiscretionaryExpenses),
    discretionaryExpenses: convertExpenseEvents(scenario?.discretionaryExpenses),
    expenseWithdrawalStrategy: scenario?.simulationSettings ? 
      scenario.simulationSettings.expenseWithdrawalStrategies : [],
    investEvents: convertInvestEvents(scenario?.investEvents),
    rebalanceEvents: convertRebalanceEvents(scenario?.rebalanceEvents),
    financialGoal: scenario?.financialGoal || 0
  };
  
  console.log('Created base parameters:', {
    startYear: baseParams.startYear,
    hasInflationAssumption: !!baseParams.inflationAssumption,
    hasTaxBrackets: !!baseParams.taxBrackets,
    investmentCount: baseParams.investments ? baseParams.investments.length : 0,
    incomeEventCount: baseParams.incomeEvents ? baseParams.incomeEvents.length : 0,
    hasRmdTable: !!baseParams.rmdTable,
    financialGoal: baseParams.financialGoal
  });
  
  return baseParams;
}

/**
 * Converts inflation assumption from MongoDB to simulation format
 * @param {Object} inflationAssumption - Inflation assumption from MongoDB
 * @returns {Object} - Simulation-formatted inflation assumption
 */
function convertInflationAssumption(inflationAssumption) {
  if (!inflationAssumption) {
    console.log('No inflation assumption found, using default 2.5% fixed inflation');
    // Default to fixed 2.5% inflation
    return { type: 'fixed', value: 0.025 };
  }
  
  console.log('Converting inflation assumption:', {
    method: inflationAssumption.method || 'unknown',
    hasValue: inflationAssumption.value !== undefined,
    hasMean: inflationAssumption.mean !== undefined,
    hasStdDev: inflationAssumption.stdDev !== undefined
  });

  // Use proper fallback values
  const type = inflationAssumption.method || 'fixed';
  
  // Create a properly structured inflation assumption object
  const result = {
    type: type,
    value: type === 'fixed' ? 
      (inflationAssumption.fixed_percentage || inflationAssumption.value || 0.025) : undefined,
    mean: type === 'normal' ? 
      (inflationAssumption.normal_percentage?.mean || inflationAssumption.mean || 0.025) : undefined,
    stdDev: type === 'normal' ? 
      (inflationAssumption.normal_percentage?.sd || inflationAssumption.stdDev || 0.005) : undefined,
    min: type === 'uniform' ? 
      (inflationAssumption.uniform_percentage?.lower_bound || inflationAssumption.min || 0.02) : undefined,
    max: type === 'uniform' ? 
      (inflationAssumption.uniform_percentage?.upper_bound || inflationAssumption.max || 0.03) : undefined
  };

  console.log('Converted inflation assumption:', result);
  return result;
}

/**
 * Converts investments from MongoDB to simulation format
 * @param {Array} investments - Investments from MongoDB
 * @returns {Array} - Simulation-formatted investments
 */
function convertInvestments(investments) {
  if (!investments || !Array.isArray(investments)) {
    console.log('No investments found or investments is not an array');
    return []; // Return empty array if no investments
  }
  
  console.log(`Converting ${investments.length} investments`);
  
  try {
    const result = investments.map((investment, index) => {
      if (!investment) {
        console.log(`Investment at index ${index} is null or undefined`);
        return null;
      }
      
      // Handle the case where investmentType is an object with fields
      const investmentTypeObj = typeof investment.investmentType === 'object' ? 
        investment.investmentType : { name: 'cash' };
        
      // Extract id safely
      const id = investment._id ? 
        (typeof investment._id === 'string' ? investment._id : investment._id.toString()) : 
        generateUniqueId();
      
      // Create a safe investment object
      return {
        id: id,
        investmentType: investmentTypeObj.name || 'cash',
        taxStatus: investment.accountTaxStatus || investment.taxStatus || 'non-retirement',
        value: investment.value || investment.currentValue || 0,
        purchasePrice: investment.costBasis || investment.purchasePrice || 0,
        incomeRate: convertDistribution(
          investment.incomeRate || 
          (investmentTypeObj.expectedAnnualIncome ? 
            { type: 'fixed', value: investmentTypeObj.expectedAnnualIncome } : null),
          { type: 'fixed', value: 0.01 }
        ),
        valueChangeRate: convertDistribution(
          investment.valueChangeRate || 
          (investmentTypeObj.expectedAnnualReturn ? 
            { type: 'normal', mean: investmentTypeObj.expectedAnnualReturn, stdDev: 0.15 } : null),
          { type: 'normal', mean: 0.07, stdDev: 0.15 }
        ),
        expenseRatio: investment.expenseRatio || investmentTypeObj.expenseRatio || 0.0,
        taxability: investment.taxability || investmentTypeObj.taxability || 'taxable'
      };
    }).filter(Boolean); // Remove any null investments
    
    console.log(`Successfully converted ${result.length} investments`);
    return result;
  } catch (error) {
    console.error('Error converting investments:', error);
    return []; // Return empty array on error
  }
}

/**
 * Converts income events from MongoDB to simulation format
 * @param {Array} incomeEvents - Income events from MongoDB
 * @returns {Array} - Simulation-formatted income events
 */
function convertIncomeEvents(incomeEvents) {
  if (!incomeEvents || !Array.isArray(incomeEvents)) {
    return []; // Return empty array if no income events
  }
  
  return incomeEvents.map(event => ({
    id: event._id.toString() || generateUniqueId(),
    incomeType: event.incomeType || 'salary',
    taxStatus: event.taxStatus || 'taxable',
    initialAmount: event.initialAmount || 0,
    annualChangeRate: convertDistribution(event.annualChangeRate, { type: 'fixed', value: 0.0 }),
    frequency: event.frequency || 'annual',
    startYear: event.startYear,
    endYear: event.endYear,
    inflationAdjusted: event.inflationAdjusted || false,
    userPercentage: event.userPercentage || 0,
    spousePercentage: event.spousePercentage || 0
  }));
}

/**
 * Converts expense events from MongoDB to simulation format
 * @param {Array} expenseEvents - Expense events from MongoDB
 * @returns {Array} - Simulation-formatted expense events
 */
function convertExpenseEvents(expenseEvents) {
  if (!expenseEvents || !Array.isArray(expenseEvents)) {
    return []; // Return empty array if no expense events
  }
  
  return expenseEvents.map(event => ({
    id: event._id.toString() || generateUniqueId(),
    expenseType: event.expenseType || 'housing',
    initialAmount: event.initialAmount || 0,
    annualChangeRate: convertDistribution(event.annualChangeRate, { type: 'fixed', value: 0.0 }),
    frequency: event.frequency || 'annual',
    startYear: event.startYear,
    endYear: event.endYear,
    inflationAdjusted: event.inflationAdjusted || false,
    userPercentage: event.userPercentage || 0,
    spousePercentage: event.spousePercentage || 0
  }));
}

/**
 * Converts invest events from MongoDB to simulation format
 * @param {Array} investEvents - Invest events from MongoDB
 * @returns {Array} - Simulation-formatted invest events
 */
function convertInvestEvents(investEvents) {
  if (!investEvents || !Array.isArray(investEvents)) {
    return []; // Return empty array if no invest events
  }
  
  return investEvents.map(event => ({
    id: event._id.toString() || generateUniqueId(),
    frequency: event.frequency || 'annual',
    startYear: event.startYear,
    endYear: event.endYear,
    maximumCash: event.maximumCash || 10000,
    assetAllocation: convertAssetAllocation(event.assetAllocation)
  }));
}

/**
 * Converts rebalance events from MongoDB to simulation format
 * @param {Array} rebalanceEvents - Rebalance events from MongoDB
 * @returns {Array} - Simulation-formatted rebalance events
 */
function convertRebalanceEvents(rebalanceEvents) {
  if (!rebalanceEvents || !Array.isArray(rebalanceEvents)) {
    return []; // Return empty array if no rebalance events
  }
  
  return rebalanceEvents.map(event => ({
    id: event._id.toString() || generateUniqueId(),
    frequency: event.frequency || 'annual',
    startYear: event.startYear,
    endYear: event.endYear,
    assetAllocation: convertAssetAllocation(event.assetAllocation)
  }));
}

/**
 * Converts asset allocation from MongoDB to simulation format
 * @param {Object} assetAllocation - Asset allocation from MongoDB
 * @returns {Object} - Simulation-formatted asset allocation
 */
function convertAssetAllocation(assetAllocation) {
  if (!assetAllocation || typeof assetAllocation !== 'object') {
    return {}; // Return empty object if no asset allocation
  }
  
  const result = {};
  
  for (const [investmentId, allocation] of Object.entries(assetAllocation)) {
    result[investmentId] = {
      percentage: allocation.percentage || 0,
      type: allocation.type || 'stocks',
      taxStatus: allocation.taxStatus || 'non-retirement'
    };
  }
  
  return result;
}

/**
 * Converts distribution object from MongoDB to simulation format
 * @param {Object} distribution - Distribution from MongoDB
 * @param {Object} defaultDistribution - Default distribution if none provided
 * @returns {Object} - Simulation-formatted distribution
 */
function convertDistribution(distribution, defaultDistribution) {
  if (!distribution || typeof distribution !== 'object') {
    return defaultDistribution; // Return default if no distribution
  }
  
  return {
    type: distribution.type || defaultDistribution.type,
    value: distribution.type === 'fixed' ? distribution.value : undefined,
    mean: distribution.type === 'normal' ? distribution.mean : undefined,
    stdDev: distribution.type === 'normal' ? distribution.stdDev : undefined,
    min: distribution.type === 'uniform' ? distribution.min : undefined,
    max: distribution.type === 'uniform' ? distribution.max : undefined
  };
}

/**
 * Generate unique ID for entities without MongoDB IDs
 * @returns {String} - Unique ID
 */
function generateUniqueId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Sample a value from a distribution
 * @param {Object|Number} distribution - Distribution object or fixed value
 * @returns {Number} - Sampled value
 */
function sampleFromDistribution(distribution) {
  try {
    // If it's a direct number value, return it
    if (typeof distribution === 'number') {
      return isNaN(distribution) ? 0 : distribution;
    }
    
    // If distribution is not an object or is null/undefined, return default
    if (!distribution || typeof distribution !== 'object') {
      console.warn('Invalid distribution object, returning default value 0');
      return 0;
    }
    
    // Handle different distribution types
    if (distribution.type === 'fixed') {
      const value = parseFloat(distribution.value);
      return isNaN(value) ? 0 : value;
    }
    
    if (distribution.type === 'uniform') {
      const min = parseFloat(distribution.min);
      const max = parseFloat(distribution.max);
      
      // Validate min and max
      if (isNaN(min) || isNaN(max)) {
        console.warn('Invalid uniform distribution parameters, returning default value 0');
        return 0;
      }
      
      // If min > max, swap them
      const validMin = Math.min(min, max);
      const validMax = Math.max(min, max);
      
      return validMin + Math.random() * (validMax - validMin);
    }
    
    if (distribution.type === 'normal') {
      const mean = parseFloat(distribution.mean);
      const stdDev = parseFloat(distribution.stdDev);
      
      // Validate mean and stdDev
      if (isNaN(mean)) {
        //console.warn('Invalid normal distribution mean, returning default value 0');
        return 0;
      }
      
      // If stdDev is invalid or negative, use a small positive value
      const validStdDev = isNaN(stdDev) || stdDev <= 0 ? 0.01 : stdDev;
      
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const result = mean + validStdDev * z;
      
      // Check if result is NaN (possible with very extreme values)
      return isNaN(result) ? mean : result;
    }
    
    // If we reach here, the distribution type is unknown or not properly specified
    console.warn(`Unknown distribution type ${distribution.type}, returning default value 0`);
    return 0;
  } catch (error) {
    console.error('Error in sampleFromDistribution:', error);
    return 0; // Default fallback
  }
}

// Helper conversion functions for processing MongoDB data
function convertTaxBrackets(taxData, userState, scenarioType) {
  if (!taxData) {
    // Fallback default tax brackets
    return {
      federal: [
        { lowerBound: 0, upperBound: 10000, rate: 0.10 },
        { lowerBound: 10000, upperBound: 50000, rate: 0.15 },
        { lowerBound: 50000, upperBound: 100000, rate: 0.25 },
        { lowerBound: 100000, upperBound: Infinity, rate: 0.32 }
      ],
      state: [],
      capitalGains: [
        { lowerBound: 0, upperBound: 40000, rate: 0.0 },
        { lowerBound: 40000, upperBound: 441450, rate: 0.15 },
        { lowerBound: 441450, upperBound: Infinity, rate: 0.20 }
      ],
      standardDeduction: 12950
    };
  }

  // Filing status based on scenario type
  const isSingle = scenarioType !== 'married';
  
  try {
    // Convert federal brackets
    const federalBrackets = taxData.federal.brackets.map(bracket => ({
      lowerBound: bracket.min,
      upperBound: bracket.max === Number.MAX_VALUE ? Infinity : bracket.max,
      rate: bracket.rate
    }));
    
    // Convert state brackets if available
    let stateBrackets = [];
    if (taxData.state && taxData.state.get(userState)) {
      stateBrackets = taxData.state.get(userState).brackets.map(bracket => ({
        lowerBound: bracket.min,
        upperBound: bracket.max === Number.MAX_VALUE ? Infinity : bracket.max,
        rate: bracket.rate
      }));
    }
    
    // Convert capital gains brackets
    const capitalGainsBrackets = [];
    const thresholds = taxData.federal.capitalGains.thresholds;
    const rates = taxData.federal.capitalGains.rates;
    
    for (let i = 0; i < rates.length; i++) {
      const lowerBound = i === 0 ? 0 : thresholds[i - 1];
      const upperBound = i === rates.length - 1 ? Infinity : thresholds[i];
      
      capitalGainsBrackets.push({
        lowerBound,
        upperBound,
        rate: rates[i]
      });
    }
    
    // Set standard deduction based on filing status
    const standardDeduction = isSingle 
      ? taxData.federal.standardDeductions.single 
      : taxData.federal.standardDeductions.married;
    
    return {
      federal: federalBrackets,
      state: stateBrackets,
      capitalGains: capitalGainsBrackets,
      standardDeduction
    };
  } catch (error) {
    console.error('Error converting tax brackets:', error);
    // Return fallback values if conversion fails
    return {
      federal: [
        { lowerBound: 0, upperBound: 10000, rate: 0.10 },
        { lowerBound: 10000, upperBound: 50000, rate: 0.15 },
        { lowerBound: 50000, upperBound: 100000, rate: 0.25 },
        { lowerBound: 100000, upperBound: Infinity, rate: 0.32 }
      ],
      state: [],
      capitalGains: [
        { lowerBound: 0, upperBound: 40000, rate: 0.0 },
        { lowerBound: 40000, upperBound: 441450, rate: 0.15 },
        { lowerBound: 441450, upperBound: Infinity, rate: 0.20 }
      ],
      standardDeduction: 12950
    };
  }
}

function convertRmdTable(rmdTableData) {
  const rmdTable = {};
  
  if (!rmdTableData || !Array.isArray(rmdTableData)) {
    // Fallback default RMD table
    for (let age = 74; age <= 100; age++) {
      rmdTable[age] = 100 / (100 - age + 20); // Simple approximation
    }
    return rmdTable;
  }
  
  try {
    rmdTableData.forEach(entry => {
      if (typeof entry === 'object') {
        Object.entries(entry).forEach(([ageStr, factor]) => {
          const age = parseInt(ageStr);
          if (!isNaN(age)) {
            rmdTable[age] = factor;
          }
        });
      }
    });
    
    return rmdTable;
  } catch (error) {
    console.error('Error converting RMD table:', error);
    // Return fallback values
    for (let age = 74; age <= 100; age++) {
      rmdTable[age] = 100 / (100 - age + 20); // Simple approximation
    }
    return rmdTable;
  }
}

/**
 * Simulates a single year of financial activity
 * @param {Object} params - Parameters for the simulation
 * @returns {Object} - Updated state after processing the year
 */
function simulateYear(params) {
  // Clone the state to avoid modifying the input
  const state = JSON.parse(JSON.stringify(params));
  
  // Extract parameters
  const {
    currentYear,
    prevYear,
    userAge,
    spouseAge,
    isUserAlive,
    isSpouseAlive,
    inflationAssumption,
    taxBrackets,
    retirementContribLimits,
    investments,
    incomeEvents,
    rmdStrategy,
    rmdTable,
    rothConversionEnabled,
    rothConversionStrategy,
    nonDiscretionaryExpenses,
    discretionaryExpenses,
    expenseWithdrawalStrategy,
    investEvents,
    rebalanceEvents,
    financialGoal
  } = state;

  // Provide default values if any critical parameters are missing
  const defaultTaxBrackets = {
    federal: [
      { lowerBound: 0, upperBound: 10275, rate: 0.10 },
      { lowerBound: 10275, upperBound: 41775, rate: 0.12 },
      { lowerBound: 41775, upperBound: 89075, rate: 0.22 },
      { lowerBound: 89075, upperBound: 170050, rate: 0.24 },
      { lowerBound: 170050, upperBound: 215950, rate: 0.32 },
      { lowerBound: 215950, upperBound: 539900, rate: 0.35 },
      { lowerBound: 539900, upperBound: Infinity, rate: 0.37 }
    ],
    state: [],
    capitalGains: [
      { lowerBound: 0, upperBound: 40400, rate: 0.0 },
      { lowerBound: 40400, upperBound: 445850, rate: 0.15 },
      { lowerBound: 445850, upperBound: Infinity, rate: 0.20 }
    ],
    standardDeduction: 12950
  };

  const defaultRetirementContribLimits = {
    preTax: 20500,
    afterTax: 6000
  };

  // Initialize running totals for the current year
  let curYearIncome = 0;
  let curYearSS = 0;
  let curYearGains = 0;
  let curYearEarlyWithdrawals = 0;
  
  // Get previous year state
  const {
    curYearIncome: prevYearIncome = 0,
    curYearSS: prevYearSS = 0,
    curYearGains: prevYearGains = 0,
    curYearEarlyWithdrawals: prevYearEarlyWithdrawals = 0,
    inflationRate: prevYearInflationRate = 0,
    taxBrackets: prevYearTaxBrackets = (taxBrackets || defaultTaxBrackets),
    retirementContribLimits: prevYearRetirementContribLimits = (retirementContribLimits || defaultRetirementContribLimits)
  } = prevYear || {};

  // Store the cash investment reference for easier access
  let cashInvestment = findInvestmentByType(investments, "cash", "non-retirement");
  if (!cashInvestment) {
    // Create cash investment if it doesn't exist
    cashInvestment = {
      id: 'cash_' + Date.now(),
      investmentType: 'cash',
      taxStatus: 'non-retirement',
      value: 0,
      purchasePrice: 0,
      incomeRate: { type: 'fixed', value: 0.01 },
      valueChangeRate: { type: 'fixed', value: 0 },
      expenseRatio: 0.0,
      taxability: 'taxable'
    };
    investments.push(cashInvestment);
  }

  // Calculate inflation rate for this year
  let inflationRate = 0.025; // Default 2.5% inflation
  try {
    if (inflationAssumption) {
      if (inflationAssumption.type === 'fixed') {
        inflationRate = parseFloat(inflationAssumption.value);
      } else if (inflationAssumption.type === 'normal') {
        inflationRate = sampleFromDistribution({
          type: 'normal',
          mean: inflationAssumption.mean,
          stdDev: inflationAssumption.stdDev
        });
      } else if (inflationAssumption.type === 'uniform') {
        inflationRate = sampleFromDistribution({
          type: 'uniform',
          min: inflationAssumption.min,
          max: inflationAssumption.max
        });
      } else if (inflationAssumption.type === 'fixed_percentage') {
        // Fixed percentage may be stored in different places
        if (typeof inflationAssumption.fixed_percentage === 'number') {
          inflationRate = inflationAssumption.fixed_percentage;
        } else if (typeof inflationAssumption.value === 'number') {
          inflationRate = inflationAssumption.value;
        } else {
          //console.warn('fixed_percentage has no valid numeric value, using default 2.5%');
          inflationRate = 0.025;
        }
      } else if (inflationAssumption.method === 'fixed_percentage') {
        // Alternative property structure
        if (typeof inflationAssumption.fixed_percentage === 'number') {
          inflationRate = inflationAssumption.fixed_percentage;
        } else if (typeof inflationAssumption.value === 'number') {
          inflationRate = inflationAssumption.value;
        } else {
          console.warn('fixed_percentage method has no valid numeric value, using default 2.5%');
          inflationRate = 0.025;
        }
      } else if (inflationAssumption.method === 'normal_percentage') {
        inflationRate = sampleFromDistribution({
          type: 'normal',
          mean: inflationAssumption.normal_percentage?.mean || 0.025,
          stdDev: inflationAssumption.normal_percentage?.sd || 0.005
        });
      } else if (inflationAssumption.method === 'uniform_percentage') {
        inflationRate = sampleFromDistribution({
          type: 'uniform',
          min: inflationAssumption.uniform_percentage?.lower_bound || 0.02,
          max: inflationAssumption.uniform_percentage?.upper_bound || 0.03
        });
      }
    }
    
    // Ensure inflation rate is reasonable and a valid number
    if (typeof inflationRate !== 'number' || isNaN(inflationRate)) {
      console.warn('Inflation rate is not a valid number:', inflationRate);
      inflationRate = 0.025; // Default fallback
    }
    
    // Cap inflation rate between 0% and 15%
    inflationRate = Math.max(0, Math.min(0.15, inflationRate));
  } catch (error) {
    console.error('Error calculating inflation rate:', error, 'inflationAssumption:', inflationAssumption);
    inflationRate = 0.025; // Fallback to 2.5% inflation
  }
  
  // 0. Preliminaries
  // a. Compute inflation-adjusted tax brackets
  const adjustedTaxBrackets = adjustTaxBrackets(prevYearTaxBrackets, inflationRate);
  
  // c. Compute inflation-adjusted retirement contribution limits
  const adjustedRetirementContribLimits = adjustRetirementContribLimits(
    prevYearRetirementContribLimits, 
    inflationRate
  );

  // 1. Run income events
  if (incomeEvents) {
    for (const event of incomeEvents) {
      // Skip if event is not for this year
      if (!isEventForYear(event, currentYear)) continue;
      
      // a. Update amount based on expected annual change
      const prevAmount = event.prevAmount || event.initialAmount;
      let amount = prevAmount * (1 + sampleFromDistribution(event.annualChangeRate));
      event.prevAmount = amount; // Store for next year
      
      // b. Adjust for inflation if needed
      if (event.inflationAdjusted) {
        amount *= (1 + inflationRate);
      }
      
      // c. Adjust for user/spouse death
      if (!isUserAlive && event.userPercentage) {
        amount *= (1 - event.userPercentage);
      }
      if (!isSpouseAlive && event.spousePercentage) {
        amount *= (1 - event.spousePercentage);
      }
      
      // d. Add income to cash investment
      cashInvestment.value += amount;
      
      // e. Update curYearIncome if not pre-tax
      if (event.taxStatus !== "pre-tax") {
        curYearIncome += amount;
      }
      
      // f. Update curYearSS if social security
      if (event.incomeType === "social security") {
        curYearSS += amount;
      }
    }
  }

  // 2. Perform RMD for the previous year if applicable
  if (userAge >= 74) {
    // Check if there are pre-tax investments with positive value
    const preTaxInvestments = investments.filter(inv => 
      inv.taxStatus === "pre-tax" && inv.value > 0
    );
    
    if (preTaxInvestments.length > 0) {
      // a. Look up distribution period
      const distributionPeriod = lookupRMDDistributionPeriod(rmdTable, userAge);
      
      // b. Sum pre-tax investment values
      const preTaxTotal = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
      
      // c. Calculate RMD
      const rmd = preTaxTotal / distributionPeriod;
      
      // d. Add to current year income
      curYearIncome += rmd;
      
      // e. Transfer investments according to RMD strategy
      let remainingRMD = rmd;
      for (const investmentId of rmdStrategy) {
        const sourceInvestment = findInvestmentById(investments, investmentId);
        
        // Skip if not found or not pre-tax or no value
        if (!sourceInvestment || sourceInvestment.taxStatus !== "pre-tax" || sourceInvestment.value <= 0) {
          continue;
        }
        
        // Amount to transfer (either full investment or remaining RMD)
        const transferAmount = Math.min(sourceInvestment.value, remainingRMD);
        
        // f. Transfer in-kind
        transferInvestmentInKind(
          investments,
          sourceInvestment,
          "non-retirement",
          transferAmount
        );
        
        remainingRMD -= transferAmount;
        
        // Stop if RMD requirement met
        if (remainingRMD <= 0) break;
      }
    }
  }

  // 3. Update investment values
  for (const investment of investments) {
    // Skip if no longer exists
    if (investment.value <= 0) continue;
    
    // Store initial value for expense calculation
    const initialValue = investment.value;
    
    // a. Calculate generated income
    const generatedIncome = investment.value * sampleFromDistribution(investment.incomeRate);
    
    // b. Add to curYearIncome if applicable
    if (investment.taxStatus === 'non-retirement' && investment.taxability === 'taxable') {
      curYearIncome += generatedIncome;
    }
    
    // c. Add income to the investment value
    investment.value += generatedIncome;
    
    // d. Calculate value change
    const valueChange = investment.value * sampleFromDistribution(investment.valueChangeRate);
    investment.value += valueChange;
    
    // e. Calculate and subtract expenses
    const avgValue = (initialValue + investment.value) / 2;
    const expenses = avgValue * (investment.expenseRatio || 0);
    investment.value -= expenses;
  }

  // 4. Run Roth conversion optimizer if enabled
  if (rothConversionEnabled) {
    // a. Find current tax bracket
    const curYearFedTaxableIncome = curYearIncome - 0.15 * curYearSS;
    const { bracket, upperLimit } = findTaxBracket(adjustedTaxBrackets.federal, curYearFedTaxableIncome);
    
    // b. Calculate Roth conversion amount
    const rothConversionAmount = Math.max(0, upperLimit - curYearFedTaxableIncome);
    
    if (rothConversionAmount > 0 && rothConversionAmount < 1000000) { // Add safety cap
      // c. Transfer investments according to Roth conversion strategy
      let remainingRothConversion = rothConversionAmount;
      
      for (const investmentId of rothConversionStrategy) {
        const sourceInvestment = findInvestmentById(investments, investmentId);
        
        // Skip if not found or not pre-tax or no value
        if (!sourceInvestment || sourceInvestment.taxStatus !== "pre-tax" || sourceInvestment.value <= 0) {
          continue;
        }
        
        // Amount to transfer
        const transferAmount = Math.min(sourceInvestment.value, remainingRothConversion);
        
        // Transfer in-kind
        transferInvestmentInKind(
          investments,
          sourceInvestment,
          "after-tax retirement",
          transferAmount
        );
        
        remainingRothConversion -= transferAmount;
        
        // Stop if Roth conversion requirement met
        if (remainingRothConversion <= 0) break;
      }
      
      // d. Add to current year income
      curYearIncome += rothConversionAmount;
      
      // e. Update early withdrawals if applicable
      if (userAge < 59) {
        curYearEarlyWithdrawals += rothConversionAmount;
      }
    }
  }

  // 5. Pay non-discretionary expenses and previous year's taxes
  // a. Calculate previous year's federal and state income tax
  const prevYearFedTaxableIncome = prevYearIncome - 0.15 * prevYearSS;
  const federalIncomeTax = calculateIncomeTax(
    prevYearTaxBrackets.federal, 
    prevYearFedTaxableIncome
  );
  
  const stateIncomeTax = calculateIncomeTax(
    prevYearTaxBrackets.state, 
    prevYearIncome
  );
  
  // b. Calculate previous year's capital gains tax
  const capitalGainsTax = calculateCapitalGainsTax(
    prevYearTaxBrackets.capitalGains,
    prevYearGains
  );
  
  // c. Calculate previous year's early withdrawal tax
  const earlyWithdrawalTax = prevYearEarlyWithdrawals * 0.1; // 10% penalty
  
  // d. Total payment amount
  const nonDiscretionaryExpenseAmount = calculateExpenseAmount(
    nonDiscretionaryExpenses, 
    currentYear, 
    inflationRate, 
    isUserAlive, 
    isSpouseAlive
  );
  
  const totalTaxes = federalIncomeTax + stateIncomeTax + capitalGainsTax + earlyWithdrawalTax;
  const totalPaymentAmount = nonDiscretionaryExpenseAmount + totalTaxes;
  
  // e. Calculate withdrawal amount needed
  const withdrawalAmount = Math.max(0, totalPaymentAmount - cashInvestment.value);
  
  // f. Sell investments according to expense withdrawal strategy
  if (withdrawalAmount > 0) {
    let remainingWithdrawal = withdrawalAmount;
    
    for (const investmentId of expenseWithdrawalStrategy) {
      const investmentToSell = findInvestmentById(investments, investmentId);
      
      // Skip if not found or no value
      if (!investmentToSell || investmentToSell.value <= 0) {
        continue;
      }
      
      // Amount to sell (either full investment or remaining withdrawal amount)
      const saleAmount = Math.min(investmentToSell.value, remainingWithdrawal);
      const saleRatio = saleAmount / investmentToSell.value;
      
      // i. Compute capital gains
      if (investmentToSell.taxStatus !== "pre-tax") {
        const purchasePrice = investmentToSell.purchasePrice || 0;
        const capitalGain = saleRatio * (investmentToSell.value - purchasePrice);
        curYearGains += capitalGain;
      }
      
      // iii. Update curYearIncome for pre-tax withdrawals
      if (investmentToSell.taxStatus === "pre-tax") {
        curYearIncome += saleAmount;
      }
      
      // iv. Update early withdrawals if applicable
      if ((investmentToSell.taxStatus === "pre-tax" || investmentToSell.taxStatus === "after-tax retirement") 
          && userAge < 59) {
        curYearEarlyWithdrawals += saleAmount;
      }
      
      // Reduce investment value
      investmentToSell.value -= saleAmount;
      if (investmentToSell.purchasePrice) {
        investmentToSell.purchasePrice *= (1 - saleRatio);
      }
      
      // Add to cash
      cashInvestment.value += saleAmount;
      remainingWithdrawal -= saleAmount;
      
      // Stop if withdrawal requirement met
      if (remainingWithdrawal <= 0) break;
    }
  }
  
  // Pay the expenses from cash
  cashInvestment.value -= Math.min(cashInvestment.value, totalPaymentAmount);

  // 6. Pay discretionary expenses
  // Calculate total assets
  const totalAssets = calculateTotalAssets(investments);
  
  for (const expense of discretionaryExpenses || []) {
    // Skip if not for this year
    if (!isEventForYear(expense, currentYear)) continue;
    
    // Calculate expense amount
    let amount = expense.prevAmount || expense.initialAmount;
    amount *= (1 + sampleFromDistribution(expense.annualChangeRate));
    expense.prevAmount = amount;
    
    if (expense.inflationAdjusted) {
      amount *= (1 + inflationRate);
    }
    
    if (!isUserAlive && expense.userPercentage) {
      amount *= (1 - expense.userPercentage);
    }
    if (!isSpouseAlive && expense.spousePercentage) {
      amount *= (1 - expense.spousePercentage);
    }
    
    // Check if paying would violate financial goal
    const potentialNewTotal = totalAssets - amount;
    if (potentialNewTotal < financialGoal) {
      // Calculate partial payment
      const affordableAmount = Math.max(0, totalAssets - financialGoal);
      amount = Math.min(amount, affordableAmount);
      
      // Skip if can't afford any
      if (amount <= 0) continue;
    }
    
    // Calculate withdrawal needed
    const withdrawalNeeded = Math.max(0, amount - cashInvestment.value);
    
    // Sell investments if needed
    if (withdrawalNeeded > 0) {
      let remainingWithdrawal = withdrawalNeeded;
      
      for (const investmentId of expenseWithdrawalStrategy) {
        const investmentToSell = findInvestmentById(investments, investmentId);
        
        // Skip if not found or no value
        if (!investmentToSell || investmentToSell.value <= 0) {
          continue;
        }
        
        // Amount to sell
        const saleAmount = Math.min(investmentToSell.value, remainingWithdrawal);
        const saleRatio = saleAmount / investmentToSell.value;
        
        // Compute capital gains
        if (investmentToSell.taxStatus !== "pre-tax") {
          const purchasePrice = investmentToSell.purchasePrice || 0;
          const capitalGain = saleRatio * (investmentToSell.value - purchasePrice);
          curYearGains += capitalGain;
        }
        
        // Update curYearIncome for pre-tax withdrawals
        if (investmentToSell.taxStatus === "pre-tax") {
          curYearIncome += saleAmount;
        }
        
        // Update early withdrawals if applicable
        if ((investmentToSell.taxStatus === "pre-tax" || investmentToSell.taxStatus === "after-tax retirement") 
            && userAge < 59) {
          curYearEarlyWithdrawals += saleAmount;
        }
        
        // Reduce investment value
        investmentToSell.value -= saleAmount;
        if (investmentToSell.purchasePrice) {
          investmentToSell.purchasePrice *= (1 - saleRatio);
        }
        
        // Add to cash
        cashInvestment.value += saleAmount;
        remainingWithdrawal -= saleAmount;
        
        // Stop if withdrawal requirement met
        if (remainingWithdrawal <= 0) break;
      }
    }
    
    // Pay the expense from cash
    cashInvestment.value -= Math.min(cashInvestment.value, amount);
  }

  // 7. Run invest events
  const investEvent = findEventForYear(investEvents, currentYear);
  if (investEvent && cashInvestment.value > 0) {
    const excessCash = Math.max(0, cashInvestment.value - (investEvent.maximumCash || 0));
    
    if (excessCash > 0) {
      // Calculate purchase amounts based on allocation
      const purchases = calculatePurchaseAmounts(
        investEvent.assetAllocation, 
        excessCash
      );
      
      // Adjust for retirement contribution limits
      const preTaxPurchases = purchases.filter(p => p.taxStatus === "pre-tax");
      const afterTaxPurchases = purchases.filter(p => p.taxStatus === "after-tax retirement");
      const nonRetirementPurchases = purchases.filter(p => p.taxStatus === "non-retirement");
      
      const totalPreTaxPurchase = preTaxPurchases.reduce((sum, p) => sum + p.amount, 0);
      const totalAfterTaxPurchase = afterTaxPurchases.reduce((sum, p) => sum + p.amount, 0);
      
      // a. Handle pre-tax contribution limits
      if (totalPreTaxPurchase > adjustedRetirementContribLimits.preTax) {
        const scaleFactor = adjustedRetirementContribLimits.preTax / totalPreTaxPurchase;
        
        // Scale down pre-tax purchases
        preTaxPurchases.forEach(p => {
          p.amount *= scaleFactor;
        });
        
        // Scale up non-retirement purchases
        const excess = totalPreTaxPurchase - adjustedRetirementContribLimits.preTax;
        if (nonRetirementPurchases.length > 0 && excess > 0) {
          const totalNonRetirementPurchase = nonRetirementPurchases.reduce((sum, p) => sum + p.amount, 0);
          const nonRetirementScaleFactor = (totalNonRetirementPurchase + excess) / totalNonRetirementPurchase;
          
          nonRetirementPurchases.forEach(p => {
            p.amount *= nonRetirementScaleFactor;
          });
        }
      }
      
      // b. Handle after-tax contribution limits
      if (totalAfterTaxPurchase > adjustedRetirementContribLimits.afterTax) {
        const scaleFactor = adjustedRetirementContribLimits.afterTax / totalAfterTaxPurchase;
        
        // Scale down after-tax purchases
        afterTaxPurchases.forEach(p => {
          p.amount *= scaleFactor;
        });
        
        // Scale up non-retirement purchases
        const excess = totalAfterTaxPurchase - adjustedRetirementContribLimits.afterTax;
        if (nonRetirementPurchases.length > 0 && excess > 0) {
          const totalNonRetirementPurchase = nonRetirementPurchases.reduce((sum, p) => sum + p.amount, 0);
          const nonRetirementScaleFactor = (totalNonRetirementPurchase + excess) / totalNonRetirementPurchase;
          
          nonRetirementPurchases.forEach(p => {
            p.amount *= nonRetirementScaleFactor;
          });
        }
      }
      
      // Combine all purchases back
      const allPurchases = [...preTaxPurchases, ...afterTaxPurchases, ...nonRetirementPurchases];
      const totalPurchaseAmount = allPurchases.reduce((sum, p) => sum + p.amount, 0);
      
      // Make the purchases
      for (const purchase of allPurchases) {
        const existingInvestment = findInvestmentByType(
          investments, 
          purchase.investmentType, 
          purchase.taxStatus
        );
        
        if (existingInvestment) {
          // Add to existing investment
          existingInvestment.value += purchase.amount;
          existingInvestment.purchasePrice = (existingInvestment.purchasePrice || 0) + purchase.amount;
        } else {
          // Create new investment
          investments.push({
            id: generateUniqueId(),
            investmentType: purchase.investmentType,
            taxStatus: purchase.taxStatus,
            value: purchase.amount,
            purchasePrice: purchase.amount,
            incomeRate: getDefaultIncomeRate(purchase.investmentType),
            valueChangeRate: getDefaultValueChangeRate(purchase.investmentType),
            expenseRatio: getDefaultExpenseRatio(purchase.investmentType),
            taxability: getDefaultTaxability(purchase.investmentType)
          });
        }
      }
      
      // Subtract from cash
      cashInvestment.value -= totalPurchaseAmount;
    }
  }

  // 8. Run rebalance events
  const rebalanceEvent = findEventForYear(rebalanceEvents, currentYear);
  if (rebalanceEvent) {
    // Calculate total portfolio value
    const totalPortfolioValue = calculateTotalAssets(investments);
    
    // Calculate target values based on allocation
    const targetValues = {};
    for (const [investmentId, percentage] of Object.entries(rebalanceEvent.assetAllocation)) {
      targetValues[investmentId] = totalPortfolioValue * (percentage / 100);
    }
    
    // Determine which investments to sell and buy
    const investmentsToSell = [];
    const investmentsToBuy = [];
    
    for (const [investmentId, targetValue] of Object.entries(targetValues)) {
      const investment = findInvestmentById(investments, investmentId);
      
      if (!investment) continue;
      
      const currentValue = investment.value;
      const difference = targetValue - currentValue;
      
      if (difference < 0) {
        // Sell
        investmentsToSell.push({
          investment,
          amount: Math.abs(difference)
        });
      } else if (difference > 0) {
        // Buy
        investmentsToBuy.push({
          investment,
          amount: difference
        });
      }
    }
    
    // Process sales first
    let totalCashFromSales = 0;
    for (const { investment, amount } of investmentsToSell) {
      const saleRatio = amount / investment.value;
      
      // Update capital gains if not pre-tax
      if (investment.taxStatus !== "pre-tax") {
        const purchasePrice = investment.purchasePrice || 0;
        const capitalGain = saleRatio * (investment.value - purchasePrice);
        curYearGains += capitalGain;
      }
      
      // Reduce investment value
      investment.value -= amount;
      if (investment.purchasePrice) {
        investment.purchasePrice *= (1 - saleRatio);
      }
      
      // Add to cash for purchases
      totalCashFromSales += amount;
    }
    
    // Process purchases
    const totalPurchaseNeeded = investmentsToBuy.reduce((sum, item) => sum + item.amount, 0);
    
    if (totalPurchaseNeeded > 0 && totalCashFromSales > 0) {
      // Scale purchases if needed
      const scaleFactor = Math.min(1, totalCashFromSales / totalPurchaseNeeded);
      
      for (const { investment, amount } of investmentsToBuy) {
        const purchaseAmount = amount * scaleFactor;
        
        // Add to investment value
        investment.value += purchaseAmount;
        investment.purchasePrice = (investment.purchasePrice || 0) + purchaseAmount;
        
        // Reduce available cash
        totalCashFromSales -= purchaseAmount;
      }
    }
    
    // Add any remaining cash to cash investment
    if (totalCashFromSales > 0) {
      cashInvestment.value += totalCashFromSales;
    }
  }

  // Return updated state and metrics
  return {
    investments,
    inflationRate,
    taxBrackets: adjustedTaxBrackets,
    retirementContribLimits: adjustedRetirementContribLimits,
    curYearIncome,
    curYearSS,
    curYearGains,
    curYearEarlyWithdrawals,
    totalAssets: calculateTotalAssets(investments)
  };
}

// Additional helper functions for simulateYear

/**
 * Adjust tax brackets for inflation
 * @param {Object} taxBrackets - Previous year's tax brackets
 * @param {Number} inflationRate - Current year's inflation rate
 * @returns {Object} - Inflation-adjusted tax brackets
 */
function adjustTaxBrackets(taxBrackets, inflationRate) {
  const adjusted = JSON.parse(JSON.stringify(taxBrackets));
  
  // Adjust federal brackets
  adjusted.federal = adjusted.federal.map(bracket => ({
    ...bracket,
    lowerBound: bracket.lowerBound * (1 + inflationRate),
    upperBound: bracket.upperBound === Infinity ? Infinity : bracket.upperBound * (1 + inflationRate)
  }));
  
  // Adjust state brackets
  adjusted.state = adjusted.state.map(bracket => ({
    ...bracket,
    lowerBound: bracket.lowerBound * (1 + inflationRate),
    upperBound: bracket.upperBound === Infinity ? Infinity : bracket.upperBound * (1 + inflationRate)
  }));
  
  // Adjust capital gains brackets
  adjusted.capitalGains = adjusted.capitalGains.map(bracket => ({
    ...bracket,
    lowerBound: bracket.lowerBound * (1 + inflationRate),
    upperBound: bracket.upperBound === Infinity ? Infinity : bracket.upperBound * (1 + inflationRate)
  }));
  
  // Adjust standard deduction
  adjusted.standardDeduction *= (1 + inflationRate);
  
  return adjusted;
}

/**
 * Adjust retirement contribution limits for inflation
 * @param {Object} limits - Previous year's contribution limits
 * @param {Number} inflationRate - Current year's inflation rate
 * @returns {Object} - Inflation-adjusted contribution limits
 */
function adjustRetirementContribLimits(limits, inflationRate) {
  return {
    preTax: limits.preTax * (1 + inflationRate),
    afterTax: limits.afterTax * (1 + inflationRate)
  };
}

/**
 * Find an investment by its ID
 * @param {Array} investments - List of investments
 * @param {String} id - Investment ID to find
 * @returns {Object|null} - Found investment or null
 */
function findInvestmentById(investments, id) {
  return investments.find(inv => inv.id === id) || null;
}

/**
 * Find an investment by type and tax status
 * @param {Array} investments - List of investments
 * @param {String} type - Investment type
 * @param {String} taxStatus - Tax status
 * @returns {Object|null} - Found investment or null
 */
function findInvestmentByType(investments, type, taxStatus) {
  return investments.find(inv => inv.investmentType === type && inv.taxStatus === taxStatus) || null;
}

/**
 * Transfer investment in-kind
 * @param {Array} investments - List of all investments
 * @param {Object} sourceInvestment - Source investment
 * @param {String} targetTaxStatus - Target tax status
 * @param {Number} amount - Amount to transfer
 */
function transferInvestmentInKind(investments, sourceInvestment, targetTaxStatus, amount) {
  // Reduce source investment value
  sourceInvestment.value -= amount;
  
  // Find or create target investment
  const targetInvestment = findInvestmentByType(
    investments, 
    sourceInvestment.investmentType, 
    targetTaxStatus
  );
  
  if (targetInvestment) {
    // Add to existing investment
    targetInvestment.value += amount;
  } else {
    // Create new investment
    investments.push({
      id: generateUniqueId(),
      investmentType: sourceInvestment.investmentType,
      taxStatus: targetTaxStatus,
      value: amount,
      purchasePrice: amount, // New basis for the transferred amount
      incomeRate: sourceInvestment.incomeRate,
      valueChangeRate: sourceInvestment.valueChangeRate,
      expenseRatio: sourceInvestment.expenseRatio,
      taxability: sourceInvestment.taxability
    });
  }
}

/**
 * Look up RMD distribution period from table
 * @param {Object} rmdTable - RMD table mapping age to distribution period
 * @param {Number} age - User's age
 * @returns {Number} - Distribution period
 */
function lookupRMDDistributionPeriod(rmdTable, age) {
  return rmdTable[age] || 20; // Default fallback
}

/**
 * Find tax bracket for an income amount
 * @param {Array} brackets - Tax brackets
 * @param {Number} income - Income amount
 * @returns {Object} - Bracket info including rate and upper limit
 */
function findTaxBracket(brackets, income) {
  for (const bracket of brackets) {
    if (income >= bracket.lowerBound && income <= bracket.upperBound) {
      return {
        bracket,
        upperLimit: bracket.upperBound === Infinity ? 1000000000 : bracket.upperBound
      };
    }
  }
  
  // Default to highest bracket with a maximum limit
  const highestBracket = brackets[brackets.length - 1];
  return {
    bracket: highestBracket,
    upperLimit: highestBracket.upperBound === Infinity ? 1000000000 : highestBracket.upperBound
  };
}

/**
 * Calculate income tax
 * @param {Array} brackets - Tax brackets
 * @param {Number} income - Taxable income
 * @returns {Number} - Tax amount
 */
function calculateIncomeTax(brackets, income) {
  let tax = 0;
  let remainingIncome = income;
  
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const prevUpperBound = i > 0 ? brackets[i-1].upperBound : 0;
    const taxableInThisBracket = Math.min(
      bracket.upperBound === Infinity ? remainingIncome : bracket.upperBound - prevUpperBound,
      Math.max(0, remainingIncome)
    );
    
    tax += taxableInThisBracket * bracket.rate;
    remainingIncome -= taxableInThisBracket;
    
    if (remainingIncome <= 0) break;
  }
  
  return tax;
}

/**
 * Calculate capital gains tax
 * @param {Array} brackets - Capital gains tax brackets
 * @param {Number} gains - Capital gains amount
 * @returns {Number} - Tax amount
 */
function calculateCapitalGainsTax(brackets, gains) {
  // Capital gains tax cannot be negative
  if (gains <= 0) return 0;
  
  return calculateIncomeTax(brackets, gains);
}

/**
 * Calculate expense amount for the current year
 * @param {Array} expenses - Expense events
 * @param {Number} currentYear - Current simulated year
 * @param {Number} inflationRate - Current year's inflation rate
 * @param {Boolean} isUserAlive - Whether user is alive
 * @param {Boolean} isSpouseAlive - Whether spouse is alive
 * @returns {Number} - Total expense amount
 */
function calculateExpenseAmount(expenses, currentYear, inflationRate, isUserAlive, isSpouseAlive) {
  let total = 0;
  
  if (!expenses) return total;
  
  for (const expense of expenses) {
    // Skip if not for this year
    if (!isEventForYear(expense, currentYear)) continue;
    
    let amount = expense.prevAmount || expense.initialAmount;
    amount *= (1 + sampleFromDistribution(expense.annualChangeRate));
    expense.prevAmount = amount;
    
    if (expense.inflationAdjusted) {
      amount *= (1 + inflationRate);
    }
    
    if (!isUserAlive && expense.userPercentage) {
      amount *= (1 - expense.userPercentage);
    }
    if (!isSpouseAlive && expense.spousePercentage) {
      amount *= (1 - expense.spousePercentage);
    }
    
    total += amount;
  }
  
  return total;
}

/**
 * Calculate total assets across all investments
 * @param {Array} investments - List of investments
 * @returns {Number} - Total assets
 */
function calculateTotalAssets(investments) {
  return investments.reduce((sum, inv) => sum + Math.max(0, inv.value), 0);
}

/**
 * Check if an event is scheduled for the given year
 * @param {Object} event - Event object
 * @param {Number} year - Year to check
 * @returns {Boolean} - Whether event is for this year
 */
function isEventForYear(event, year) {
  if (event.startYear && year < event.startYear) return false;
  if (event.endYear && year > event.endYear) return false;
  if (event.frequency === 'annual') return true;
  if (event.frequency === 'one-time' && year === event.startYear) return true;
  
  return false;
}

/**
 * Find an event scheduled for the given year
 * @param {Array} events - List of events
 * @param {Number} year - Year to check
 * @returns {Object|null} - Event for this year or null
 */
function findEventForYear(events, year) {
  if (!events) return null;
  return events.find(event => isEventForYear(event, year)) || null;
}

/**
 * Calculate purchase amounts based on asset allocation
 * @param {Object} assetAllocation - Asset allocation percentages
 * @param {Number} totalAmount - Total amount to allocate
 * @returns {Array} - List of purchases
 */
function calculatePurchaseAmounts(assetAllocation, totalAmount) {
  const purchases = [];
  
  for (const [investmentId, allocation] of Object.entries(assetAllocation)) {
    // Skip if allocation is not an object with percentage
    if (typeof allocation !== 'object' || !allocation.percentage) continue;
    
    const amount = totalAmount * (allocation.percentage / 100);
    
    if (amount > 0) {
      purchases.push({
        investmentId,
        investmentType: allocation.type,
        taxStatus: allocation.taxStatus,
        amount
      });
    }
  }
  
  return purchases;
}

/**
 * Get default income rate for an investment type
 * @param {String} investmentType - Type of investment
 * @returns {Object} - Default income rate
 */
function getDefaultIncomeRate(investmentType) {
  const defaults = {
    cash: { type: 'fixed', value: 0.01 },
    stocks: { type: 'fixed', value: 0.02 },
    bonds: { type: 'fixed', value: 0.04 }
  };
  
  return defaults[investmentType] || { type: 'fixed', value: 0 };
}

/**
 * Get default value change rate for an investment type
 * @param {String} investmentType - Type of investment
 * @returns {Object} - Default value change rate
 */
function getDefaultValueChangeRate(investmentType) {
  const defaults = {
    cash: { type: 'fixed', value: 0 },
    stocks: { type: 'normal', mean: 0.07, stdDev: 0.15 },
    bonds: { type: 'normal', mean: 0.02, stdDev: 0.05 }
  };
  
  return defaults[investmentType] || { type: 'fixed', value: 0 };
}

/**
 * Get default expense ratio for an investment type
 * @param {String} investmentType - Type of investment
 * @returns {Number} - Default expense ratio
 */
function getDefaultExpenseRatio(investmentType) {
  const defaults = {
    cash: 0.0,
    stocks: 0.005,
    bonds: 0.003
  };
  
  return defaults[investmentType] || 0;
}

/**
 * Get default taxability for an investment type
 * @param {String} investmentType - Type of investment
 * @returns {String} - Default taxability
 */
function getDefaultTaxability(investmentType) {
  const defaults = {
    cash: 'taxable',
    stocks: 'taxable',
    bonds: 'taxable'
  };
  
  return defaults[investmentType] || 'taxable';
}

/**
 * Analyze simulation results to calculate success rate and statistics
 * @param {Array} simulationResults - Results from multiple simulations
 * @returns {Object} - Analysis results including success rate and statistics
 */
function analyzeResults(simulationResults) {
  if (!simulationResults || !simulationResults.length) {
    return {
      successRate: 0,
      finalAssetStatistics: {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        percentile10: 0,
        percentile25: 0,
        percentile75: 0,
        percentile90: 0
      }
    };
  }

  try {
    // Count successful simulations (where final total assets > 0)
    const successfulSimulations = simulationResults.filter(
      result => result.finalState && result.finalState.totalAssets > 0
    );
    
    const successRate = (successfulSimulations.length / simulationResults.length) * 100;
    
    // Calculate statistics on final total assets
    const finalAssets = simulationResults
      .filter(result => result.finalState)
      .map(result => {
        // Ensure we have a valid number
        const assets = result.finalState.totalAssets;
        return typeof assets === 'number' && !isNaN(assets) ? assets : 0;
      });
    
    // Default values if no valid data
    if (finalAssets.length === 0) {
      return {
        successRate: 0,
        finalAssetStatistics: {
          min: 0,
          max: 0,
          mean: 0,
          median: 0,
          percentile10: 0,
          percentile25: 0,
          percentile75: 0,
          percentile90: 0
        }
      };
    }
    
    // Sort for percentiles
    finalAssets.sort((a, b) => a - b);
    
    const min = finalAssets[0];
    const max = finalAssets[finalAssets.length - 1];
    const mean = finalAssets.reduce((sum, value) => sum + value, 0) / finalAssets.length;
    
    // Calculate median (50th percentile)
    let median = 0;
    const midIndex = Math.floor(finalAssets.length / 2);
    if (finalAssets.length % 2 === 0) {
      median = (finalAssets[midIndex - 1] + finalAssets[midIndex]) / 2;
    } else {
      median = finalAssets[midIndex];
    }
    
    // Calculate percentiles safely
    const getPercentile = (percent) => {
      if (finalAssets.length === 0) return 0;
      const index = Math.floor(finalAssets.length * percent);
      return index >= finalAssets.length ? finalAssets[finalAssets.length - 1] : 
             index < 0 ? finalAssets[0] : finalAssets[index];
    };
    
    const percentile10 = getPercentile(0.1);
    const percentile25 = getPercentile(0.25);
    const percentile75 = getPercentile(0.75);
    const percentile90 = getPercentile(0.9);
    
    return {
      successRate,
      finalAssetStatistics: {
        min,
        max,
        mean,
        median,
        percentile10,
        percentile25,
        percentile75,
        percentile90
      }
    };
  } catch (error) {
    console.error('Error in analyzeResults:', error);
    return {
      successRate: 0,
      finalAssetStatistics: {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        percentile10: 0,
        percentile25: 0,
        percentile75: 0,
        percentile90: 0
      }
    };
  }
}

/**
 * Create visualization data for the simulation results
 * @param {Array} simulationResults - Results from multiple simulations
 * @param {Object} analysis - Analysis results from analyzeResults
 * @returns {Object} - Visualization data for charts
 */
function createVisualizations(simulationResults, analysis) {
  try {
    if (!simulationResults || !simulationResults.length) {
      return {
        assetTrajectories: { labels: [], datasets: [] },
        assetDistribution: [{ label: 'No data', count: 0 }],
        successRateByYear: []
      };
    }
    
    // Get the maximum number of years from the simulations
    const maxYears = Math.max(
      ...simulationResults
        .filter(sim => sim && sim.yearlyResults && Array.isArray(sim.yearlyResults))
        .map(sim => sim.yearlyResults.length || 0)
    );
    
    // Asset trajectories for line chart
    // Take a sample of simulations to avoid overwhelming the visualization
    const sampleSize = Math.min(10, simulationResults.length);
    const sampledSimulations = simulationResults.slice(0, sampleSize);
    
    const assetTrajectories = {
      labels: Array.from({ length: maxYears }, (_, i) => i.toString()),
      datasets: sampledSimulations
        .filter(sim => sim && sim.yearlyResults && Array.isArray(sim.yearlyResults))
        .map((sim, index) => ({
          label: `Simulation ${index + 1}`,
          data: sim.yearlyResults.map(year => 
            typeof year?.totalAssets === 'number' && !isNaN(year.totalAssets) 
              ? year.totalAssets 
              : 0
          )
        }))
    };
    
    // Asset distribution for histogram
    let assetDistribution = [];
    try {
      const finalAssets = simulationResults
        .filter(result => result && result.finalState)
        .map(result => {
          const assets = result.finalState.totalAssets;
          return typeof assets === 'number' && !isNaN(assets) ? assets : 0;
        });
      
      // Create buckets for histogram
      if (finalAssets.length === 0) {
        // No data case
        assetDistribution = [{ label: 'No data', count: 0 }];
      } else {
        const min = Math.min(...finalAssets);
        const max = Math.max(...finalAssets);
        
        // Handle case where all assets are the same value
        if (min === max || max - min < 0.001) { // Allow for floating point precision issues
          assetDistribution = [{ 
            label: `$${min.toLocaleString()}`, 
            count: finalAssets.length 
          }];
        } else {
          const bucketCount = 10;
          const bucketSize = (max - min) / bucketCount;
          
          // Initialize empty buckets
          const buckets = Array.from({ length: bucketCount }, (_, i) => ({
            label: `$${(min + i * bucketSize).toLocaleString()} - $${(min + (i + 1) * bucketSize).toLocaleString()}`,
            count: 0
          }));
          
          // Count assets in each bucket
          finalAssets.forEach(asset => {
            try {
              if (asset === max) {
                // Handle edge case for the maximum value
                buckets[bucketCount - 1].count++;
              } else {
                const bucketIndex = Math.floor((asset - min) / bucketSize);
                // Ensure bucketIndex is within valid range
                if (bucketIndex >= 0 && bucketIndex < bucketCount) {
                  buckets[bucketIndex].count++;
                } else {
                  // If outside valid range, put in first or last bucket
                  const adjustedIndex = bucketIndex < 0 ? 0 : bucketCount - 1;
                  buckets[adjustedIndex].count++;
                }
              }
            } catch (error) {
              console.error('Error placing asset in bucket:', asset, error);
            }
          });
          
          assetDistribution = buckets;
        }
      }
    } catch (error) {
      console.error('Error creating asset distribution:', error);
      assetDistribution = [{ label: 'Error in distribution calculation', count: 0 }];
    }
    
    // Calculate success rate by year
    let successRateByYear = [];
    try {
      for (let year = 0; year < maxYears; year++) {
        const simulationsWithYear = simulationResults.filter(
          sim => sim && sim.yearlyResults && sim.yearlyResults[year]
        );
        
        const successfulSimulations = simulationsWithYear.filter(
          sim => sim.yearlyResults[year].totalAssets > 0
        );
        
        const yearSuccessRate = simulationsWithYear.length ? 
          (successfulSimulations.length / simulationsWithYear.length) * 100 : 0;
        
        successRateByYear.push({
          year,
          successRate: yearSuccessRate
        });
      }
    } catch (error) {
      console.error('Error calculating success rate by year:', error);
      successRateByYear = [];
    }
    
    return {
      assetTrajectories,
      assetDistribution,
      successRateByYear
    };
  } catch (error) {
    console.error('Critical error in createVisualizations:', error);
    return {
      assetTrajectories: { labels: [], datasets: [] },
      assetDistribution: [{ label: 'Error in visualization', count: 0 }],
      successRateByYear: []
    };
  }
}

// Export functions
module.exports = {
  runSimulations,
  runOneSimulation,
  sampleFromDistribution,
  analyzeResults,
  createVisualizations
}; 