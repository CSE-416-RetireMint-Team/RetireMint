import {React, useState, useEffect} from 'react';
import Header from './header';


function ListScenarios(scenarios) {
    const listItems = scenarios.map(scenario => 
        <div key={scenario}>
            <h3>{scenario}</h3>
        </div>
    )
    return listItems;
}

function Dashboard({ set_current_page }) {
    
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        setError('User not logged in');
        return;
    }

    fetch(`http://localhost:8000/user/${userId}`)
        .then(res => res.json())
        .then(data => {
        if (data.message) throw new Error(data.message);
        setUserData(data);
        })
        .catch(err => setError(err.message));
    }, []);


    return (
        <div>
            <Header set_current_page={set_current_page}/>
            {error && <p className="error-message">{error}</p>}

            <button onClick={() => set_current_page('new_scenario')}>
                Create a New Scenario
            </button>

            {!userData
            ?  (
                <p>Loading...</p>
            ) 
            : (
                <div>
                    {ListScenarios(userData.scenarios)}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
