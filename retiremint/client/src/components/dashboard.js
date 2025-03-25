import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './header';
import RunSimulation from './RunSimulation';
import '../Stylesheets/Dashboard.css';

function Dashboard() {
    const [scenarios, setScenarios] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [showSimulationForm, setShowSimulationForm] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Memoize fetchUserData to prevent infinite re-renders
    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');
            if (userId) {
                // Fetch user's scenarios
                const scenariosResponse = await axios.get(`http://localhost:8000/user/${userId}/scenarios`);
                setScenarios(scenariosResponse.data);
                
                // Fetch user's simulation reports
                const reportsResponse = await axios.get(`http://localhost:8000/simulation/reports/${userId}`);
                setReports(reportsResponse.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch user's scenarios and reports when component mounts
        fetchUserData();
    }, [fetchUserData]);

    const handleNewScenario = () => {
        navigate('/new-scenario');
    };

    const handleSelectScenario = (scenario) => {
        setSelectedScenario(scenario);
        setShowSimulationForm(true);
    };

    const handleViewReport = (reportId) => {
        navigate(`/simulation-results/${reportId}`);
    };

    const handleDeleteReport = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await axios.delete(`http://localhost:8000/simulation/report/${reportId}`);
                setReports(reports.filter(report => report._id !== reportId));
            } catch (err) {
                console.error('Error deleting report:', err);
                setError('Failed to delete the report. Please try again later.');
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container loading">
                <Header />
                <div className="loading-spinner"></div>
                <p>Loading your financial data...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Header />
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="dashboard-actions">
                <button onClick={handleNewScenario} className="action-button">
                    Create New Scenario
                </button>
            </div>
            
            <div className="dashboard-content">
                <div className="scenarios-section">
                    <h2>Your Financial Scenarios</h2>
                    
                    {scenarios.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't created any scenarios yet.</p>
                            <button onClick={handleNewScenario}>Create Your First Scenario</button>
                        </div>
                    ) : (
                        <div className="scenarios-list">
                            {scenarios.map(scenario => (
                                <div key={scenario._id} className="scenario-card">
                                    <h3>{scenario.name}</h3>
                                    <p>{scenario.description || 'No description'}</p>
                                    <div className="scenario-details">
                                        <p>Type: {scenario.scenario_type}</p>
                                        <p>Financial Goal: ${scenario.financial_goal?.toLocaleString() || 0}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleSelectScenario(scenario)}
                                        className="run-simulation-button"
                                    >
                                        Run Simulation
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="reports-section">
                    <h2>Recent Simulation Reports</h2>
                    
                    {reports.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't run any simulations yet.</p>
                            {scenarios.length > 0 && (
                                <p>Select a scenario and run a simulation to see results.</p>
                            )}
                        </div>
                    ) : (
                        <div className="reports-list">
                            {reports.map(report => (
                                <div key={report._id} className="report-card">
                                    <h3>{report.name}</h3>
                                    <div className="report-details">
                                        <p>Date: {new Date(report.createdAt).toLocaleDateString()}</p>
                                        <p>Success Rate: {report.successRate?.toFixed(2)}%</p>
                                    </div>
                                    <div className="report-actions">
                                        <button 
                                            onClick={() => handleViewReport(report._id)}
                                            className="view-report-button"
                                        >
                                            View Results
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteReport(report._id)}
                                            className="delete-report-button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {showSimulationForm && selectedScenario && (
                <div className="simulation-form-overlay">
                    <div className="simulation-form-container">
                        <button 
                            className="close-button"
                            onClick={() => setShowSimulationForm(false)}
                        >
                            ×
                        </button>
                        <RunSimulation 
                            scenarioId={selectedScenario._id} 
                            scenarioName={selectedScenario.name} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
