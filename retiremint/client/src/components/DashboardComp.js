import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './HeaderComp';
import RunSimulation from './RunSimulation';
import '../Stylesheets/Dashboard.css';

function Dashboard() {
    const [scenarios, setScenarios] = useState([]);
    const [reports, setReports] = useState([]);
    const [sharedReportsData, setSharedReportsData] = useState([]);
    const [reportView, setReportView] = useState('users-reports');
    const [loading, setLoading] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [showSimulationForm, setShowSimulationForm] = useState(false);
    const [error, setError] = useState(null);
    const [stateWarning, setStateWarning] = useState(null);
    const [file, setFile] = useState(null);
    const [shareReport, setShareReport] = useState(null);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [sharePermissions, setSharePermissions] = useState('view');
    const [shareError, setShareError] = useState(null);

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
                
                // Fetch reports shared with user and the respective permissions
                const sharedReportsResponse = await axios.get(`http://localhost:8000/simulation/sharedreports/${userId}`)
                const sharedReports = [];
                sharedReportsResponse.data.map((report) => {
                    const userParameters = report.sharedUsers.find((userData) => userData.userId === userId);
                    if (userParameters != undefined) {
                        sharedReports.push({report: report, permissions: userParameters.permissions})
                    }
                })
                setSharedReportsData(sharedReports);

                // Fetch user's data
                const userResponse = await axios.get(`http://localhost:8000/user/${userId}`);
                const userData = userResponse.data;

                // Check if the user's state is in the allowed list
                const allowedStates = ['NY', 'NJ', 'CT', 'TX'];
                if (!allowedStates.includes(userData.state)) {
                    setStateWarning('Your state tax file is not available. You have to fill it out. Without it, all simulations will be done without state tax.');
                }
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
        navigate('/new-scenario/new');
    };

    const handleSelectScenario = (scenario) => {
        setSelectedScenario(scenario);
        setShowSimulationForm(true);
    };

    const handleViewReport = (reportId) => {
        navigate(`/simulation-results/${reportId}`);
    };

    const handleEditReport = async (reportId) => {
        navigate(`/new-scenario/${reportId}`);
    }
    
    const handleEditScenario = async (scenarioId) => {
        console.log("SCENARIOID: ", scenarioId);
        navigate(`/new-scenario/${scenarioId}`);
    }

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

    // Handle opening the Share Menu on a given report.
    const handleShareReport = async (reportId) => {
        try{
            const report = await axios.get(`http://localhost:8000/simulation/report/${reportId}`);
            setShareReport(report.data);
            setShowShareMenu(true);
        }
        catch (error) { 
            console.error('Error opening share menu:', err);
            setError('Failed to open the share menu. Please try again later.');
        }
    }
    // Handle sharing a report with another user by adding it to the Scenario and Report in the DB.
    const handleShareUser = async  () => {        
        if (shareReport) {
            try {
                // Reset any previous errors from attempting to share
                setShareError(null);
                const sharedUserId = (await axios.get(`http://localhost:8000/user/email/${shareEmail}`)).data;
                await axios.post('http://localhost:8000/scenario/shareToUser', {scenarioId: shareReport.scenarioId, userId: sharedUserId, email: shareEmail, permissions: sharePermissions});
                await axios.post('http://localhost:8000/report/shareToUser', {reportId: shareReport._id, userId: sharedUserId, email: shareEmail, permissions: sharePermissions});
                // Update shareReport on the front-end to show new shared users.
                handleShareReport(shareReport._id);
            }   
            catch (error) {
                console.error("Share Error");
                setShareError(error.response.data.error);
            }
        }
        else {
            setShareError("No proper report selected.")
        }
    }

    // Handle changing a shared user's existing permissions to a given report.
    const handleChangeSharePermissions = async (user, permissions) => {
        if (shareReport) {
            try {
                // Reset any previous errors from attempting to share
                setShareError(null);
                await axios.post('http://localhost:8000/scenario/shareToUser', {scenarioId: shareReport.scenarioId, userId: user.userId, email: user.email, permissions: permissions});
                await axios.post('http://localhost:8000/report/shareToUser', {reportId: shareReport._id, userId: user.userId, email: user.email, permissions: permissions});
                // Update shareReport on the front-end to show new shared users.
                handleShareReport(shareReport._id);
            }   
            catch (error) {
                console.error("Share Error");
                setShareError(error.response.data.error);
            }
        }
        else {
            setShareError("No proper report selected.")
        }
    }

    const handleRemoveSharedUser = async (user) => {
        if (shareReport) {
            try {
                // Reset any previous errors from attempting to share
                setShareError(null);
                await axios.post('http://localhost:8000/scenario/removeSharedUser', {scenarioId: shareReport.scenarioId, userId: user.userId, email: user.email});
                await axios.post('http://localhost:8000/report/removeSharedUser', {reportId: shareReport._id, userId: user.userId, email: user.email});
                // Update shareReport on the front-end to show new shared users.
                handleShareReport(shareReport._id);
            }   
            catch (error) {
                console.error("Remove Shared User Error");
                setShareError(error.response.data.error);
            }
        }
        else {
            setShareError("No proper report selected.")
        } 
    }

    const handleDownload = async () => {
        try {
          // Make a GET request to the backend to download the YAML file
          const response = await axios.get('http://localhost:8000/download-state-tax-yaml', {
            responseType: 'blob',  // Ensure the response is handled as a file
          });
      
          // Create a temporary link to trigger the download
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement('a');
          a.href = url;
          a.download = 'YAMLFormat.YAML';  // Name of the file to be downloaded
          document.body.appendChild(a);  
          a.click();  
          a.remove();  
        } catch (error) {
          console.error('Error downloading the file:', error);
          alert('There was an error while downloading the file. Please try again.');
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            if (fileName.endsWith('.yaml')) {
                setFile(selectedFile);  // Valid file extension
            } else {
                alert('Please select a .YAML file');
                event.target.value = null;  // Clear the input
                setFile(null);
            }
        }
    };
    

    const handleFileUpload = async () => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                await axios.post('http://localhost:8000/upload-state-tax-yaml', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                alert('File uploaded successfully');
            } catch (error) {
                console.error('Error uploading the file:', error);
                alert('Failed to upload the file. Please try again.');
            }
        } else {
            alert('Please select a file to upload.');
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
        <>
        <Header />
        <div className="dashboard-container">
            {error && <div className="error-message">{error}</div>}
            
            {stateWarning && <div className="warning-message">{stateWarning}</div>} {/* Show the warning message */}
            <button onClick={handleDownload}>Download Empty State YAML File</button>

            {/* File upload section */}
            <div className="file-upload-section">
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleFileUpload}>Upload File</button>
            </div>

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
                                    <button
                                        onClick={() => handleEditScenario(scenario._id)}
                                        className='edit-report-button'
                                    >
                                        Edit Scenario    
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="reports-section">
                    <div>
                        <h2>Recent Simulation Reports</h2>
                        <select name="reports-view" onChange={(e) => setReportView(e.target.value)}>
                            <option value="users-reports">Your Reports</option>   
                            <option value="shared-reports">Shared With You</option> 
                        </select>
                    </div>
                    
                    {/* User is viewing their own Reports */}
                    {reportView === 'users-reports' ? (
                        <>
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
                                        <div>
                                            <h3>{report.name}</h3>
                                            <button 
                                                onClick={() => handleShareReport(report._id)}>
                                                Share
                                            </button>
                                        </div>
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
                                                onClick={() => handleEditReport(report._id)}
                                                className='edit-report-button'
                                            >
                                                Edit Scenario    
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
                        </>
                    ) : (
                        <>
                        {/* User is viewing the Reports shared with them */}
                        {sharedReportsData.length === 0 ? (
                            <div className="empty-state">
                                <p>No reports have been shared with you.</p>
                            </div>
                        ) : (
                            <div className="reports-list">
                                {sharedReportsData.map(reportData => { 
                                    const report = reportData.report;
                                    return(
                                    <div key={report._id} className="report-card">
                                        <div>
                                            <h3>{report.name}</h3>
                                        </div>
                                        <div className="report-details">
                                            <p>Author: {report.userId}</p>
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
                                            {reportData.permissions === "edit" && (
                                                <button
                                                    onClick={() => handleEditReport(report._id)}
                                                    className='edit-report-button'
                                                >
                                                    Edit Scenario    
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>

            {showShareMenu && shareReport && (
                <div className='share-menu-background'>
                    <div className='share-menu-box'>
                        <button 
                            className="close-share-menu"
                            onClick={() => setShowShareMenu(false)}
                        >
                            Close Share Menu
                        </button>
                        <div className='share-menu-header-container'>
                            <h3 className='share-menu-header'>Share <span className='green'>{shareReport.name}</span></h3>
                            <p>Shared Users:</p>
                        </div>
                        <div className='shared-user-list'>
                            {shareReport.sharedUsers.length === 0 ? (
                                <div>No shared users</div>
                            ) : (
                                shareReport.sharedUsers.map((user) => (
                                <div key={user.userId} className='shared-user-box'>
                                    <p>{user.email}</p>
                                    <div className='shared-user-permissions'>
                                        <select value={user.permissions} onChange={(e) => handleChangeSharePermissions(user, e.target.value)}>
                                            <option value="view">View</option>
                                            <option value="edit">Edit</option>
                                        </select>
                                        <button onClick={(e) => handleRemoveSharedUser(user)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))) }
                            
                        </div>
                        <h3>Invite a User:</h3>
                        <div className='invite-user-container'>
                            <div className='invite-user-text'>                                <input 
                                    type='text'
                                    placeholder="Enter user email:" 
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                />
                            </div>
                            <div className='shared-user-permissions'>
                                <select name="permissions" onChange={(e) => setSharePermissions(e.target.value)}>
                                    <option value="view">View</option>   
                                    <option value="edit">Edit</option> 
                                </select>
                                <button className='add-user-button' onClick={() => handleShareUser()}>
                                    Add
                                </button>
                            </div>
                            <p>{shareError}</p>
                        </div>
                    </div>

                </div>
            )}
            
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
        </>
    );
}

export default Dashboard;
