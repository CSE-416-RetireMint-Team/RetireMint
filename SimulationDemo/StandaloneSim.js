/**
 * Standalone Financial Simulation Script
 * This script contains both the simulation algorithm and visualization code
 */
const fs = require('fs');
const path = require('path');

// Main function to run the simulations
async function main() {
    const baseParams = createBaseParams();
    const numSimulations = 100;
    const numYears = 30;
    baseParams.startYear = 2025;
    
    console.log(`Running ${numSimulations} simulations over ${numYears} years...`);
    
    // Create all simulation promises
    const simulationPromises = [];
    for (let i = 0; i < numSimulations; i++) {
      simulationPromises.push(runOneSimulation(baseParams, numYears, i));
    }
    
    // Wait for all simulations to complete
    const simulationResults = await Promise.all(simulationPromises);
    
    // Analyze results once
    const successfulSimulations = simulationResults.filter(result => 
      result.finalState.totalAssets >= baseParams.financialGoal
    );
    
    const successPercentage = (successfulSimulations.length / numSimulations) * 100;
    
    // Print each section exactly once
    console.log(`\nSimulation Results:`);
    console.log(`-------------------`);
    console.log(`Success Rate: ${successPercentage.toFixed(2)}%`);
    console.log(`Number of Successful Simulations: ${successfulSimulations.length}`);
    console.log(`Total Simulations: ${numSimulations}`);
    
    // Calculate statistics exactly once
    const finalAssets = simulationResults.map(r => r.finalState.totalAssets);
    const min = Math.min(...finalAssets);
    const max = Math.max(...finalAssets);
    const avg = finalAssets.reduce((sum, val) => sum + val, 0) / finalAssets.length;
    
    console.log(`\nFinal Asset Statistics:`);
    console.log(`---------------------`);
    console.log(`Minimum: $${min.toLocaleString('en-US')}`);
    console.log(`Maximum: $${max.toLocaleString('en-US')}`);
    console.log(`Average: $${avg.toLocaleString('en-US')}`);
  
  // Prepare visualization data
  const visualizationData = {
    finalAssetValues: finalAssets,
    successRate: successPercentage,
    timeSeriesData: {
      'Successful': successfulSimulations,
      'Unsuccessful': simulationResults.filter(r => r.finalState.totalAssets < baseParams.financialGoal)
    }
  };
  
  // Generate HTML file
  const visualizationConfig = createVisualizations(visualizationData);
  const htmlOutput = generateResultsHtml(visualizationConfig, successPercentage);
  
  // Write to file
  const outputPath = path.join(__dirname, 'SimulationResults.html');
  fs.writeFileSync(outputPath, htmlOutput);
  
  console.log(`\nResults saved to: ${outputPath}`);
}

/**
 * Run a single simulation for multiple years
 */
async function runOneSimulation(baseParams, numYears, simulationIndex) {
  // Clone the base parameters to avoid modifying the original
  const params = JSON.parse(JSON.stringify(baseParams));
  
  // Add some randomness
  randomizeParameters(params, simulationIndex);
  
  const yearlyResults = [];
  let currentState = null;
  
  // Run simulation year by year
  for (let year = 0; year < numYears; year++) {
    const currentYear = params.startYear + year;
    
    const yearParams = {
      ...params,
      currentYear,
      prevYear: currentState,
      userAge: params.userAge + year,
      spouseAge: params.spouseAge + year
    };
    
    // Simulate this year
    currentState = simulateYear(yearParams);
    
    // Store results for this year
    yearlyResults.push({
      year: currentYear,
      totalAssets: currentState.totalAssets,
      income: currentState.curYearIncome,
      socialSecurity: currentState.curYearSS,
      capitalGains: currentState.curYearGains,
      inflationRate: currentState.inflationRate
    });
  }
  
  return {
    simulationIndex,
    finalState: currentState,
    yearlyResults
  };
}

/**
 * Add randomness to parameters for Monte Carlo simulation
 */
