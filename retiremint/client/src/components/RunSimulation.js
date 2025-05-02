import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Stylesheets/RunSimulation.css';

const RunSimulation = ({ scenarioId, scenarioName }) => {
  const [numSimulations, setNumSimulations] = useState(100);
  const [reportName, setReportName] = useState(`Simulation Report for ${scenarioName}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scenarioId) {
      setError('No scenario selected. Please select a scenario first.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('http://localhost:8000/simulation/run', {
        scenarioId,
        numSimulations,
        userId,
        reportName
      });
      
      // Store the reportId in localStorage for easy access
      localStorage.setItem('latestReportId', response.data.reportId);
      
      // Navigate to the results page
      navigate(`/simulation-results/${response.data.reportId}`);
    } catch (err) {
      console.error('Error running simulation:', err);
      setError('Error running simulation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="run-simulation-container">
      <h2>Run Simulation for {scenarioName}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div>
            <label>Report Name:</label>
            <input 
              type='text' 
              id='reportName' 
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="numSimulations">Number of Simulations:</label>
            <input
              type="number"
              id="numSimulations"
              value={numSimulations}
              onChange={(e) => setNumSimulations(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="1000"
              required
            />
            <p className="help-text">More simulations provide more accurate results but take longer to run. Recommended: 100-500.</p>
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </form>
      
      {loading && (
        <div className="loading-message">
          <p>Running Monte Carlo simulations... This may take a moment.</p>
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default RunSimulation; 