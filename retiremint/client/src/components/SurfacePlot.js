import React, { useState } from 'react';
import Plot from 'react-plotly.js';

const mockData = {
  parameterNameOne: "duration",
  parameterNameTwo: "value",
  parameterValuesOne: [10, 15],
  parameterValuesTwo: [20, 30],
  results: [
    {
      parameterValueOne: 10,
      parameterValueTwo: 20,
      resultForGraph: {
        yearlyResults: [
          [
            { netWorth: 5000, meetingFinancialGoal: false },
            { netWorth: 15000, meetingFinancialGoal: true },
            { netWorth: 25000, meetingFinancialGoal: false }
          ],
          [
            { netWorth: 6000, meetingFinancialGoal: true },
            { netWorth: 16000, meetingFinancialGoal: true },
            { netWorth: 26000, meetingFinancialGoal: true }
          ]
        ],
        investmentValueArrays: [
          [
            { "stockA": 100, "stockB": 100 },
            { "stockA": 200, "stockB": 200 },
            { "stockA": 300, "stockB": 300 }
          ],
          [
            { "stockA": 150, "stockB": 150 },
            { "stockA": 250, "stockB": 250 },
            { "stockA": 350, "stockB": 350 }
          ]
        ]
      }
    },
    {
      parameterValueOne: 10,
      parameterValueTwo: 30,
      resultForGraph: {
        yearlyResults: [
          [
            { netWorth: 7000, meetingFinancialGoal: false },
            { netWorth: 17000, meetingFinancialGoal: true },
            { netWorth: 27000, meetingFinancialGoal: true }
          ],
          [
            { netWorth: 8000, meetingFinancialGoal: true },
            { netWorth: 18000, meetingFinancialGoal: true },
            { netWorth: 28000, meetingFinancialGoal: true }
          ]
        ],
        investmentValueArrays: [
          [
            { "stockA": 200, "stockB": 200 },
            { "stockA": 300, "stockB": 300 },
            { "stockA": 400, "stockB": 400 }
          ],
          [
            { "stockA": 250, "stockB": 250 },
            { "stockA": 350, "stockB": 350 },
            { "stockA": 450, "stockB": 450 }
          ]
        ]
      }
    },
    {
      parameterValueOne: 15,
      parameterValueTwo: 20,
      resultForGraph: {
        yearlyResults: [
          [
            { netWorth: 5000, meetingFinancialGoal: false },
            { netWorth: 15000, meetingFinancialGoal: true },
            { netWorth: 25000, meetingFinancialGoal: true },
            { netWorth: 35000, meetingFinancialGoal: true }
          ],
          [
            { netWorth: 6000, meetingFinancialGoal: true },
            { netWorth: 16000, meetingFinancialGoal: true },
            { netWorth: 26000, meetingFinancialGoal: true },
            { netWorth: 36000, meetingFinancialGoal: true }
          ]
        ],
        investmentValueArrays: [
          [
            { "stockA": 100, "stockB": 100 },
            { "stockA": 200, "stockB": 200 },
            { "stockA": 300, "stockB": 300 },
            { "stockA": 400, "stockB": 400 }
          ],
          [
            { "stockA": 150, "stockB": 150 },
            { "stockA": 250, "stockB": 250 },
            { "stockA": 350, "stockB": 350 },
            { "stockA": 450, "stockB": 450 }
          ]
        ]
      }
    },
    {
      parameterValueOne: 15,
      parameterValueTwo: 30,
      resultForGraph: {
        yearlyResults: [
          [
            { netWorth: 7000, meetingFinancialGoal: false },
            { netWorth: 17000, meetingFinancialGoal: true },
            { netWorth: 27000, meetingFinancialGoal: true },
            { netWorth: 37000, meetingFinancialGoal: true }
          ],
          [
            { netWorth: 8000, meetingFinancialGoal: true },
            { netWorth: 18000, meetingFinancialGoal: true },
            { netWorth: 28000, meetingFinancialGoal: true },
            { netWorth: 38000, meetingFinancialGoal: true }
          ]
        ],
        investmentValueArrays: [
          [
            { "stockA": 200, "stockB": 200 },
            { "stockA": 300, "stockB": 300 },
            { "stockA": 400, "stockB": 400 },
            { "stockA": 500, "stockB": 500 }
          ],
          [
            { "stockA": 250, "stockB": 250 },
            { "stockA": 350, "stockB": 350 },
            { "stockA": 450, "stockB": 450 },
            { "stockA": 550, "stockB": 550 }
          ]
        ]
      }
    }
  ]
};