function randomizeParameters(params, seed) {
  // Use seed for reproducible randomness
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  // Adjust inflation assumption
  if (params.inflationAssumption && params.inflationAssumption.type === 'normal') {
    // Add small random adjustment to mean
    params.inflationAssumption.mean += (random() * 0.01) - 0.005; // ±0.5%
  }
  
  // Randomize investment returns
  params.investments.forEach(inv => {
    if (inv.valueChangeRate && inv.valueChangeRate.type === 'normal') {
      // Add small random adjustment to mean return
      inv.valueChangeRate.mean += (random() * 0.02) - 0.01; // ±1%
      
      // Add small random adjustment to volatility
      inv.valueChangeRate.stdDev *= 0.8 + (random() * 0.4); // ±20%
    }
  });
  
  // Randomize income growth rates
  params.incomeEvents.forEach(event => {
    if (event.annualChangeRate && typeof event.annualChangeRate === 'object') {
      if (event.annualChangeRate.type === 'fixed') {
        event.annualChangeRate.value += (random() * 0.01) - 0.005; // ±0.5%
      } else if (event.annualChangeRate.type === 'normal') {
        event.annualChangeRate.mean += (random() * 0.01) - 0.005; // ±0.5%
      }
    }
  });
  
  // Randomize expense growth rates
  const allExpenses = [
    ...(params.nonDiscretionaryExpenses || []),
    ...(params.discretionaryExpenses || [])
  ];
  
  allExpenses.forEach(expense => {
    if (expense.annualChangeRate && typeof expense.annualChangeRate === 'object') {
      if (expense.annualChangeRate.type === 'fixed') {
        expense.annualChangeRate.value += (random() * 0.01) - 0.005; // ±0.5%
      } else if (expense.annualChangeRate.type === 'normal') {
        expense.annualChangeRate.mean += (random() * 0.01) - 0.005; // ±0.5%
      }
    }
  });
}

/**
 * Create visualizations using Plotly data format
 */
function createVisualizations(data) {
  // Data for asset distribution histogram
  const histogramData = [{
    x: data.finalAssetValues,
    type: 'histogram',
    marker: {
      color: 'rgba(0, 100, 200, 0.7)',
    },
    name: 'Final Asset Distribution'
  }];
  
  // Data for time series visualization (median and range)
  const timeSeriesData = [];
  
  // Process each category (successful/unsuccessful)
  Object.entries(data.timeSeriesData).forEach(([category, simulations]) => {
    if (simulations.length === 0) return;
    
    // Determine years (assuming all simulations have same years)
    const years = simulations[0].yearlyResults.map(d => d.year);
    
    // For each year, calculate statistics across all simulations in this category
    const yearlyStats = years.map((year, yearIndex) => {
      const assetValues = simulations.map(sim => 
        sim.yearlyResults[yearIndex] ? sim.yearlyResults[yearIndex].totalAssets : 0
      );
      
      // Sort values for percentile calculations
      assetValues.sort((a, b) => a - b);
      
      // Calculate percentiles
      const median = assetValues[Math.floor(assetValues.length / 2)] || 0;
      const p10 = assetValues[Math.floor(assetValues.length * 0.1)] || 0;
      const p90 = assetValues[Math.floor(assetValues.length * 0.9)] || 0;
      
      return {
        year,
        median,
        p10,
        p90
      };
    });
    
    // Create traces for median, 10th and 90th percentiles
    const medianTrace = {
      x: years,
      y: yearlyStats.map(stat => stat.median),
      type: 'scatter',
      mode: 'lines',
      name: `${category} Median`,
      line: {
        color: category === 'Successful' ? 'rgba(0, 128, 0, 1)' : 'rgba(255, 0, 0, 1)',
        width: 2
      }
    };
    
    const fillTrace = {
      x: [...years, ...years.slice().reverse()],
      y: [...yearlyStats.map(stat => stat.p90), ...yearlyStats.map(stat => stat.p10).reverse()],
      fill: 'toself',
      fillcolor: category === 'Successful' ? 'rgba(0, 128, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
      line: {
        color: 'transparent'
      },
      name: `${category} 10-90 percentile range`,
      showlegend: false
    };
    
    timeSeriesData.push(medianTrace, fillTrace);
  });
  
  // Data for success rate pie chart
  const pieData = [{
    values: [data.successRate, 100 - data.successRate],
    labels: ['Success', 'Failure'],
    type: 'pie',
    marker: {
      colors: ['rgba(0, 128, 0, 0.7)', 'rgba(255, 0, 0, 0.7)']
    },
    textinfo: 'label+percent',
    insidetextorientation: 'radial'
  }];
  
  // Create plotly layout configs
  const histogramLayout = {
    title: 'Distribution of Final Asset Values',
    xaxis: {
      title: 'Final Asset Value',
      tickformat: '$,.0f'
    },
    yaxis: {
      title: 'Number of Simulations'
    }
  };
  
  const timeSeriesLayout = {
    title: 'Asset Values Over Time',
    xaxis: {
      title: 'Year'
    },
    yaxis: {
      title: 'Total Assets',
      tickformat: '$,.0f'
    }
  };
  
  const pieLayout = {
    title: 'Success vs Failure Rate',
    height: 400,
    width: 500
  };
  
  // Return configurations
  return {
    histogram: { data: histogramData, layout: histogramLayout },
    timeSeries: { data: timeSeriesData, layout: timeSeriesLayout },
    pie: { data: pieData, layout: pieLayout }
  };
}

