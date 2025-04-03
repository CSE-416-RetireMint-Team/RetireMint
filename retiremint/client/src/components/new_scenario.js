import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './header';
import InvestmentForm from './investment_form';
import EventForm from './event_form';
import axios from 'axios';

function New_scenario() {
    const navigate = useNavigate();

    // Handling editing existing scenario (if necessary)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { reportId } = useParams();
    const [scenario_id, set_scenario_id] = useState(null);

    //pages there will be 4 pages to break down the scenario form 
    const [page,set_page]=useState(1);

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
    const [events, set_events] = useState([]); // store events as an array.

    // strategy states
    const [spending_strategies_input, set_spending_strategies_input] = useState('');
    const [expense_withdrawal_strategies_input, set_expense_withdrawal_strategies_input] = useState('');
    const [rmd_strategies_input, set_rmd_strategies_input] = useState('');
    const [roth_conversion_strategies_input, set_roth_conversion_strategies_input] = useState('');

    // Inflation assumption states
    const [inflation_method, set_inflation_method] = useState('');
    const [fixed_percentage, set_fixed_percentage] = useState('');
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

    //shared users 
    const [shared_users,set_shared_users] = useState([])


    useEffect(() => {
        console.log(reportId)
        const fetchScenario = async () => {
            try {
                if (reportId != "new"){
                    setLoading(true);
                    console.log("Loading");
                    const response = await axios.get(`http://localhost:8000/simulation/report/${reportId}/scenario`);
                    console.log(response.data);
                    set_scenario_id(response.data._id);
                    // Update placeholder values with existing scenario data to be changed.
                    set_scenario_name(response.data.name);
                    set_scenario_type(response.data.scenarioType);
                    set_birth_year(response.data.birthYear);
                    set_spouse_birth_year(response.data.spouseBirthYear);
                    //set_investments(response.data.investments);
                    //set_events(response.data.events);
                    //TODO: Return to spending strategies, lifeExpectancy. Stored as a separate object in DB. 
                    //set_spending_strategies_input(response.data.spendingstrategies);
                    //set_rmd_strategies_input(response.data.rmd_strategies_input);
                    //set_inflation_method(response.data.inflation_method);
                    //set_roth_optimizer_enable(response.data.roth_optimizer_enable);
                    //set_roth_optimizer_start_year(response.data.set_roth_optimizer_start_year);
                    //set_roth_optimizer_end_year(response.data.roth_optimizer_end_year);
                    set_financial_goal(response.data.financialGoal);
                    set_state_of_residence(response.data.stateOfResidence);
                    set_shared_users(response.data.sharedUsers);

                    setLoading(false);
                }
                else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching report:', err);
                setError('Error loading simulation results');
            }
        }
        fetchScenario();
    }, [reportId]);

    const submit_scenario = async () => {
        try {
            // Show loading or disable button here if you have UI for it
            
            //setting value to null for all unselected method 
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
                fixed_percentage: inflation_method === 'fixed_percentage' ? fixed_percentage : null,
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

            const formatted_shared_users = shared_users.map(user => {
                const [email, permission] = user.split(";");
                return { email, permissions: permission }; // match schema structure
            });

            // Step 1: Submit the scenario to get its ID
            console.log('Submitting scenario...');
            const userId = localStorage.getItem('userId') || 'guest';
            const scenarioResponse = await axios.post('http://localhost:8000/scenario', {
                scenario_id,
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
                state_of_residence,
                shared_users: formatted_shared_users,
                userId: userId // Include the userId in the scenario data
            });
            
            if (!scenarioResponse.data || !scenarioResponse.data.scenarioId) {
                console.error('No scenario ID received from server');
                alert('Error creating scenario. Please try again.');
                return;
            }
            
            const scenarioId = scenarioResponse.data.scenarioId;
            console.log('Scenario created with ID:', scenarioId);
            
            // Step 2: Run a simulation with the new scenario
            console.log('Running simulation...');
            const simulationResponse = await axios.post('http://localhost:8000/simulation/run', {
                scenarioId: scenarioId,
                numSimulations: 100, // Default to 100 simulations
                numYears: 30, // Default to 30 years
                userId: userId
            });
            
            if (!simulationResponse.data || !simulationResponse.data.reportId) {
                console.error('No report ID received from simulation');
                alert('Error running simulation. Please try again.');
                return;
            }
            
            const reportId = simulationResponse.data.reportId;
            console.log('Simulation completed, report ID:', reportId);
            
            // Store the latest report ID in localStorage
            localStorage.setItem('latestReportId', reportId);
            
            // Navigate to the simulation results page
            navigate(`/simulation-results/${reportId}`);
            
        } catch (error) {
            console.error('Error during scenario submission or simulation:', error);
            alert('Error: ' + (error.response?.data?.error || error.message || 'Unknown error'));
        }
    };


    if (loading) {
        console.log(`loading: ${loading}`);
        return <div className="loading">Loading simulation form...</div>;
    }
    return (
        <div>
            <Header />

            {page === 1 && (
                <div>
                    <h1>New Scenario Form</h1> 
                    <div>{/* name of the scenario */}
                        
                        <h2>Scenario Name *</h2> 
                        <input 
                            type="text" 
                            placeholder="Enter scenario name" 
                            value={scenario_name} 
                            onChange={(e) => set_scenario_name(e.target.value)} 
                        />
                    </div>

                    <div>  {/*married status */}
                        <h2>Married status *</h2> 
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

                    <div>  {/*birthyear */}
                        <h2>Birthyear(User) *</h2> 
                        <input 
                        type="number" 
                        placeholder="Enter your birth year" 
                        value={birth_year} 
                        onChange={(e) => set_birth_year(e.target.value)} 
                        />

                        {scenario_type === 'married' && (
                            <>
                                <h2>Birthyear(Spouse) *</h2> 
                                <input 
                                    type="number" 
                                    placeholder="Enter spouse's birth year" 
                                    value={spouse_birth_year} 
                                    onChange={(e) => set_spouse_birth_year(e.target.value)} 
                                />
                            </>
                        )}

                    </div>

                    <div>  {/* life expectancy */}
                        <div>
                            <h2>Life Expectancy(User) * </h2>
                            <button onClick={() => set_life_expectancy_method('fixed_value')}>
                                Enter Fixed Age
                            </button>
                            <button onClick={() => set_life_expectancy_method('normal_distribution')}>
                                Sampled from Normal Distribution
                            </button>

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
                        </div>

                        {scenario_type === 'married' && (
                            <>
                                <div>
                                    <h2>Life Expectancy (Spouse) *</h2>
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

                    </div>

                    <>
                    {/* Next Button */}
                        <button onClick={() => {
                            if (!scenario_name) {
                                alert("Scenario Name is required.");
                                return;
                            }
                            if (!scenario_type) {
                                alert("Please select a married status.");
                                return;
                            }
                            if (!birth_year) {
                                alert("Birth Year is required.");
                                return;
                            }
                            if (!life_expectancy_method) {
                                alert("Please select a Life Expectancy method.");
                                return;
                            }
                            if (life_expectancy_method === 'fixed_value' && !fixed_value) {
                                alert("Please enter a fixed life expectancy.");
                                return;
                            }
                            if (life_expectancy_method === 'normal_distribution' && (!mean || !standard_deviation)) {
                                alert("Please enter a mean and standard deviation.");
                                return;
                            }
                            if (scenario_type === 'married') {
                                if (!spouse_birth_year) {
                                    alert("Spouse's Birth Year is required.");
                                    return;
                                }
                                if (!spouse_life_expectancy_method) {
                                    alert("Please select a Life Expectancy method for your spouse.");
                                    return;
                                }
                                if (spouse_life_expectancy_method === 'fixed_value' && !spouse_fixed_value) {
                                    alert("Please enter a fixed life expectancy for your spouse.");
                                    return;
                                }
                                if (spouse_life_expectancy_method === 'normal_distribution' && (!spouse_mean || !spouse_standard_deviation)) {
                                    alert("Please enter a mean and standard deviation for your spouse.");
                                    return;
                                }
                            }

                            // if everything is valid, proceed to the next page
                            set_page(2);
                        }}>
                            Next
                    </button>

                    
                    </>

                </div>
            )}



            <div>
                
            {page === 2 && (
                <>
                    <InvestmentForm investments={investments} set_investments={set_investments} set_page={set_page}/>
                
                </>
            )}

            {page === 3 && (
                <>
                    <EventForm events={events} set_events={set_events} scenario_type={scenario_type} set_page={set_page} />
                
                </>
            )}
            
            {page === 4 && (
                <>
                    <h3>Select Inflation Method</h3>
                    <select onChange={(e) => set_inflation_method(e.target.value)} value={inflation_method}>
                        <option value="">Select</option>
                        <option value="fixed_percentage">Fixed Percentage</option>
                        <option value="normal_percentage">Normal Distribution</option>
                        <option value="uniform_percentage">Uniform Distribution</option>
                    </select>

                    {inflation_method === 'fixed_percentage' && (
                        <input 
                            type="number" 
                            placeholder="Enter fixed percentage" 
                            value={fixed_percentage} 
                            onChange={(e) => set_fixed_percentage(e.target.value)} 
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

                    {/* share setting */}
                    <h3>Number of Shared Users</h3>
                        <input 
                            type="number" 
                            min="0"
                            placeholder="Enter number of shared users" 
                            value={shared_users.length} 
                            onChange={(e) => {
                                const num = parseInt(e.target.value, 10) || 0;
                                set_shared_users(new Array(num).fill(""));
                            }} 
                        />

                    {shared_users.map((user, index) => {
                        const parts = user.split(";");
                        const email = parts[0] || "";
                        const permission = parts[1] || "read_only"; // Default to "read_only"

                        return (
                            <div key={index}>
                                <input 
                                    type="email" 
                                    placeholder="Enter email" 
                                    value={email} 
                                    onChange={(e) => {
                                        set_shared_users(prev_users => {
                                            const new_users = [...prev_users];
                                            new_users[index] = `${e.target.value};${permission}`; // Preserve permission
                                            console.log("Shared Users Updated:", new_users);
                                            return new_users;
                                        });
                                    }} 
                                />

                                <label>
                                    <input
                                        type="radio"
                                        name={`permission-${index}`}
                                        value="read_only"
                                        checked={permission === "read_only"}
                                        onChange={() => {
                                            set_shared_users(prev_users => {
                                                const new_users = [...prev_users];
                                                new_users[index] = `${email};read_only`;
                                                console.log("Shared Users Updated:", new_users);
                                                return new_users;
                                            });
                                        }}
                                    />
                                    Read Only
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`permission-${index}`}
                                        value="read_write"
                                        checked={permission === "read_write"}
                                        onChange={() => {
                                            set_shared_users(prev_users => {
                                                const new_users = [...prev_users];
                                                new_users[index] = `${email};read_write`;
                                                console.log("Shared Users Updated:", new_users);
                                                return new_users;
                                            });
                                        }}
                                    />
                                    Read Write
                                </label>
                            </div>
                        );
                    })}


                    {/* financial goal */}
                    <h3>Financial Goal: *</h3>
                    <input 
                        type="number" 
                        placeholder="Enter financial goal" 
                        value={financial_goal} 
                        onChange={(e) => set_financial_goal(e.target.value)} 
                    />



                    {/* state of residence */}
                    <h3>State of Residence</h3>
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


                    {/* Navigation Buttons */}
                    <div>
                        <button onClick={() => set_page(3)}>Previous</button>
                        <button onClick={() => {
                            // Validate Inflation Method
                            if (!inflation_method) {
                                alert("Please select an Inflation Method.");
                                return;
                            }

                            switch (inflation_method) {
                                case 'fixed_percentage':
                                    if (!fixed_percentage) {
                                        alert("Please enter a Fixed Percentage.");
                                        return;
                                    }
                                    break;
                                case 'normal_percentage':
                                    if (!normal_mean || !normal_sd) {
                                        alert("Please enter both Mean and Standard Deviation for Normal Percentage.");
                                        return;
                                    }
                                    break;
                                case 'uniform_percentage':
                                    if (!uniform_lower || !uniform_upper) {
                                        alert("Please enter both Lower and Upper Bound for Uniform Percentage.");
                                        return;
                                    }
                                    break;
                                default:
                                    // No action needed for unknown fields
                                    break;
                            }

                            // Validate Roth Optimizer
                            if (roth_optimizer_enable) {
                                if (!roth_optimizer_start_year || !roth_optimizer_end_year) {
                                    alert("Both Start Year and End Year are required when Roth Optimization is enabled.");
                                    return;
                                }
                            }

                            // Validate Required Fields
                            if (!financial_goal) {
                                alert("Financial Goal is required.");
                                return;
                            }

                            if (!state_of_residence) {
                                alert("State of Residence is required.");
                                return;
                            }

                            // Submit the scenario
                            submit_scenario();
                        }}>
                            Submit
                        </button>
                    </div>
                    
                
                </>
            )}

                

                
                


                
                
            </div>
        </div>
    );
}

export default New_scenario;
