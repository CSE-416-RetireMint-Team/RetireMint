import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OneDimensionalSimulationResults = () => {
  const [selectedQuantity, setSelectedQuantity] = useState('probabilityOfSuccess');
  const baseYear = 2025;

  // Retrieve data from RunSimulation.js, passed via State upon navigate.
  const location = useLocation();
  const exploreData = location.state?.exploreResults || {};


  // Process the data based on selected quantity
  const processData = () => {
    console.log(exploreData);
    return exploreData.results.map(result => {
      const { parameterValue, resultForGraph } = result;

      if (selectedQuantity === 'probabilityOfSuccess') {
        // Calculate probability of success for each year
        const yearlyProbabilities = resultForGraph.yearlyResults[0].map((_, yearIndex) => {
          const totalScenarios = resultForGraph.yearlyResults.length;
          const successfulScenarios = resultForGraph.yearlyResults.filter(
            scenario => scenario[yearIndex].meetingFinancialGoal
          ).length;
          return successfulScenarios / totalScenarios;
        });

        // Format for chart with actual years
        return {
          parameterValue,
          data: yearlyProbabilities.map((probability, yearIndex) => ({
            year: baseYear + yearIndex,
            value: probability * 100, // Convert to percentage
            name: `${parameterValue} ${exploreData.parameterName}`
          }))
        };
      } else {
        // Calculate median investments for each year
        const yearlyMedians = resultForGraph.yearlyResults[0].map((_, yearIndex) => {
          // First get all investment totals for this year across scenarios
          const investmentTotals = resultForGraph.investmentValueArrays.map(scenario => {
            const yearInvestments = scenario[yearIndex];
            return Object.values(yearInvestments).reduce((sum, val) => sum + val, 0);
          });

          // Calculate median
          investmentTotals.sort((a, b) => a - b);
          const mid = Math.floor(investmentTotals.length / 2);
          return investmentTotals.length % 2 !== 0 
            ? investmentTotals[mid] 
            : (investmentTotals[mid - 1] + investmentTotals[mid]) / 2;
        });

        // Format for chart with actual years
        return {
          parameterValue,
          data: yearlyMedians.map((median, yearIndex) => ({
            year: baseYear + yearIndex,
            value: median,
            name: `${parameterValue} ${exploreData.parameterName}`
          }))
        };
      }
    });
  };

  const chartData = processData();

  // Find the maximum year across all simulations to set the x-axis domain
  const maxYear = Math.max(...chartData.flatMap(paramData => 
    paramData.data.map(item => item.year)
  ));

  // Combine all data for the chart
  const combinedData = [];
  for (let year = baseYear; year <= maxYear; year++) {
    const yearData = { year };
    chartData.forEach(paramData => {
      const dataPoint = paramData.data.find(item => item.year === year);
      if (dataPoint) {
        yearData[`${paramData.parameterValue}`] = dataPoint.value;
      }
    });
    combinedData.push(yearData);
  }

  return (
    <div style={{ width: '100%', height: 500, marginTop: '300px'}}>
      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="radio"
            checked={selectedQuantity === 'probabilityOfSuccess'}
            onChange={() => setSelectedQuantity('probabilityOfSuccess')}
          />
          Probability of Success (%)
        </label>
        <label style={{ marginLeft: 20 }}>
          <input
            type="radio"
            checked={selectedQuantity === 'medianInvestments'}
            onChange={() => setSelectedQuantity('medianInvestments')}
          />
          Median Total Investments ($)
        </label>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={combinedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year"
            domain={[baseYear, maxYear]}
            tickFormatter={(year) => year.toString()}
          />
          <YAxis 
            label={{
              value: selectedQuantity === 'probabilityOfSuccess' 
                ? 'Probability (%)' 
                : 'Investment Value ($)',
              angle: -90,
              position: 'insideLeft'
            }}
          />
          <Tooltip 
            formatter={(value) => selectedQuantity === 'probabilityOfSuccess' 
              ? [`${value}%`, 'Probability'] 
              : [`$${value.toLocaleString()}`, 'Investment Value']}
            labelFormatter={(year) => `Year: ${year}`}
          />
          <Legend />
          {chartData.map((paramData) => (
            <Line
              key={paramData.parameterValue}
              type="monotone"
              dataKey={`${paramData.parameterValue}`}
              name={`${paramData.parameterValue} ${exploreData.parameterName}`}
              stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
              activeDot={{ r: 8 }}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OneDimensionalSimulationResults;