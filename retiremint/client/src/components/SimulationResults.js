import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../Stylesheets/SimulationResults.css';
import Header from './HeaderComp';
import Graph from './Graph';
import GraphTwo from './GraphTwo';

const SimulationResults = () => {
  const { reportId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [graphOne, setGraphOne] = useState(null);
  const [financialGoal, setFinancialGoal] = useState(null);
  const [graphTwoInvestment, setGraphTwoInvestment] = useState(null);
  const [graphTwoExpense, setGraphTwoExpense] = useState(null); // NEW
  const [graphTwoEarlyWithdrawalTax, setGraphTwoEarlyWithdrawalTax] = useState(null); // NEW

  useEffect(() => {
    axios.get(`http://localhost:8000/simulation/report/${reportId}`)
      .then(res => {
        setReportData(res.data);
        console.log('Full report data:', res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load report:', err);
        setLoading(false);
      });
  }, [reportId]);

  useEffect(() => {
    if (!loading && reportData) {

      setFinancialGoal(reportData.financialGoal);

      const simulations = reportData.resultForGraph?.yearlyResults || [];

      const goalCounts = [];
      const yearSuccessCounts = [];
      const yearTotalCounts = [];

      simulations.forEach(simulation => {
        simulation.forEach((yearData, yearIndex) => {
          yearTotalCounts[yearIndex] = (yearTotalCounts[yearIndex] || 0) + 1;
          if (yearData.meetingFinancialGoal) {
            yearSuccessCounts[yearIndex] = (yearSuccessCounts[yearIndex] || 0) + 1;
            goalCounts[yearIndex] = (goalCounts[yearIndex] || 0) + 1;
          } else {
            yearSuccessCounts[yearIndex] = yearSuccessCounts[yearIndex] || 0;
            goalCounts[yearIndex] = goalCounts[yearIndex] || 0;
          }
        });
      });

      const probabilities = yearSuccessCounts.map((successCount, i) => {
        const rawProbability = successCount / yearTotalCounts[i];
        return Math.round(rawProbability * 10000) / 100;
      });

      setGraphOne(probabilities);

      // Helper function to compute percentiles from a 2D array
      const computePercentiles = (valueArrays) => {
        const percentilesData = [];
        const maxLength = Math.max(...valueArrays.map(arr => arr.length));

        for (let yearIndex = 0; yearIndex < maxLength; yearIndex++) {
          const yearValues = valueArrays.map(sim => sim[yearIndex] || null).filter(v => v !== null);
          const sorted = yearValues.sort((a, b) => a - b);

          const yearPercentiles = [];
          for (let i = 1; i <= 9; i++) {
            const index = Math.floor((i / 10) * sorted.length);
            yearPercentiles.push({ percentile: i * 10, value: sorted[index] });
          }

          percentilesData.push(yearPercentiles);
        }

        return percentilesData;
      };

      const investmentValueArrays = reportData.resultForGraph?.investmentValueArrays || [];
      const expensesArrays = reportData.resultForGraph?.expensesArrays || [];
      const earlyWithdrawalArrays = reportData.resultForGraph?.earlyWithdrawalArrays || []; 

      setGraphTwoInvestment(computePercentiles(investmentValueArrays));
      setGraphTwoExpense(computePercentiles(expensesArrays)); 
      setGraphTwoEarlyWithdrawalTax(computePercentiles(earlyWithdrawalArrays)); 
    }
  }, [loading, reportData]);

  return (
    <>
      <Header />
      <div className="simulation-results-container">
        {!loading && reportData && <h1>{reportData.name}</h1>}
        <Graph graphOne={graphOne} />
        <GraphTwo graphTwoInvestment={graphTwoInvestment} financialGoal={financialGoal} graphTwoExpense={graphTwoExpense} graphTwoEarlyWithdrawalTax={graphTwoEarlyWithdrawalTax}/>
      </div>
    </>
  );
};

export default SimulationResults;
