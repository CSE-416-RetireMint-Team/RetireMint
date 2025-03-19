import React, { useState } from 'react';
import Header from './header';
import Investment_form from './investment_form';
import EventForm from './event_form';
import axios from 'axios';

function New_scenario({ set_current_page }) {
    const [scenario_name, set_scenario_name] = useState('');
    const [scenario_type, set_scenario_type] = useState('');
    const [birth_year, set_birth_year] = useState('');
    const [spouse_birth_year, set_spouse_birth_year] = useState('');

    // life expectancy for user
    const [life_expectancy_method, set_life_expectancy_method] = useState('');
    const [fixed_value, set_fixed_value] = useState('');
    const [mean, set_mean] = useState('');
    const [standard_deviation, set_standard_deviation] = useState('');

    // life expectancy for spouse
    const [spouse_life_expectancy_method, set_spouse_life_expectancy_method] = useState('');
    const [spouse_fixed_value, set_spouse_fixed_value] = useState('');
    const [spouse_mean, set_spouse_mean] = useState('');
    const [spouse_standard_deviation, set_spouse_standard_deviation] = useState('');

    const [investments, set_investments] = useState([]); // Store investments as array
    
    const [events, set_events] = useState([]); // Store events as an array.


    const submit_scenario = async () => {
        
        const life_expectancy_data = [
            life_expectancy_method, 
            life_expectancy_method === 'fixed_value' ? fixed_value : null,
            life_expectancy_method === 'normal_distribution' ? { mean, standard_deviation } : null
        ];
        
        const spouse_life_expectancy_data = scenario_type === 'married' 
            ? [
                spouse_life_expectancy_method,
                spouse_life_expectancy_method === 'fixed_value' ? spouse_fixed_value : null,
                spouse_life_expectancy_method === 'normal_distribution' ? { mean: spouse_mean, standard_deviation: spouse_standard_deviation } : null
            ] 
            : null;

        await axios.post('http://localhost:8000/scenario', {
            scenario_name,
            scenario_type,
            birth_year,
            spouse_birth_year: scenario_type === 'married' ? spouse_birth_year : null,
            life_expectancy: life_expectancy_data,
            spouse_life_expectancy: spouse_life_expectancy_data,
            investments
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

                <div>
                    <h3>Life Expectancy (User)</h3>
                    <button onClick={() => set_life_expectancy_method('fixed_value')}>
                        Enter Fixed Age
                    </button>
                    <button onClick={() => set_life_expectancy_method('normal_distribution')}>
                        Sampled from Normal Distribution
                    </button>
                </div>

                {life_expectancy_method === 'fixed_value' && (
                    <input 
                        type="number" 
                        placeholder="Enter fixed age" 
                        value={fixed_value} 
                        onChange={(e) => set_fixed_value(e.target.value)} 
                    />
                )}

                {life_expectancy_method === 'normal_distribution' && (
                    <div>
                        <input 
                            type="number" 
                            placeholder="Enter mean age" 
                            value={mean} 
                            onChange={(e) => set_mean(e.target.value)} 
                        />
                        <input 
                            type="number" 
                            placeholder="Enter standard deviation" 
                            value={standard_deviation} 
                            onChange={(e) => set_standard_deviation(e.target.value)} 
                        />
                    </div>
                )}

                {scenario_type === 'married' && (
                    <>
                        <div>
                            <h3>Life Expectancy (Spouse)</h3>
                            <button onClick={() => set_spouse_life_expectancy_method('fixed_value')}>
                                Enter Fixed Age
                            </button>
                            <button onClick={() => set_spouse_life_expectancy_method('normal_distribution')}>
                                Sampled from Normal Distribution
                            </button>
                        </div>

                        {spouse_life_expectancy_method === 'fixed_value' && (
                            <input 
                                type="number" 
                                placeholder="Enter spouse's fixed age" 
                                value={spouse_fixed_value} 
                                onChange={(e) => set_spouse_fixed_value(e.target.value)} 
                            />
                        )}

                        {spouse_life_expectancy_method === 'normal_distribution' && (
                            <div>
                                <input 
                                    type="number" 
                                    placeholder="Enter spouse's mean age" 
                                    value={spouse_mean} 
                                    onChange={(e) => set_spouse_mean(e.target.value)} 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Enter spouse's standard deviation" 
                                    value={spouse_standard_deviation} 
                                    onChange={(e) => set_spouse_standard_deviation(e.target.value)} 
                                />
                            </div>
                        )}
                    </>
                )}

                <Investment_form investments={investments} set_investments={set_investments} />
                <EventForm events={events} set_events={set_events} />
                
                
                
                <button onClick={submit_scenario}>Submit</button>
            </div>
        </div>
    );
}

export default New_scenario;
