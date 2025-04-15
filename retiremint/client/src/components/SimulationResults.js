import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../Stylesheets/SimulationResults.css';

const SimulationResults = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState('today'); // 'today' or 'future'
  const [error, setError] = useState(null);
  const [visualizations, setVisualizations] = useState(null);
  const navigate = useNavigate();
  const { reportId } = useParams();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // If reportId is provided, fetch that specific report
        if (reportId) {
          const response = await axios.get(`http://localhost:8000/simulation/report/${reportId}`);
          console.log('Fetched report data:', response.data);
          setReport(response.data);
          generateVisualizations(response.data);
        } else {
          // Otherwise use the latest report (from local storage if available)
          const latestReportId = localStorage.getItem('latestReportId');
          if (latestReportId) {
            const response = await axios.get(`http://localhost:8000/simulation/report/${latestReportId}`);
            console.log('Fetched report data:', response.data);
            setReport(response.data);
            generateVisualizations(response.data);
          } else {
            setError('No report available. Please run a simulation first.');
          }
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Error loading simulation results');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  // Generate visualizations from report data
  const generateVisualizations = (reportData) => {
    if (!reportData || !reportData.simulationResults || reportData.simulationResults.length === 0) {
      console.error('Invalid report data for visualizations: simulationResults array is empty or missing');
      // Log more details about the report data to help debugging
      console.log('Report data structure:', {
        hasReport: !!reportData,
        hasSimulationResults: reportData && !!reportData.simulationResults,
        simulationResultsLength: reportData && reportData.simulationResults ? reportData.simulationResults.length : 0,
        successRate: reportData ? reportData.successRate : 'N/A',
        finalAssetStats: reportData && reportData.finalAssetStatistics ? 
          Object.keys(reportData.finalAssetStatistics).join(', ') : 'N/A'
      });
      
      // Try to use assetTrajectories if available, even if simulationResults is empty
      if (reportData && reportData.assetTrajectories && 
          reportData.assetTrajectories.xAxis && reportData.assetTrajectories.xAxis.length > 0) {
        console.log('Using assetTrajectories data for visualization instead of simulationResults');
        
        const { xAxis, yAxis } = reportData.assetTrajectories;
        
        // Create time series data from trajectories
        const timeSeriesData = [
          {
            x: xAxis,
            y: yAxis.median,
            type: 'scatter',
            mode: 'lines',
            name: 'Median',
            line: { color: '#2196F3', width: 3 }
          },
          {
            x: xAxis,
            y: yAxis.p90,
            type: 'scatter',
            mode: 'lines',
            name: '90th Percentile',
            line: { color: '#4CAF50', width: 2, dash: 'dot' }
          },
          {
            x: xAxis,
            y: yAxis.p10,
            type: 'scatter',
            mode: 'lines',
            name: '10th Percentile',
            line: { color: '#F44336', width: 2, dash: 'dot' }
          }
        ];
        
        // Create pie chart from success rate
        const pieData = [{
          values: [reportData.successRate || 0, 100 - (reportData.successRate || 0)],
          labels: ['Success', 'Failure'],
          type: 'pie',
          marker: {
            colors: ['#4CAF50', '#F44336']
          }
        }];
        
        // Set visualizations with the trajectories data
        setVisualizations({
          timeSeries: {
            data: timeSeriesData,
            layout: {
              title: 'Asset Trajectory Over Time',
              xaxis: { title: 'Year' },
              yaxis: { title: 'Total Assets' }
            }
          },
          pie: {
            data: pieData,
            layout: {
              title: 'Success vs Failure Rate'
            }
          },
          histogram: {
            data: [{
              x: [reportData.finalAssetStatistics?.min || 0, 
                  reportData.finalAssetStatistics?.mean || 0, 
                  reportData.finalAssetStatistics?.max || 0],
              type: 'histogram',
              marker: {
                color: '#2196F3'
              },
              nbinsx: 3
            }],
            layout: {
              title: 'Distribution of Final Asset Values',
              xaxis: { title: 'Asset Value' },
              yaxis: { title: 'Frequency' }
            }
          }
        });
        return;
      }
      
      return;
    }

    try {
      // First, check if we have properly structured data with yearlyResults
      const firstSim = reportData.simulationResults[0];
      console.log('First simulation data:', {
        id: firstSim.simulationId,
        success: firstSim.success,
        hasYearlyResults: !!firstSim.yearlyResults,
        yearlyResultsLength: firstSim.yearlyResults ? firstSim.yearlyResults.length : 0,
        hasFinalTotalAssets: 'finalTotalAssets' in firstSim,
        hasFinalState: !!firstSim.finalState
      });
      
      if (!firstSim || !firstSim.yearlyResults || !Array.isArray(firstSim.yearlyResults) || firstSim.yearlyResults.length === 0) {
        console.error('Invalid yearlyResults data structure in simulationResults');
        return;
      }

      // Extract years and prepare data for time series
      const years = firstSim.yearlyResults.map(yr => yr.year);
      
      // Prepare data for asset trajectory visualization
      const timeSeriesData = [];
      
      // Add lines for a sample of simulations (up to 5)
      const sampleSize = Math.min(5, reportData.simulationResults.length);
      for (let i = 0; i < sampleSize; i++) {
        const simulation = reportData.simulationResults[i];
        if (simulation && simulation.yearlyResults && simulation.yearlyResults.length > 0) {
          timeSeriesData.push({
            x: years,
            y: simulation.yearlyResults.map(yr => yr.totalAssets || 0),
            type: 'scatter',
            mode: 'lines',
            name: `Simulation ${i+1}`
          });
        }
      }
      
      // Prepare data for pie chart (success vs failure)
      const successRate = reportData.successRate || 0;
      const pieData = [{
        values: [successRate, 100 - successRate],
        labels: ['Success', 'Failure'],
        type: 'pie',
        marker: {
          colors: ['#4CAF50', '#F44336']
        }
      }];
      
      // Prepare data for histogram of final assets
      const finalAssets = reportData.simulationResults
        .filter(sim => {
          // Check both possible data structures
          return sim && (
            (typeof sim.finalTotalAssets === 'number') || 
            (sim.finalState && typeof sim.finalState.totalAssets === 'number')
          );
        })
        .map(sim => {
          // Return the asset value from whichever property exists
          return sim.finalTotalAssets || (sim.finalState ? sim.finalState.totalAssets : 0);
        });
      
      // Create bins for histogram only if we have data
      const histogramData = finalAssets.length > 0 ? [{
        x: finalAssets,
        type: 'histogram',
        marker: {
          color: '#2196F3'
        },
        nbinsx: 10
      }] : [{
        x: [0],
        type: 'histogram',
        marker: {
          color: '#2196F3'
        }
      }];
      
      if (timeSeriesData.length === 0 || finalAssets.length === 0) {
        console.warn('Visualization data is empty, using placeholders');
      }
      
      setVisualizations({
        timeSeries: {
          data: timeSeriesData.length > 0 ? timeSeriesData : [{
            x: [new Date().getFullYear(), new Date().getFullYear() + 1],
            y: [0, 0],
            type: 'scatter',
            mode: 'lines',
            name: 'No data'
          }],
          layout: {
            title: 'Asset Trajectory Over Time',
            xaxis: { title: 'Year' },
            yaxis: { title: 'Total Assets' }
          }
        },
        pie: {
          data: pieData,
          layout: {
            title: 'Success vs Failure Rate'
          }
        },
        histogram: {
          data: histogramData,
          layout: {
            title: 'Distribution of Final Asset Values',
            xaxis: { title: 'Asset Value' },
            yaxis: { title: 'Frequency' }
          }
        }
      });
    } catch (error) {
      console.error('Error generating visualizations:', error);
    }
  };

  const handleCurrencyToggle = () => {
    setDisplayCurrency(prev => prev === 'today' ? 'future' : 'today');
  };

  const exportReport = () => {
    // Create a JSON blob for downloading
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `report_${report._id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Adjust currency values based on display preference
  const adjustForInflation = (value, year, baseYear) => {
    if (displayCurrency === 'today' && report) {
      // Calculate cumulative inflation from baseYear to the given year
      const yearsFromBase = year - baseYear;
      let cumulativeInflation = 1;
      
      // Use the first simulation's inflation rates as an approximation
      if (report.simulationResults && report.simulationResults[0]) {
        const simulation = report.simulationResults[0];
        for (let i = 0; i < yearsFromBase && i < simulation.yearlyResults.length; i++) {
          cumulativeInflation *= (1 + simulation.yearlyResults[i].inflationRate);
        }
      }
      
      // Adjust the value back to today's dollars
      return value / cumulativeInflation;
    }
    return value;
  };

  if (loading) {
    return <div className="loading">Loading simulation results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!report) {
    return <div className="error">No report data available</div>;
  }

  // Extract base year (start year of simulation)
  const baseYear = report.simulationResults[0]?.yearlyResults[0]?.year || new Date().getFullYear();

  return (
    <div className="simulation-results-container">
      <h1>Simulation Results</h1>
      
      <div className="results-controls">
        <button onClick={handleCurrencyToggle}>
          Display in {displayCurrency === 'today' ? 'Future' : 'Today\'s'} Dollars
        </button>
        <button onClick={exportReport}>Export Report</button>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
      
      <div className="summary-stats">
        <h2>Summary</h2>
        <p><strong>Success Rate:</strong> {typeof report.successRate === 'number' && !isNaN(report.successRate) 
          ? report.successRate.toFixed(2) 
          : '0.00'}%</p>
        <p><strong>Financial Goal:</strong> ${(report.financialGoal || 0).toLocaleString()}</p>
        <p><strong>Number of Simulations:</strong> {report.numSimulations || 0}</p>
        <p><strong>Number of Years:</strong> {report.numYears || 0}</p>
      </div>

      <div className="asset-stats">
        <h2>Final Asset Statistics</h2>
        <p><strong>Minimum:</strong> ${(report.finalAssetStatistics?.min || 0).toLocaleString()}</p>
        <p><strong>Maximum:</strong> ${(report.finalAssetStatistics?.max || 0).toLocaleString()}</p>
        <p><strong>Average:</strong> ${(report.finalAssetStatistics?.mean || 0).toLocaleString()}</p>
        <p><strong>Median:</strong> ${(report.finalAssetStatistics?.median || 0).toLocaleString()}</p>
      </div>
      
      {visualizations && (
        <>
          <div className="visualization-container">
            <h2>Asset Distribution</h2>
            <Plot
              data={visualizations.histogram.data.map(trace => ({
                ...trace,
                x: trace.x.map(val => adjustForInflation(val, baseYear + report.numYears, baseYear))
              }))}
              layout={{
                ...visualizations.histogram.layout,
                title: `Distribution of Final Asset Values (${displayCurrency === 'today' ? 'Today\'s' : 'Future'} Dollars)`,
                width: 800,
                height: 500
              }}
              config={{ responsive: true }}
            />
          </div>
          
          <div className="visualization-container">
            <h2>Assets Over Time</h2>
            <Plot
              data={visualizations.timeSeries.data.map(trace => {
                // For line traces
                if (trace.mode === 'lines') {
                  return {
                    ...trace,
                    y: trace.y.map((val, idx) => adjustForInflation(val, trace.x[idx], baseYear))
                  };
                }
                return trace;
              })}
              layout={{
                ...visualizations.timeSeries.layout,
                title: `Asset Values Over Time (${displayCurrency === 'today' ? 'Today\'s' : 'Future'} Dollars)`,
                width: 800,
                height: 500
              }}
              config={{ responsive: true }}
            />
          </div>
          
          <div className="visualization-container">
            <h2>Success vs Failure Rate</h2>
            <Plot
              data={visualizations.pie.data}
              layout={{
                ...visualizations.pie.layout,
                width: 500,
                height: 500
              }}
              config={{ responsive: true }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SimulationResults; 