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

const prepareContourData = (mockData, zType) => {
  const x = [...new Set(mockData.results.map(r => r.parameterValueOne))].sort((a, b) => a - b);
  const y = [...new Set(mockData.results.map(r => r.parameterValueTwo))].sort((a, b) => a - b);
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

const ContourPlot = () => {
  const [zAxis, setZAxis] = useState('probability');
  const { x, y, z } = prepareContourData(mockData, zAxis);

  return (
    <div style={{ width: '100%', height: '100%', padding: '20px' }}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <label style={{ marginRight: 15 }}>
          <input
            type="radio"
            checked={zAxis === 'probability'}
            onChange={() => setZAxis('probability')}
            style={{ marginRight: 5 }}
          />
          Probability of Success
        </label>
        <label>
          <input
            type="radio"
            checked={zAxis === 'investment'}
            onChange={() => setZAxis('investment')}
            style={{ marginRight: 5 }}
          />
          Median Investments ($)
        </label>
      </div>

      <Plot
        data={[
          {
            type: 'contour',
            x: x,
            y: y,
            z: z,
            colorscale: zAxis === 'probability' ? 'Viridis' : 'Hot',
            connectgaps: true,
            contours: {
              coloring: 'heatmap',
              showlabels: true,
              labelfont: {
                size: 12,
                color: 'white'
              }
            },
            colorbar: {
              title: zAxis === 'probability' ? 'Probability' : 'Amount ($)',
              titleside: 'right'
            },
            hoverinfo: 'x+y+z',
            hoverlabel: {
              bgcolor: '#333',
              font: {
                color: 'white'
              }
            }
          },
        ]}
        layout={{
          title: {
            text: `${zAxis === 'probability' 
              ? 'Probability of Success' 
              : 'Median Investments'} Contour Plot`,
            font: {
              size: 16
            }
          },
          xaxis: {
            title: mockData.parameterNameOne,
            tickvals: x,
            tickmode: 'array',
            gridcolor: '#eee'
          },
          yaxis: {
            title: mockData.parameterNameTwo,
            tickvals: y,
            tickmode: 'array',
            gridcolor: '#eee'
          },
          margin: { t: 60, b: 60, l: 60, r: 60 },
          plot_bgcolor: '#f9f9f9',
          paper_bgcolor: '#f9f9f9',
          autosize: true
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false
        }}
        style={{ width: '100%', height: '500px', margin: '0 auto' }}
        useResizeHandler={true}
      />
    </div>
  );
};

export default ContourPlot;