import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Mock = () => {
  const [selectedQuantity, setSelectedQuantity] = useState('probabilityOfSuccess');
  const baseYear = 2025;
  
  // Enhanced mock data with more scenarios and varying durations
  const mockData = {
    parameterName: "duration",
    parameterValues: [10, 11, 15, 20],
    results: [
      {
        parameterValue: 10,
        resultForGraph: {
          yearlyResults: [
            [
              { netWorth: 5000, meetingFinancialGoal: false },
              { netWorth: 15000, meetingFinancialGoal: true },
              { netWorth: 25000, meetingFinancialGoal: true },
              { netWorth: 35000, meetingFinancialGoal: true },
              { netWorth: 45000, meetingFinancialGoal: true },
              { netWorth: 55000, meetingFinancialGoal: true },
              { netWorth: 65000, meetingFinancialGoal: true },
              { netWorth: 75000, meetingFinancialGoal: true },
            ],
            [
              { netWorth: 6000, meetingFinancialGoal: true },
              { netWorth: 16000, meetingFinancialGoal: true },
              { netWorth: 26000, meetingFinancialGoal: true },
              { netWorth: 36000, meetingFinancialGoal: true },
              { netWorth: 46000, meetingFinancialGoal: true },
              { netWorth: 56000, meetingFinancialGoal: true },
              { netWorth: 66000, meetingFinancialGoal: true },
              { netWorth: 76000, meetingFinancialGoal: true },
              { netWorth: 86000, meetingFinancialGoal: true },
              { netWorth: 96000, meetingFinancialGoal: true }
            ],
            [
              { netWorth: 4000, meetingFinancialGoal: false },
              { netWorth: 14000, meetingFinancialGoal: false },
              { netWorth: 24000, meetingFinancialGoal: true },
              { netWorth: 34000, meetingFinancialGoal: true },
              { netWorth: 44000, meetingFinancialGoal: true },
              { netWorth: 54000, meetingFinancialGoal: true },
              { netWorth: 64000, meetingFinancialGoal: true },
              { netWorth: 74000, meetingFinancialGoal: true },
              { netWorth: 84000, meetingFinancialGoal: true },
              { netWorth: 94000, meetingFinancialGoal: true }
            ]
          ],
          investmentValueArrays: [
            [
              { "stock A": 206, "stock B": 200 },
              { "stock A": 1059, "stock B": 500 },
              { "stock A": 2059, "stock B": 800 },
              { "stock A": 3059, "stock B": 1100 },
              { "stock A": 4059, "stock B": 1400 },
              { "stock A": 5059, "stock B": 1700 },
              { "stock A": 6059, "stock B": 2000 },
              { "stock A": 7059, "stock B": 2300 },
            ],
            [
              { "stock A": 2098, "stock B": 200 },
              { "stock A": 3098, "stock B": 600 },
              { "stock A": 4098, "stock B": 1000 },
              { "stock A": 5098, "stock B": 1400 },
              { "stock A": 6098, "stock B": 1800 },
              { "stock A": 7098, "stock B": 2200 },
              { "stock A": 8098, "stock B": 2600 },
              { "stock A": 9098, "stock B": 3000 },
              { "stock A": 10098, "stock B": 3400 },
              { "stock A": 11098, "stock B": 3800 }
            ],
            [
              { "stock A": 1500, "stock B": 300 },
              { "stock A": 2500, "stock B": 700 },
              { "stock A": 3500, "stock B": 1100 },
              { "stock A": 4500, "stock B": 1500 },
              { "stock A": 5500, "stock B": 1900 },
              { "stock A": 6500, "stock B": 2300 },
              { "stock A": 7500, "stock B": 2700 },
              { "stock A": 8500, "stock B": 3100 },
              { "stock A": 9500, "stock B": 3500 },
              { "stock A": 10500, "stock B": 3900 }
            ]
          ]
        }
      },
      {
        parameterValue: 11,
        resultForGraph: {
          yearlyResults: [
            [
              { netWorth: 7000, meetingFinancialGoal: false },
              { netWorth: 17000, meetingFinancialGoal: true },
              { netWorth: 27000, meetingFinancialGoal: true },
              { netWorth: 37000, meetingFinancialGoal: true },
              { netWorth: 47000, meetingFinancialGoal: true },
              { netWorth: 57000, meetingFinancialGoal: true },
              { netWorth: 67000, meetingFinancialGoal: true },
              { netWorth: 77000, meetingFinancialGoal: true },
              { netWorth: 87000, meetingFinancialGoal: true },
              { netWorth: 97000, meetingFinancialGoal: true },
              { netWorth: 107000, meetingFinancialGoal: true }
            ],
            [
              { netWorth: 8000, meetingFinancialGoal: true },
              { netWorth: 18000, meetingFinancialGoal: true },
              { netWorth: 28000, meetingFinancialGoal: true },
              { netWorth: 38000, meetingFinancialGoal: true },
              { netWorth: 48000, meetingFinancialGoal: true },
              { netWorth: 58000, meetingFinancialGoal: true },
              { netWorth: 68000, meetingFinancialGoal: true },
              { netWorth: 78000, meetingFinancialGoal: true },
              { netWorth: 88000, meetingFinancialGoal: true },
              { netWorth: 98000, meetingFinancialGoal: true },
              { netWorth: 108000, meetingFinancialGoal: true }
            ]
          ],
          investmentValueArrays: [
            [
              { "stock A": 300, "stock B": 400 },
              { "stock A": 6000, "stock B": 800 },
              { "stock A": 9000, "stock B": 1200 },
              { "stock A": 12000, "stock B": 1600 },
              { "stock A": 15000, "stock B": 2000 },
              { "stock A": 18000, "stock B": 2400 },
              { "stock A": 21000, "stock B": 2800 },
              { "stock A": 24000, "stock B": 3200 },
              { "stock A": 27000, "stock B": 3600 },
              { "stock A": 30000, "stock B": 4000 },
              { "stock A": 33000, "stock B": 4400 }
            ],
            [
              { "stock A": 320, "stock B": 450 },
              { "stock A": 6200, "stock B": 900 },
              { "stock A": 9500, "stock B": 1350 },
              { "stock A": 12500, "stock B": 1800 },
              { "stock A": 15500, "stock B": 2250 },
              { "stock A": 18500, "stock B": 2700 },
              { "stock A": 21500, "stock B": 3150 },
              { "stock A": 24500, "stock B": 3600 },
              { "stock A": 27500, "stock B": 4050 },
              { "stock A": 30500, "stock B": 4500 },
              { "stock A": 33500, "stock B": 4950 }
            ]
          ]
        }
      },
      {
        parameterValue: 15,
        resultForGraph: {
          yearlyResults: [
            [
              { netWorth: 5000, meetingFinancialGoal: false },
              { netWorth: 15000, meetingFinancialGoal: true },
              { netWorth: 25000, meetingFinancialGoal: true },
              { netWorth: 35000, meetingFinancialGoal: true },
              { netWorth: 45000, meetingFinancialGoal: true },
              { netWorth: 55000, meetingFinancialGoal: true },
              { netWorth: 65000, meetingFinancialGoal: true },
              { netWorth: 75000, meetingFinancialGoal: true },
              { netWorth: 85000, meetingFinancialGoal: true },
              { netWorth: 95000, meetingFinancialGoal: true },
              { netWorth: 105000, meetingFinancialGoal: true },
              { netWorth: 115000, meetingFinancialGoal: true },
              { netWorth: 125000, meetingFinancialGoal: true },
              { netWorth: 135000, meetingFinancialGoal: true },
              { netWorth: 145000, meetingFinancialGoal: true }
            ],
            [
              { netWorth: 6000, meetingFinancialGoal: true },
              { netWorth: 16000, meetingFinancialGoal: true },
              { netWorth: 26000, meetingFinancialGoal: true },
              { netWorth: 36000, meetingFinancialGoal: true },
              { netWorth: 46000, meetingFinancialGoal: true },
              { netWorth: 56000, meetingFinancialGoal: true },
              { netWorth: 66000, meetingFinancialGoal: true },
              { netWorth: 76000, meetingFinancialGoal: true },
              { netWorth: 86000, meetingFinancialGoal: true },
              { netWorth: 96000, meetingFinancialGoal: true },
              { netWorth: 106000, meetingFinancialGoal: true },
              { netWorth: 116000, meetingFinancialGoal: true },
              { netWorth: 126000, meetingFinancialGoal: true },
              { netWorth: 136000, meetingFinancialGoal: true },
              { netWorth: 146000, meetingFinancialGoal: true }
            ],
            [
              { netWorth: 4000, meetingFinancialGoal: false },
              { netWorth: 14000, meetingFinancialGoal: false },
              { netWorth: 24000, meetingFinancialGoal: true },
              { netWorth: 34000, meetingFinancialGoal: true },
              { netWorth: 44000, meetingFinancialGoal: true },
              { netWorth: 54000, meetingFinancialGoal: true },
              { netWorth: 64000, meetingFinancialGoal: true },
              { netWorth: 74000, meetingFinancialGoal: true },
              { netWorth: 84000, meetingFinancialGoal: true },
              { netWorth: 94000, meetingFinancialGoal: true },
              { netWorth: 104000, meetingFinancialGoal: true },
              { netWorth: 114000, meetingFinancialGoal: true },
              { netWorth: 124000, meetingFinancialGoal: true },
              { netWorth: 134000, meetingFinancialGoal: true },
              { netWorth: 144000, meetingFinancialGoal: true }
            ]
          ],
          investmentValueArrays: [
            [
              { "stock A": 500, "stock B": 300 },
              { "stock A": 5500, "stock B": 600 },
              { "stock A": 10500, "stock B": 900 },
              { "stock A": 15500, "stock B": 1200 },
              { "stock A": 20500, "stock B": 1500 },
              { "stock A": 25500, "stock B": 1800 },
              { "stock A": 30500, "stock B": 2100 },
              { "stock A": 35500, "stock B": 2400 },
              { "stock A": 40500, "stock B": 2700 },
              { "stock A": 45500, "stock B": 3000 },
              { "stock A": 50500, "stock B": 3300 },
              { "stock A": 55500, "stock B": 3600 },
              { "stock A": 60500, "stock B": 3900 },
              { "stock A": 65500, "stock B": 4200 },
              { "stock A": 70500, "stock B": 4500 }
            ],
            [
              { "stock A": 600, "stock B": 400 },
              { "stock A": 6600, "stock B": 800 },
              { "stock A": 12600, "stock B": 1200 },
              { "stock A": 18600, "stock B": 1600 },
              { "stock A": 24600, "stock B": 2000 },
              { "stock A": 30600, "stock B": 2400 },
              { "stock A": 36600, "stock B": 2800 },
              { "stock A": 42600, "stock B": 3200 },
              { "stock A": 48600, "stock B": 3600 },
              { "stock A": 54600, "stock B": 4000 },
              { "stock A": 60600, "stock B": 4400 },
              { "stock A": 66600, "stock B": 4800 },
              { "stock A": 72600, "stock B": 5200 },
              { "stock A": 78600, "stock B": 5600 },
              { "stock A": 84600, "stock B": 6000 }
            ],
            [
              { "stock A": 400, "stock B": 500 },
              { "stock A": 4400, "stock B": 1000 },
              { "stock A": 8400, "stock B": 1500 },
              { "stock A": 12400, "stock B": 2000 },
              { "stock A": 16400, "stock B": 2500 },
              { "stock A": 20400, "stock B": 3000 },
              { "stock A": 24400, "stock B": 3500 },
              { "stock A": 28400, "stock B": 4000 },
              { "stock A": 32400, "stock B": 4500 },
              { "stock A": 36400, "stock B": 5000 },
              { "stock A": 40400, "stock B": 5500 },
              { "stock A": 44400, "stock B": 6000 },
              { "stock A": 48400, "stock B": 6500 },
              { "stock A": 52400, "stock B": 7000 },
              { "stock A": 56400, "stock B": 7500 }
            ]
          ]
        }
      },
      {
        parameterValue: 20,
        resultForGraph: {
          yearlyResults: [
            [
              { netWorth: 5000, meetingFinancialGoal: false },
              { netWorth: 15000, meetingFinancialGoal: true },
              { netWorth: 25000, meetingFinancialGoal: true },
              { netWorth: 35000, meetingFinancialGoal: true },
              { netWorth: 45000, meetingFinancialGoal: true },
              { netWorth: 55000, meetingFinancialGoal: true },
              { netWorth: 65000, meetingFinancialGoal: true },
              { netWorth: 75000, meetingFinancialGoal: true },
              { netWorth: 85000, meetingFinancialGoal: true },
              { netWorth: 95000, meetingFinancialGoal: true },
              { netWorth: 105000, meetingFinancialGoal: true },
              { netWorth: 115000, meetingFinancialGoal: true },
              { netWorth: 125000, meetingFinancialGoal: true },
              { netWorth: 135000, meetingFinancialGoal: true },
              { netWorth: 145000, meetingFinancialGoal: true },
              { netWorth: 155000, meetingFinancialGoal: true },
              { netWorth: 165000, meetingFinancialGoal: true },
              { netWorth: 175000, meetingFinancialGoal: true },
              { netWorth: 185000, meetingFinancialGoal: true },
              { netWorth: 195000, meetingFinancialGoal: true }
            ],
            [
              { netWorth: 7000, meetingFinancialGoal: false },
              { netWorth: 17000, meetingFinancialGoal: true },
              { netWorth: 27000, meetingFinancialGoal: true },
              { netWorth: 37000, meetingFinancialGoal: true },
              { netWorth: 47000, meetingFinancialGoal: true },
              { netWorth: 57000, meetingFinancialGoal: true },
              { netWorth: 67000, meetingFinancialGoal: true },
              { netWorth: 77000, meetingFinancialGoal: true },
              { netWorth: 87000, meetingFinancialGoal: true },
              { netWorth: 97000, meetingFinancialGoal: true },
              { netWorth: 107000, meetingFinancialGoal: true },
              { netWorth: 117000, meetingFinancialGoal: true },
              { netWorth: 127000, meetingFinancialGoal: true },
              { netWorth: 137000, meetingFinancialGoal: true },
              { netWorth: 147000, meetingFinancialGoal: true },
              { netWorth: 157000, meetingFinancialGoal: true },
              { netWorth: 167000, meetingFinancialGoal: true },
              { netWorth: 177000, meetingFinancialGoal: true },
              { netWorth: 187000, meetingFinancialGoal: true },
              { netWorth: 197000, meetingFinancialGoal: true }
            ]
          ],
          investmentValueArrays: [
            [
              { "stock A": 500, "stock B": 300 },
              { "stock A": 5500, "stock B": 600 },
              { "stock A": 10500, "stock B": 900 },
              { "stock A": 15500, "stock B": 1200 },
              { "stock A": 20500, "stock B": 1500 },
              { "stock A": 25500, "stock B": 1800 },
              { "stock A": 30500, "stock B": 2100 },
              { "stock A": 35500, "stock B": 2400 },
              { "stock A": 40500, "stock B": 2700 },
              { "stock A": 45500, "stock B": 3000 },
              { "stock A": 50500, "stock B": 3300 },
              { "stock A": 55500, "stock B": 3600 },
              { "stock A": 60500, "stock B": 3900 },
              { "stock A": 65500, "stock B": 4200 },
              { "stock A": 70500, "stock B": 4500 },
              { "stock A": 75500, "stock B": 4800 },
              { "stock A": 80500, "stock B": 5100 },
              { "stock A": 85500, "stock B": 5400 },
              { "stock A": 90500, "stock B": 5700 },
              { "stock A": 95500, "stock B": 6000 }
            ],
            [
              { "stock A": 700, "stock B": 400 },
              { "stock A": 7700, "stock B": 800 },
              { "stock A": 14700, "stock B": 1200 },
              { "stock A": 21700, "stock B": 1600 },
              { "stock A": 28700, "stock B": 2000 },
              { "stock A": 35700, "stock B": 2400 },
              { "stock A": 42700, "stock B": 2800 },
              { "stock A": 49700, "stock B": 3200 },
              { "stock A": 56700, "stock B": 3600 },
              { "stock A": 63700, "stock B": 4000 },
              { "stock A": 70700, "stock B": 4400 },
              { "stock A": 77700, "stock B": 4800 },
              { "stock A": 84700, "stock B": 5200 },
              { "stock A": 91700, "stock B": 5600 },
              { "stock A": 98700, "stock B": 6000 },
              { "stock A": 105700, "stock B": 6400 },
              { "stock A": 112700, "stock B": 6800 },
              { "stock A": 119700, "stock B": 7200 },
              { "stock A": 126700, "stock B": 7600 },
              { "stock A": 133700, "stock B": 8000 }
            ]
          ]
        }
      }
    ]
  };

  // Process the data based on selected quantity
  const processData = () => {
    return mockData.results.map(result => {
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
            name: `${parameterValue} ${mockData.parameterName}`
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
            name: `${parameterValue} ${mockData.parameterName}`
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
              name={`${paramData.parameterValue} ${mockData.parameterName}`}
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

export default Mock;