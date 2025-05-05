import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Stylesheets/RunSimulation.css';

const RunSimulation = ({ scenarioId, scenarioName }) => {
  const [numSimulations, setNumSimulations] = useState(100);
  const [reportName, setReportName] = useState(`Simulation Report for ${scenarioName}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [scenario, setScenario] = useState(null);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [exploreMode, setExploreMode] = useState('one-dimensional');
  const [scenarioParameter, setScenarioParameter] = useState('');
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');
  const [stepSize, setStepSize] = useState('');
  const [parameterEvent, setParameterEvent] = useState('');


  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Fetch Scenario Data (to fetch events/investments data for Scenario Exploration)
  useEffect(() => {
    try{
      const fetchScenario = async () => {
        const response = await axios.post(`http://localhost:8000/simulation/scenario/data`, {scenarioId: scenarioId});  
        setScenario(response.data);
        const responseEvents = await axios.post(`http://localhost:8000/simulation/scenario/events`, {scenarioId: response.data._id});
        setEvents(responseEvents.data.events); 
        const responseSettings = await axios.post(`http://localhost:8000/simulation/scenario/settings`, {scenarioId: response.data._id});
        setSettings(responseSettings.data.settings);
      }
      fetchScenario();
    }
    catch(error) {
      console.error('Error fetching scenario:', error);
      setError('Error loading scenario');
    }

  }, [scenarioId])

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scenarioId) {
      setError('No scenario selected. Please select a scenario first.');
      return;
    }
    
    if (exploreMode === 'none') {
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
    }
    else if (exploreMode === 'one-dimensional') {
      try {
        setLoading(true);
        setError(null);

        if (scenarioParameter === '') {
          setError('Invalid Scenario Parameter')
          setLoading(false);
        }
        else if (lowerBound === NaN || upperBound === NaN || stepSize === NaN){
          setError('Invalid set of values (among Upper Bound, Lower Bound, or Step Size')
          setLoading(false);
        }
        else if (lowerBound >= upperBound) {
          setError('Lower Bound cannot be greater than or equal to the lower Bound');
          setLoading(false);
        }
        else {
          const simResults = [];
          const parameterValues = [];
          for (let i = lowerBound; i < upperBound; i += stepSize) {
            parameterValues.push(i);
            // Create a temporary scenario that has the scenario parameter changed. 
            const tempScenarioResponse = await axios.post('http://localhost:8000/simulation/explore-scenario/create', {
              scenarioId: scenarioId,
              scenarioParameter: scenarioParameter,
              parameterEventId: parameterEvent,
              changedValue: i,
            });

            // Run Simulations on Temporary Adjusted Scenario:
            const simulationResponse = await axios.post('http://localhost:8000/simulation/run', {
              scenarioId: tempScenarioResponse.data.scenarioId,
              numSimulations,
              userId,
              reportName
            });

            simResults.push({parameterValue: i ,resultForGraph: simulationResponse.data.results});
            //console.log("Temporary Scenario: ", response.data.scenarioId);
            // Delete temporary scenario, saving the results.
          }
          const exploreResults = {parameterName: scenarioParameter, parameterValues: parameterValues, results: simResults}
          console.log(exploreResults);
        }
        
        /*
        
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
        */
      } catch (err) {
        console.error('Error running simulation:', err);
        setError('Error running simulation. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="run-simulation-container">
      <h2>Run Simulation for {scenarioName}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <select value={exploreMode} onChange={(e) => setExploreMode(e.target.value)}>
        <option value={'none'}>Run Simulations</option>
        <option value={'one-dimensional'}>One-Dimensional Scenario Exploration</option>
        <option value={'two-dimensional'}>Two-Dimensional Scenario Exploration</option>
      </select>

      {exploreMode === 'none' ? 
        <>
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
        </> 
      : exploreMode === 'one-dimensional' ? 
      <>
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
          <div>
            <label>Scenario Parameter</label>
            <select value={scenarioParameter} onChange={(e) => setScenarioParameter(e.target.value)}>
              <option value={''}>--Choose a Scenario Parameter--</option>
              {settings !== null && settings.rothOptimizerEnable === true && (
                <option value={"roth-optimizer"}>Roth Optimizer</option>
              )}
              <option value={"event-start-year"}>Event Series Start Year</option>
              <option value={"event-duration"}>Event Series Duration</option>
              <option value={"event-initial-amount"}>Event Series Initial Amount</option>
              <option value={"investment-allocation"}>Investment Allocation Percentage</option>
            </select>
          </div>
          <div>
            {(scenarioParameter === 'roth-optimizer') ? 
              <div>
                <input
                  type='checkbox'
                />
                <label>Roth Optimizer Enabled</label>
              </div>
              : (scenarioParameter !== '') && (
                <>
                <label>Lower Bound</label>
                <input type='number' value={lowerBound} onChange={(e) => setLowerBound(parseInt(e.target.value))}/>

                <label>Upper Bound</label>
                <input type='number' value={upperBound} onChange={(e) => setUpperBound(parseInt(e.target.value))}/>

                <label>Step Size</label>
                <input type='number' value={stepSize} onChange={(e) => setStepSize(parseInt(e.target.value))}/>
                
                {(scenarioParameter === 'event-start-year' || scenarioParameter === 'event-duration') && (
                  <>
                    <label>Choose Event Series</label>
                    <select value={parameterEvent} onChange={(e) => {setParameterEvent(e.target.value); console.log(parameterEvent);}}>
                      <option value={''}>-- Choose --</option>
                      {events.map((event,index) => (<option key={index} value={event._id}>{event.name}</option>))}
                    </select>
                  </>
                )}

                {(scenarioParameter === 'event-initial-amount') && (
                  <>
                    <label>Choose Income / Expense Event Series</label>
                    <select>
                      <option value={''}>-- Choose --</option>
                      {(events.filter((event) => (event.type === 'income' || event.type === 'expense'))).map((event,index) => (<option key={index} value={event._id}>{event.name}</option>))}

                    </select>
                  </>
                )}

                {(scenarioParameter === 'investment-allocation') && (
                  <>
                    <label>Choose Invest Event</label>
                    <select>
                      <option value={''}>-- Choose --</option>
                      {(events.filter((event) => (event.type === 'invest'))).map((event,index) => (<option key={index} value={event._id}>{event.name}</option>))}
                      {/* Return to this */}
                    </select>
                  </>
                )}
                </>
              )
            }
          </div>
        </div>
        
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </form>
      </> 
      : 
        <>
          
        </>
      }
      
      
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