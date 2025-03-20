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

    const [investments, set_investments] = useState([]); // store investments as array
    const [events, set_events] = useState([]); // Store events as an array.

    // strategy states
    const [spending_strategies_input, set_spending_strategies_input] = useState('');
    const [expense_withdrawal_strategies_input, set_expense_withdrawal_strategies_input] = useState('');
    const [rmd_strategies_input, set_rmd_strategies_input] = useState('');
    const [roth_conversion_strategies_input, set_roth_conversion_strategies_input] = useState('');

    // Inflation assumption states
    const [inflation_method, set_inflation_method] = useState('');
    const [fix_percentage, set_fix_percentage] = useState('');
    const [normal_mean, set_normal_mean] = useState('');
    const [normal_sd, set_normal_sd] = useState('');
    const [uniform_lower, set_uniform_lower] = useState('');
    const [uniform_upper, set_uniform_upper] = useState('');
    
    // roth optimizer states
    const [roth_optimizer_enable, set_roth_optimizer_enable] = useState(false);
    const [roth_optimizer_start_year, set_roth_optimizer_start_year] = useState('');
    const [roth_optimizer_end_year, set_roth_optimizer_end_year] = useState('');

    //sharing setting skip for now 

    // financial goal and state of residence
    const [financial_goal, set_financial_goal] = useState('');
    const [state_of_residence, set_state_of_residence] = useState('');




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

        // construct inflation data
        const inflation_assumption = {
            method: inflation_method,
            fix_percentage: inflation_method === 'fix_percentage' ? fix_percentage : null,
            normal_percentage: inflation_method === 'normal_percentage' 
                ? { mean: normal_mean, sd: normal_sd } 
                : { mean: null, sd: null },
            uniform_percentage: inflation_method === 'uniform_percentage' 
                ? { lower_bound: uniform_lower, upper_bound: uniform_upper } 
                : { lower_bound: null, upper_bound: null }
        };

        // construct strategies data
        const spending_strategies = spending_strategies_input.split(';').map(s => s.trim()).filter(s => s);
        const expense_withdrawal_strategies = expense_withdrawal_strategies_input.split(';').map(s => s.trim()).filter(s => s);
        const rmd_strategies = rmd_strategies_input.split(';').map(s => s.trim()).filter(s => s);
        const roth_conversion_strategies = roth_conversion_strategies_input.split(';').map(s => s.trim()).filter(s => s);

        await axios.post('http://localhost:8000/scenario', {
            scenario_name,
            scenario_type,
            birth_year,
            spouse_birth_year: scenario_type === 'married' ? spouse_birth_year : null,
            life_expectancy: life_expectancy_data,
            spouse_life_expectancy: scenario_type === 'married' ? spouse_life_expectancy_data : null,
            investments,
            events,
            inflation_assumption,
            spending_strategies,
            expense_withdrawal_strategies,
            rmd_strategies,
            roth_conversion_strategies,
            roth_optimizer_enable,
            roth_optimizer_start_year: roth_optimizer_enable ? roth_optimizer_start_year : null,
            roth_optimizer_end_year: roth_optimizer_enable ? roth_optimizer_end_year : null,
            financial_goal,  
            state_of_residence
            
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
                <EventForm events={events} set_events={set_events} scenario_type={scenario_type} />


                <h3>Select Inflation Method</h3>
                <select onChange={(e) => set_inflation_method(e.target.value)} value={inflation_method}>
                    <option value="">Select</option>
                    <option value="fix_percentage">Fixed Percentage</option>
                    <option value="normal_percentage">Normal Distribution</option>
                    <option value="uniform_percentage">Uniform Distribution</option>
                </select>

                {inflation_method === 'fix_percentage' && (
                    <input 
                        type="number" 
                        placeholder="Enter fixed percentage" 
                        value={fix_percentage} 
                        onChange={(e) => set_fix_percentage(e.target.value)} 
                    />
                )}

                {inflation_method === 'normal_percentage' && (
                    <div>
                        <input 
                            type="number" 
                            placeholder="Enter mean" 
                            value={normal_mean} 
                            onChange={(e) => set_normal_mean(e.target.value)} 
                        />
                        <input 
                            type="number" 
                            placeholder="Enter standard deviation" 
                            value={normal_sd} 
                            onChange={(e) => set_normal_sd(e.target.value)} 
                        />
                    </div>
                )}

                {inflation_method === 'uniform_percentage' && (
                    <div>
                        <input 
                            type="number" 
                            placeholder="Enter lower bound" 
                            value={uniform_lower} 
                            onChange={(e) => set_uniform_lower(e.target.value)} 
                        />
                        <input 
                            type="number" 
                            placeholder="Enter upper bound" 
                            value={uniform_upper} 
                            onChange={(e) => set_uniform_upper(e.target.value)} 
                        />
                    </div>
                )}


                {/* strategy inputs */}
                <h3>Strategies (Separate each strategy with ; )</h3>
                <input 
                    type="text" 
                    placeholder="Enter spending strategies" 
                    value={spending_strategies_input} 
                    onChange={(e) => set_spending_strategies_input(e.target.value)} 
                />
                <input 
                    type="text" 
                    placeholder="Enter expense withdrawal strategies" 
                    value={expense_withdrawal_strategies_input} 
                    onChange={(e) => set_expense_withdrawal_strategies_input(e.target.value)} 
                />
                <input 
                    type="text" 
                    placeholder="Enter RMD strategies" 
                    value={rmd_strategies_input} 
                    onChange={(e) => set_rmd_strategies_input(e.target.value)} 
                />
                <input 
                    type="text" 
                    placeholder="Enter Roth conversion strategies" 
                    value={roth_conversion_strategies_input} 
                    onChange={(e) => set_roth_conversion_strategies_input(e.target.value)} 
                />

                {/* roth optimizer inputs */}
                <h3>Roth Optimization</h3>
                <label>
                    <input 
                        type="checkbox" 
                        checked={roth_optimizer_enable} 
                        onChange={(e) => set_roth_optimizer_enable(e.target.checked)} 
                    />
                    Enable Roth Optimization
                </label>

                {roth_optimizer_enable && (
                    <div>
                        <input 
                            type="number" 
                            placeholder="Enter Start Year" 
                            value={roth_optimizer_start_year} 
                            onChange={(e) => set_roth_optimizer_start_year(e.target.value)} 
                        />
                        <input 
                            type="number" 
                            placeholder="Enter End Year" 
                            value={roth_optimizer_end_year} 
                            onChange={(e) => set_roth_optimizer_end_year(e.target.value)} 
                        />
                    </div>
                )}

                {/* financial goal */}
                <input 
                    type="number" 
                    placeholder="Enter financial goal" 
                    value={financial_goal} 
                    onChange={(e) => set_financial_goal(e.target.value)} 
                />

                {/* state of residence */}
                <select value={state_of_residence} onChange={(e) => set_state_of_residence(e.target.value)}>
                    <option value="">Select your state</option>
                    {[
                        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
                        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
                        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
                        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
                        'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 
                        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 
                        'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
                        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 
                        'West Virginia', 'Wisconsin', 'Wyoming'
                    ].map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>

                <button onClick={submit_scenario}>Submit</button>
                
            </div>
        </div>
    );
}

export default New_scenario;
