import React from 'react';
import Header from './header';

function Dashboard({ set_current_page }) {
    return (
        <div>
            <Header set_current_page={set_current_page}/>
            <button onClick={() => set_current_page('new_scenario')}>
                Create a New Scenario
            </button>

        </div>
    );
}

export default Dashboard;
