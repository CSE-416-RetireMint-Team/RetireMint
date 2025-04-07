// npm install plotly fs path

/**
 * This script demonstrates how to run multiple financial simulations
 * and visualize the results using Plotly
 */
const fs = require('fs');
const path = require('path');
const { 
  simulateYear, 
  testSimulation, 
  runSimulations, 
  generateResultsHtml 
} = require('./simulationAlgorithm');

/**
 * Main function to run simulations and generate visualizations
 */
async function main() {
  // Get base parameters from the test simulation configuration
  // Create a deep copy to avoid modifying the original
  const baseParams = createBaseParams();
  
  // Define simulation parameters
  const numSimulations = 1000; // Number of simulations to run
  const numYears = 40;         // Number of years to simulate
  const startYear = 2025;      // Starting year
  
  // Add start year to base parameters
  baseParams.startYear = startYear;
  
  // Run the simulations
  console.log(`Running ${numSimulations} simulations over ${numYears} years...`);
  const results = await runSimulations(baseParams, numSimulations, numYears);
  
  // Print summary results
  console.log(`\nSimulation Results:`);
  console.log(`-------------------`);
  console.log(`Success Rate: ${results.successPercentage.toFixed(2)}%`);
  console.log(`Number of Successful Simulations: ${results.successfulSimulations.length}`);
  console.log(`Total Simulations: ${numSimulations}`);
  
  // Calculate statistics on final asset values
  const finalAssets = results.simulationResults.map(r => r.finalState.totalAssets);
  const min = Math.min(...finalAssets);
  const max = Math.max(...finalAssets);
  const avg = finalAssets.reduce((sum, val) => sum + val, 0) / finalAssets.length;
  
  console.log(`\nFinal Asset Statistics:`);
  console.log(`---------------------`);
  console.log(`Minimum: $${min.toLocaleString()}`);
  console.log(`Maximum: $${max.toLocaleString()}`);
  console.log(`Average: $${avg.toLocaleString()}`);
  
  // Generate HTML with Plotly visualizations
  const htmlOutput = generateResultsHtml(
    createVisualizations(results.visualizationData),
    results.successPercentage
  );
  
  // Write HTML to file
  const outputPath = path.join(__dirname, 'simulation-results.html');
  fs.writeFileSync(outputPath, htmlOutput);
  
  console.log(`\nResults saved to: ${outputPath}`);
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

/**
 * Fix for the Plotly visualization creation function
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
    const years = simulations[0].yearlyData.map(d => d.year);
    
    // For each year, calculate statistics across all simulations in this category
    const yearlyStats = years.map((year, yearIndex) => {
      const assetValues = simulations.map(sim => 
        sim.yearlyData[yearIndex] ? sim.yearlyData[yearIndex].totalAssets : 0
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

// Run the main function
main().catch(err => {
  console.error('Error running simulations:', err);
});