    const submit_scenario = async () => {
    try {
        console.log('Submitting scenario:', {
            name,
            userId,
            birthYear,
            scenarioType,
            spouseBirthYear,
            financialGoal,
            investments,
            events
        });

        // Submit the scenario to the server
        const scenarioResponse = await axios.post('http://localhost:8000/scenario', {
            name,
            userId,
            birthYear,
            scenarioType,
            spouseBirthYear,
            financialGoal,
            investments,
            events
        });

        console.log('Scenario response:', scenarioResponse.data);

        if (!scenarioResponse.data.success) {
            alert('Failed to save scenario');
                                    return;
                                }

        const scenarioId = scenarioResponse.data.scenarioId;
        console.log('Scenario saved with ID:', scenarioId);

        // Now run a simulation with the new scenario
        console.log('Running simulation for scenario', scenarioId);
        const simulationResponse = await axios.post('http://localhost:8000/simulation/run', {
            scenarioId,
            userId,
            numSimulations: 100, // Default to 100 simulations
            numYears: 30 // Default to 30 years
        });

        console.log('Simulation response:', simulationResponse.data);

        if (simulationResponse.data.status === 'data_verification_only') {
            // Data verification mode - show a confirmation and go to dashboard
            alert(`Data verification completed: ${simulationResponse.data.message}`);
            navigate('/dashboard');
                                return;
                            }

        // If there's a reportId, store it and navigate to the results page
        if (simulationResponse.data.reportId) {
            localStorage.setItem('latestReportId', simulationResponse.data.reportId);
            navigate(`/simulation/${simulationResponse.data.reportId}`);
        } else if (simulationResponse.data.mockReport) {
            // If there's a mock report (for data verification), just go to dashboard
            alert('Data verification completed successfully. No actual simulation was run.');
            navigate('/dashboard');
        } else {
            // Something went wrong with the simulation
            alert('Simulation completed but no report was generated.');
            navigate('/dashboard');
        }
    } catch (error) {
        console.error('Error submitting scenario or running simulation:', error);
        alert(`Error: ${error.message || 'Unknown error'}`);
    }
}; 