const calculateProbability = (resultForGraph) => {
  const lastYearIndex = resultForGraph.yearlyResults[0].length - 1;
  const total = resultForGraph.yearlyResults.length;
  const successes = resultForGraph.yearlyResults.filter(
    sim => sim[lastYearIndex].meetingFinancialGoal
  ).length;
  return successes / total;
};

const calculateMedianInvestments = (resultForGraph) => {
  const lastYearIndex = resultForGraph.investmentValueArrays[0].length - 1;
  const totals = resultForGraph.investmentValueArrays.map(sim => {
    return Object.values(sim[lastYearIndex]).reduce((sum, val) => sum + val, 0);
  });
  totals.sort((a, b) => a - b);
  return totals[Math.floor(totals.length / 2)];
};

const prepareSurfaceData = (mockData, zType) => {
  const x = [...new Set(mockData.results.map(r => r.parameterValueOne))].sort();
  const y = [...new Set(mockData.results.map(r => r.parameterValueTwo))].sort();
  const z = x.map(xVal => 
    y.map(yVal => {
      const result = mockData.results.find(
        r => r.parameterValueOne === xVal && r.parameterValueTwo === yVal
      );
      return zType === 'probability' 
        ? calculateProbability(result.resultForGraph) 
        : calculateMedianInvestments(result.resultForGraph);
    })
  );
  return { x, y, z };
};

const SurfacePlot = () => {
  const [zAxis, setZAxis] = useState('probability');

  const { x, y, z } = prepareSurfaceData(mockData, zAxis);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <label>
          <input
            type="radio"
            checked={zAxis === 'probability'}
            onChange={() => setZAxis('probability')}
          />
          Probability of Success
        </label>
        <label style={{ marginLeft: 20 }}>
          <input
            type="radio"
            checked={zAxis === 'investment'}
            onChange={() => setZAxis('investment')}
          />
          Median Investments ($)
        </label>
      </div>

      <Plot
        data={[
            {
            type: 'surface',
            x: x, // [10, 15]
            y: y, // [20, 30]
            z: z,
            colorscale: zAxis === 'probability' ? 'Viridis' : 'Hot',
            colorbar: {
                title: zAxis === 'probability' ? 'Probability' : 'Amount ($)',
            },
            // Force discrete axis ticks
            contours: {
                x: { show: true, start: 10, end: 15, size: 5 }, // Exact steps for X
                y: { show: true, start: 20, end: 30, size: 10 }, // Exact steps for Y
            },
            },
        ]}
        layout={{
            title: `${zAxis === 'probability' 
            ? 'Probability of Success' 
            : 'Median Investments'} vs. Duration and Value`,
            scene: {
            xaxis: { 
                title: mockData.parameterNameOne,
                tickvals: x, // Explicitly set X ticks [10, 15]
                tickmode: 'array',
            },
            yaxis: { 
                title: mockData.parameterNameTwo,
                tickvals: y, // Explicitly set Y ticks [20, 30]
                tickmode: 'array',
            },
            zaxis: { 
                title: zAxis === 'probability' 
                ? 'Success Probability' 
                : 'Median Investments ($)',
            },
            },
            margin: { t: 40, b: 40, l: 60, r: 60 },
        }}
        config={{ responsive: true }}
        style={{ width: '100%', height: '600px' }}
        />
    </div>
  );
};

export default SurfacePlot;