/**
 * Generate HTML with embedded Plotly visualizations
 */
function generateResultsHtml(visualizationConfig, successPercentage) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Financial Simulation Results</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .visualization { margin-bottom: 30px; }
    h1, h2 { color: #333; }
  </style>
</head>
<body>
  <h1>Financial Simulation Results</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Success Rate:</strong> ${successPercentage.toFixed(2)}%</p>
    <p>Success is defined as ending with total assets greater than or equal to the financial goal.</p>
  </div>
  
  <div class="visualization">
    <div id="histogram" style="width:100%; height:400px;"></div>
  </div>
  
  <div class="visualization">
    <div id="timeSeries" style="width:100%; height:400px;"></div>
  </div>
  
  <div class="visualization">
    <div id="pieChart" style="width:100%; height:400px;"></div>
  </div>
  
  <script>
    // Render histogram
    Plotly.newPlot('histogram', ${JSON.stringify(visualizationConfig.histogram.data)}, 
                  ${JSON.stringify(visualizationConfig.histogram.layout)});
    
    // Render time series
    Plotly.newPlot('timeSeries', ${JSON.stringify(visualizationConfig.timeSeries.data)},
                  ${JSON.stringify(visualizationConfig.timeSeries.layout)});
    
    // Render pie chart
    Plotly.newPlot('pieChart', ${JSON.stringify(visualizationConfig.pie.data)},
                  ${JSON.stringify(visualizationConfig.pie.layout)});
  </script>
</body>
</html>
  `;
}

/**
 * Create base parameters for simulation
 */
function createBaseParams() {
  return {
    userAge: 40,
    spouseAge: 38,
    isUserAlive: true,
    isSpouseAlive: true,
    inflationAssumption: { type: 'normal', mean: 0.025, stdDev: 0.005 },
    taxBrackets: {
      federal: [
        { lowerBound: 0, upperBound: 10000, rate: 0.10 },
        { lowerBound: 10000, upperBound: 50000, rate: 0.15 },
        { lowerBound: 50000, upperBound: 100000, rate: 0.25 },
        { lowerBound: 100000, upperBound: Infinity, rate: 0.32 }
      ],
      state: [
        { lowerBound: 0, upperBound: 20000, rate: 0.05 },
        { lowerBound: 20000, upperBound: 80000, rate: 0.07 },
        { lowerBound: 80000, upperBound: Infinity, rate: 0.09 }
      ],
      capitalGains: [
        { lowerBound: 0, upperBound: 40000, rate: 0.0 },
        { lowerBound: 40000, upperBound: 441450, rate: 0.15 },
        { lowerBound: 441450, upperBound: Infinity, rate: 0.20 }
      ],
      standardDeduction: 12950
    },
    retirementContribLimits: {
      preTax: 20500,
      afterTax: 6000
    },
    investments: [
      {
        id: 'inv_1',
        investmentType: 'cash',
        taxStatus: 'non-retirement',
        value: 50000,
        purchasePrice: 50000,
        incomeRate: { type: 'fixed', value: 0.01 },
        valueChangeRate: { type: 'fixed', value: 0 },
        expenseRatio: 0.0,
        taxability: 'taxable'
      },
      {
        id: 'inv_2',
        investmentType: 'stocks',
        taxStatus: 'pre-tax',
        value: 250000,
        purchasePrice: 200000,
        incomeRate: { type: 'fixed', value: 0.02 },
        valueChangeRate: { type: 'normal', mean: 0.07, stdDev: 0.15 },
        expenseRatio: 0.005,
        taxability: 'taxable'
      },
      {
        id: 'inv_3',
        investmentType: 'bonds',
        taxStatus: 'pre-tax',
        value: 150000,
        purchasePrice: 130000,
        incomeRate: { type: 'fixed', value: 0.04 },
        valueChangeRate: { type: 'normal', mean: 0.02, stdDev: 0.05 },
        expenseRatio: 0.003,
        taxability: 'taxable'
      },
      {
        id: 'inv_4',
        investmentType: 'stocks',
        taxStatus: 'after-tax retirement',
        value: 100000,
        purchasePrice: 80000,
        incomeRate: { type: 'fixed', value: 0.02 },
        valueChangeRate: { type: 'normal', mean: 0.07, stdDev: 0.15 },
        expenseRatio: 0.005,
        taxability: 'taxable'
      },
      {
        id: 'inv_5',
        investmentType: 'stocks',
        taxStatus: 'non-retirement',
        value: 75000,
        purchasePrice: 60000,
        incomeRate: { type: 'fixed', value: 0.02 },
        valueChangeRate: { type: 'normal', mean: 0.07, stdDev: 0.15 },
        expenseRatio: 0.005,
        taxability: 'taxable'
      }
    ],
    incomeEvents: [
      {
        id: 'income_1',
        description: 'Salary',
        initialAmount: 120000,
        prevAmount: 120000,
        annualChangeRate: { type: 'fixed', value: 0.03 },
        inflationAdjusted: false,
        startYear: 2025,
        endYear: 2045, // Retire at age 60
        frequency: 'annual',
        incomeType: 'salary',
        taxStatus: 'non-retirement',
        userPercentage: 0.6,
        spousePercentage: 0.4
      },
      {
        id: 'income_2',
        description: 'Social Security',
        initialAmount: 30000,
        prevAmount: 30000,
        annualChangeRate: { type: 'fixed', value: 0.02 },
        inflationAdjusted: true,
        startYear: 2047, // Start at age 62
        endYear: null,
        frequency: 'annual',
        incomeType: 'social security',
        taxStatus: 'non-retirement',
        userPercentage: 0.5,
        spousePercentage: 0.5
      }
    ],
    rmdStrategy: ['inv_2', 'inv_3'],
    rmdTable: {
      74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
      81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 
      88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 
      95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4
    },
    rothConversionEnabled: true,
    rothConversionStrategy: ['inv_2', 'inv_3'],
    nonDiscretionaryExpenses: [
      {
        id: 'exp_1',
        description: 'Housing',
        initialAmount: 40000,
        prevAmount: 40000,
        annualChangeRate: { type: 'fixed', value: 0.01 },
        inflationAdjusted: true,
        startYear: 2025,
        endYear: null,
        frequency: 'annual',
        userPercentage: 0.5,
        spousePercentage: 0.5
      },
      {
        id: 'exp_2',
        description: 'Healthcare',
        initialAmount: 12000,
        prevAmount: 12000,
        annualChangeRate: { type: 'fixed', value: 0.05 },
        inflationAdjusted: true,
        startYear: 2025,
        endYear: null,
        frequency: 'annual',
        userPercentage: 0.5,
        spousePercentage: 0.5
      }
    ],
    discretionaryExpenses: [
      {
        id: 'exp_3',
        description: 'Travel',
        initialAmount: 10000,
        prevAmount: 10000,
        annualChangeRate: { type: 'fixed', value: 0.02 },
        inflationAdjusted: true,
        startYear: 2025,
        endYear: null,
        frequency: 'annual',
        userPercentage: 0.5,
        spousePercentage: 0.5
      },
      {
        id: 'exp_4',
        description: 'Entertainment',
        initialAmount: 8000,
        prevAmount: 8000,
        annualChangeRate: { type: 'fixed', value: 0.0 },
        inflationAdjusted: true,
        startYear: 2025,
        endYear: null,
        frequency: 'annual',
        userPercentage: 0.5,
        spousePercentage: 0.5
      }
    ],
    expenseWithdrawalStrategy: ['inv_5', 'inv_4', 'inv_2', 'inv_3'],
    investEvents: [
      {
        id: 'invest_1',
        startYear: 2025,
        endYear: 2045, // Until retirement
        frequency: 'annual',
        assetAllocation: {
          'inv_2': { percentage: 40, type: 'stocks', taxStatus: 'pre-tax' },
          'inv_3': { percentage: 20, type: 'bonds', taxStatus: 'pre-tax' },
          'inv_4': { percentage: 30, type: 'stocks', taxStatus: 'after-tax retirement' },
          'inv_5': { percentage: 10, type: 'stocks', taxStatus: 'non-retirement' }
        }
      }
    ],
    rebalanceEvents: [
      {
        id: 'rebalance_1',
        startYear: 2025,
        endYear: 2065,
        frequency: 'annual',
        assetAllocation: {
          'inv_2': 40,
          'inv_3': 20,
          'inv_4': 30,
          'inv_5': 10
        }
      }
    ],
    financialGoal: 1500000 // Financial goal for retirement
  };
}

// -------------------------------
// CORE FINANCIAL SIMULATION LOGIC
// -------------------------------

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
  } = params;

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
    taxBrackets: prevYearTaxBrackets = taxBrackets,
    retirementContribLimits: prevYearRetirementContribLimits = retirementContribLimits
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

  // 1. Preliminaries
  // a. Sample inflation rate
  const inflationRate = sampleFromDistribution(inflationAssumption);
  
  // b. Compute inflation-adjusted tax brackets
  const adjustedTaxBrackets = adjustTaxBrackets(prevYearTaxBrackets, inflationRate);
  
  // c. Compute inflation-adjusted retirement contribution limits
  const adjustedRetirementContribLimits = adjustRetirementContribLimits(
    prevYearRetirementContribLimits, 
    inflationRate
  );

  // 2. Run income events
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

  // 3. Perform RMD for the previous year if applicable
  if (userAge >= 74) {
    // Check if there are pre-tax investments with positive value
    const preTaxInvestments = investments.filter(inv => 
      inv.taxStatus === "pre-tax" && inv.value > 0
    );
    
    if (preTaxInvestments.length > 0) {
      // a. The first RMD is for the year in which the user turns 73
      // b. Look up distribution period
      const distributionPeriod = lookupRMDDistributionPeriod(rmdTable, userAge);
      
      // c. Sum pre-tax investment values
      const preTaxTotal = preTaxInvestments.reduce((sum, inv) => sum + inv.value, 0);
      
      // d. Calculate RMD
      const rmd = preTaxTotal / distributionPeriod;
      
      // e. Add to current year income
      curYearIncome += rmd;
      
      // f. Transfer investments according to RMD strategy
      let remainingRMD = rmd;
      for (const investmentId of rmdStrategy) {
        const sourceInvestment = findInvestmentById(investments, investmentId);
        
        // Skip if not found or not pre-tax or no value
        if (!sourceInvestment || sourceInvestment.taxStatus !== "pre-tax" || sourceInvestment.value <= 0) {
          continue;
        }
        
        // Amount to transfer (either full investment or remaining RMD)
        const transferAmount = Math.min(sourceInvestment.value, remainingRMD);
        
        // g. Transfer in-kind
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

  // 4. Update investment values
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

  // 5. Run Roth conversion optimizer if enabled
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

  // 6. Pay non-discretionary expenses and previous year's taxes
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

  // 7. Pay discretionary expenses
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

  // 8. Run invest events
  const investEvent = findEventForYear(investEvents, currentYear);
  if (investEvent && cashInvestment.value > 0) {
    const excessCash = cashInvestment.value;
    
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

  // 9. Run rebalance events
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

// Helper functions

/**
 * Sample a value from a distribution
 * @param {Object|Number} distribution - Distribution object or fixed value
 * @returns {Number} - Sampled value
 */
function sampleFromDistribution(distribution) {
  if (typeof distribution === 'number') {
    return distribution;
  }
  
  if (!distribution || typeof distribution !== 'object') {
    return 0;
  }
  
  if (distribution.type === 'fixed') {
    return distribution.value;
  }
  
  if (distribution.type === 'uniform') {
    return distribution.min + Math.random() * (distribution.max - distribution.min);
  }
  
  if (distribution.type === 'normal') {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return distribution.mean + distribution.stdDev * z;
  }
  
  // Default fallback
  return 0;
}

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
 * Generate a unique ID
 * @returns {String} - Unique ID
 */
function generateUniqueId() {
  return 'inv_' + Math.random().toString(36).substr(2, 9);
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

// Run the main function
main().catch(err => {
  console.error('Error running simulations:', err);
});