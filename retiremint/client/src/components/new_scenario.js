import React, { useState } from 'react';
import Header from './header';
import axios from 'axios';

function New_scenario({ set_current_page }) {
    const [scenario_name, set_scenario_name] = useState('');
    const [scenario_type, set_scenario_type] = useState('');
    const [birth_year, set_birth_year] = useState('');
    const [spouse_birth_year, set_spouse_birth_year] = useState('');

    const submit_scenario = async () => {
        if (!scenario_name || !scenario_type || !birth_year || (scenario_type === 'married' && !spouse_birth_year)) {
            alert('Please fill in all required fields.');
            return;
        }

        await axios.post('http://localhost:8000/scenario', {
            scenario_name,
            scenario_type,
            birth_year,
            spouse_birth_year: scenario_type === 'married' ? spouse_birth_year : null,
        });
    };

    return (
        <div>
            <Header />
            <div>
                <input 
                    type="text" 
                    placeholder="Enter scenario name" 
                    value={scenario_name} 
                    onChange={(e) => set_scenario_name(e.target.value)} 
                />

                <div>
                    <label>
                        <input 
                            type="radio" 
                            name="scenario_type" 
                            value="individual"
                            checked={scenario_type === 'individual'}
                            onChange={(e) => set_scenario_type(e.target.value)}
                        />
                        Individual
                    </label>

                    <label>
                        <input 
                            type="radio" 
                            name="scenario_type" 
                            value="married"
                            checked={scenario_type === 'married'}
                            onChange={(e) => set_scenario_type(e.target.value)}
                        />
                        Married
                    </label>
                </div>

                <input 
                    type="number" 
                    placeholder="Enter your birth year" 
                    value={birth_year} 
                    onChange={(e) => set_birth_year(e.target.value)} 
                />

                {scenario_type === 'married' && (
                    <input 
                        type="number" 
                        placeholder="Enter spouse's birth year" 
                        value={spouse_birth_year} 
                        onChange={(e) => set_spouse_birth_year(e.target.value)} 
                    />
                )}

                <button onClick={submit_scenario}>Submit</button>
            </div>
        </div>
    );
}

export default New_scenario;
