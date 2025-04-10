import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from './HeaderComp';
import InvestmentTypeForm from './InvestmentTypeForm';
import InvestmentForm from './InvestmentForm';
import EventForm from './EventForm';
import axios from 'axios';

function NewScenario() {
    const navigate = useNavigate();

    // Handling editing existing scenario (if necessary)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { reportId } = useParams();
    const [scenarioIdEdit, setScenarioIdEdit] = useState(null);

    //pages there will be 4 pages to break down the scenario form 
    const [page,setPage]=useState(1);

    const [scenarioName, setScenarioName] = useState('');
    const [scenarioType, setScenarioType] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [spouseBirthYear, setSpouseBirthYear] = useState('');

    // life expectancy for user
    const [lifeExpectancyMethod, setLifeExpectancyMethod] = useState('');
    const [fixedValue, setFixedValue] = useState('');
    const [mean, setMean] = useState('');
    const [standardDeviation, setStandardDeviation] = useState('');

    // life expectancy for spouse
    const [spouseLifeExpectancyMethod, setSpouseLifeExpectancyMethod] = useState('');
    const [spouseFixedValue, setSpouseFixedValue] = useState('');
    const [spouseMean, setSpouseMean] = useState('');
    const [spouseStandardDeviation, setSpouseStandardDeviation] = useState('');

    const [investmentTypes, setInvestmentTypes] = useState([]);
    const [investments, setInvestments] = useState([]); // store investments as array
    const [events, setEvents] = useState([]); // store events as an array.

    // strategy states
    const [spendingStrategiesInput, setSpendingStrategiesInput] = useState('');
    const [expenseWithdrawalStrategiesInput, setExpenseWithdrawalStrategiesInput] = useState('');
    const [rmdStrategiesInput, setRmdStrategiesInput] = useState('');
    const [rothConversionStrategiesInput, setRothConversionStrategiesInput] = useState('');

    // Inflation assumption states
    const [inflationMethod, setInflationMethod] = useState('');
    const [fixedPercentage, setFixedPercentage] = useState('');
    const [normalMean, setNormalMean] = useState('');
    const [normalSd, setNormalSd] = useState('');
    const [uniformLower, setUniformLower] = useState('');
    const [uniformUpper, setUniformUpper] = useState('');
    
    // roth optimizer states
    const [RothOptimizerEnable, setRothOptimizerEnable] = useState(false);
    const [rothRptimizerStartYear, setRothRptimizerStartYear] = useState('');
    const [rothOptimizerEndYear, setRothOptimizerEndYear] = useState('');

    //sharing setting skip for now 

    // financial goal and state of residence
    const [financialGoal, setFinancialGoal] = useState('');
    const [maximumCash, setMaximumCash] = useState('');
    const [stateOfResidence, setStateOfResidence] = useState('');

    //shared users 
    const [sharedUsers,setSharedUsers] = useState([])


    useEffect(() => {
        console.log(reportId)
        const fetchScenario = async () => {
            try {
                if (reportId !== "new"){
                    setLoading(true);
                    console.log("Loading");
                    const response = await axios.get(`http://localhost:8000/simulation/report/${reportId}/scenario`);                    
                    setScenarioIdEdit(response.data._id);
                    // Update placeholder values with existing scenario data to be changed.
                    setScenarioName(response.data.name);
                    setScenarioType(response.data.scenarioType);
                    setBirthYear(response.data.birthYear);
                    setSpouseBirthYear(response.data.spouseBirthYear);
                    setMaximumCash(response.data.maximumCash);

                    // Fetch Investments with all id's broken down and convert it to the investment format in the form.
                    const responseInvestments = await axios.post(`http://localhost:8000/simulation/scenario/investments`, {scenarioIdEdit: response.data._id});
                    const convertedInvestments = convertInvestmentFormat(responseInvestments.data.investments);
                    setInvestments(convertedInvestments);

                    // Fetch Events with all id's broken down and convert it to the event format in the form.
                    const responseEvents = await axios.post(`http://localhost:8000/simulation/scenario/events`, {scenarioIdEdit: response.data._id});
                    const convertedEvents = convertEventFormat(responseEvents.data.events);
                    setEvents(convertedEvents);

                    setFinancialGoal(response.data.financialGoal);
                    setStateOfResidence(response.data.stateOfResidence);
                    setSharedUsers(response.data.sharedUsers);

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

    const submitScenario = async () => {
        try {
            // Show loading or disable button here if you have UI for it
            
            //setting value to null for all unselected method 
            const lifeExpectancyData = [
                lifeExpectancyMethod, 
                lifeExpectancyMethod === 'fixedValue' ? fixedValue : null,
                lifeExpectancyMethod === 'normalDistribution' ? { mean, standardDeviation } : null
            ];
            
            const spouseLifeExpectancyData = scenarioType === 'married' 
                ? [
                    spouseLifeExpectancyMethod,
                    spouseLifeExpectancyMethod === 'fixedValue' ? spouseFixedValue : null,
                    spouseLifeExpectancyMethod === 'normalDistribution' ? { mean: spouseMean, standardDeviation: spouseStandardDeviation } : null
                ] 
                : null;

            // construct inflation data
            const inflationAssumption = {
                method: inflationMethod,
                fixedPercentage: inflationMethod === 'fixedPercentage' ? fixedPercentage : null,
                normalPercentage: inflationMethod === 'normalPercentage' 
                    ? { mean: normalMean, sd: normalSd } 
                    : { mean: null, sd: null },
                uniformPercentage: inflationMethod === 'uniformPercentage' 
                    ? { lowerBound: uniformLower, upperBound: uniformUpper } 
                    : { lowerBound: null, upperBound: null }
            };

            // construct strategies data
            const spendingStrategies = spendingStrategiesInput.split(';').map(s => s.trim()).filter(s => s);
            const expenseWithdrawalStrategies = expenseWithdrawalStrategiesInput.split(';').map(s => s.trim()).filter(s => s);
            const rmdStrategies = rmdStrategiesInput.split(';').map(s => s.trim()).filter(s => s);
            const rothConversionStrategies = rothConversionStrategiesInput.split(';').map(s => s.trim()).filter(s => s);

            const formattedSharedUsers = sharedUsers.map(user => {
                const [email, permission] = user.split(";");
                return { email, permissions: permission }; // match schema structure
            });

            // Step 1: Submit the scenario to get its ID
            console.log('Submitting scenario...');
            const userId = localStorage.getItem('userId') || 'guest';
            const scenarioResponse = await axios.post('http://localhost:8000/scenario', {
                scenarioIdEdit,
                scenarioName,
                scenarioType,
                birthYear,
                spouseBirthYear: scenarioType === 'married' ? spouseBirthYear : null,
                lifeExpectancy: lifeExpectancyData,
                spouseLifeExpectancy: scenarioType === 'married' ? spouseLifeExpectancyData : null,
                investments,
                events,
                inflationAssumption,
                spendingStrategies,
                expenseWithdrawalStrategies,
                rmdStrategies,
                rothConversionStrategies,
                RothOptimizerEnable,
                rothRptimizerStartYear: RothOptimizerEnable ? rothRptimizerStartYear : null,
                rothOptimizerEndYear: RothOptimizerEnable ? rothOptimizerEndYear : null,
                financialGoal,  
                maximumCash,
                stateOfResidence,
                sharedUsers: formattedSharedUsers,
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
            
            {error && <div className="error-message">{error}</div>}

            {page === 1 && (
                <div>
                    <h1>New Scenario Form</h1> 
                    <div>{/* name of the scenario */}
                        
                        <h2>Scenario Name *</h2> 
                        <input 
                            type="text" 
                            placeholder="Enter scenario name" 
                            value={scenarioName} 
                            onChange={(e) => setScenarioName(e.target.value)} 
                        />
                    </div>

                    <div>  {/*married status */}
                        <h2>Married status *</h2> 
                        <label>
                            <input 
                                type="radio" 
                                name="scenarioType" 
                                value="individual"
                                checked={scenarioType === 'individual'}
                                onChange={(e) => setScenarioType(e.target.value)}
                            />
                            Individual
                        </label>

                        <label>
                            <input 
                                type="radio" 
                                name="scenarioType" 
                                value="married"
                                checked={scenarioType === 'married'}
                                onChange={(e) => setScenarioType(e.target.value)}
                            />
                            Married
                        </label>
                    </div>

                    <div>  {/*birthyear */}
                        <h2>Birthyear(User) *</h2> 
                        <input 
                        type="number" 
                        placeholder="Enter your birth year" 
                        value={birthYear} 
                        onChange={(e) => setBirthYear(e.target.value)} 
                        />

                        {scenarioType === 'married' && (
                            <>
                                <h2>Birthyear(Spouse) *</h2> 
                                <input 
                                    type="number" 
                                    placeholder="Enter spouse's birth year" 
                                    value={spouseBirthYear} 
                                    onChange={(e) => setSpouseBirthYear(e.target.value)} 
                                />
                            </>
                        )}

                    </div>

                    <div>  {/* life expectancy */}
                        <div>
                            <h2>Life Expectancy(User) * </h2>
                            <button onClick={() => setLifeExpectancyMethod('fixedValue')}>
                                Enter Fixed Age
                            </button>
                            <button onClick={() => setLifeExpectancyMethod('normalDistribution')}>
                                Sampled from Normal Distribution
                            </button>

                            {lifeExpectancyMethod === 'fixedValue' && (
                                <input 
                                    type="number" 
                                    placeholder="Enter fixed age" 
                                    value={fixedValue} 
                                    onChange={(e) => setFixedValue(e.target.value)} 
                                />
                            )}

                            {lifeExpectancyMethod === 'normalDistribution' && (
                                <div>
                                    <input 
                                        type="number" 
                                        placeholder="Enter mean age" 
                                        value={mean} 
                                        onChange={(e) => setMean(e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Enter standard deviation" 
                                        value={standardDeviation} 
                                        onChange={(e) => setStandardDeviation(e.target.value)} 
                                    />
                                </div>
                            )}
                        </div>

                        {scenarioType === 'married' && (
                            <>
                                <div>
                                    <h2>Life Expectancy (Spouse) *</h2>
                                    <button onClick={() => setSpouseLifeExpectancyMethod('fixedValue')}>
                                        Enter Fixed Age
                                    </button>
                                    <button onClick={() => setSpouseLifeExpectancyMethod('normalDistribution')}>
                                        Sampled from Normal Distribution
                                    </button>
                                </div>

                                {spouseLifeExpectancyMethod === 'fixedValue' && (
                                    <input 
                                        type="number" 
                                        placeholder="Enter spouse's fixed age" 
                                        value={spouseFixedValue} 
                                        onChange={(e) => setSpouseFixedValue(e.target.value)} 
                                    />
                                )}

                                {spouseLifeExpectancyMethod === 'normalDistribution' && (
                                    <div>
                                        <input 
                                            type="number" 
                                            placeholder="Enter spouse's mean age" 
                                            value={spouseMean} 
                                            onChange={(e) => setSpouseMean(e.target.value)} 
                                        />
                                        <input 
                                            type="number" 
                                            placeholder="Enter spouse's standard deviation" 
                                            value={spouseStandardDeviation} 
                                            onChange={(e) => setSpouseStandardDeviation(e.target.value)} 
                                        />
                                    </div>
                                )}
                            </>
                        )}

                    </div>

                    <div>
                        <h2>Initial Maximum Cash *</h2>
                        <input 
                            type="number" 
                            placeholder="Enter maximum cash amount" 
                            value={maximumCash} 
                            onChange={(e) => setMaximumCash(e.target.value)} 
                        />
                        <p className="helper-text">
                            This value is used for all invest events to determine the maximum amount of cash to keep.
                        </p>
                    </div>

                    <>
                    {/* Next Button */}
                        <button onClick={() => {
                            if (!scenarioName) {
                                alert("Scenario Name is required.");
                                return;
                            }
                            if (!scenarioType) {
                                alert("Please select a married status.");
                                return;
                            }
                            if (!birthYear) {
                                alert("Birth Year is required.");
                                return;
                            }
                            if (!lifeExpectancyMethod) {
                                alert("Please select a Life Expectancy method.");
                                return;
                            }
                            if (lifeExpectancyMethod === 'fixedValue' && !fixedValue) {
                                alert("Please enter a fixed life expectancy.");
                                return;
                            }
                            if (lifeExpectancyMethod === 'normalDistribution' && (!mean || !standardDeviation)) {
                                alert("Please enter a mean and standard deviation.");
                                return;
                            }
                            if (scenarioType === 'married') {
                                if (!spouseBirthYear) {
                                    alert("Spouse's Birth Year is required.");
                                    return;
                                }
                                if (!spouseLifeExpectancyMethod) {
                                    alert("Please select a Life Expectancy method for your spouse.");
                                    return;
                                }
                                if (spouseLifeExpectancyMethod === 'fixedValue' && !spouseFixedValue) {
                                    alert("Please enter a fixed life expectancy for your spouse.");
                                    return;
                                }
                                if (spouseLifeExpectancyMethod === 'normalDistribution' && (!spouseMean || !spouseStandardDeviation)) {
                                    alert("Please enter a mean and standard deviation for your spouse.");
                                    return;
                                }
                            }
                            if (!maximumCash) {
                                alert("Maximum Cash is required.");
                                return;
                            }

                            // if everything is valid, proceed to the next page
                            setPage(2);
                        }}>
                            Next
                    </button>

                    
                    </>

                </div>
            )}



            <div>

            {page === 2 && (
                <>
                    <InvestmentTypeForm investmentTypes={investmentTypes} setInvestmentTypes={setInvestmentTypes} setPage={setPage}/>
                
                </>
            )}
                
            {page === 3 && (
                <>
                    <InvestmentForm 
                        investments={investments} 
                        setInvestments={setInvestments} 
                        investmentTypes={investmentTypes}
                        setInvestmentTypes={setInvestmentTypes}
                        setPage={setPage}
                    />
                
                </>
            )}

            {page === 4 && (
                <>
                    <EventForm 
                        events={events} 
                        setEvents={setEvents} 
                        scenarioType={scenarioType} 
                        setPage={setPage}
                        investments={investments} 
                    />
                
                </>
            )}
            
            {page === 5 && (
                <>
                    <h3>Select Inflation Method</h3>
                    <select onChange={(e) => setInflationMethod(e.target.value)} value={inflationMethod}>
                        <option value="">Select</option>
                        <option value="fixedPercentage">Fixed Percentage</option>
                        <option value="normalPercentage">Normal Distribution</option>
                        <option value="uniformPercentage">Uniform Distribution</option>
                    </select>

                    {inflationMethod === 'fixedPercentage' && (
                        <input 
                            type="number" 
                            placeholder="Enter fixed percentage" 
                            value={fixedPercentage} 
                            onChange={(e) => setFixedPercentage(e.target.value)} 
                        />
                    )}

                    {inflationMethod === 'normalPercentage' && (
                        <div>
                            <input 
                                type="number" 
                                placeholder="Enter mean" 
                                value={normalMean} 
                                onChange={(e) => setNormalMean(e.target.value)} 
                            />
                            <input 
                                type="number" 
                                placeholder="Enter standard deviation" 
                                value={normalSd} 
                                onChange={(e) => setNormalSd(e.target.value)} 
                            />
                        </div>
                    )}

                    {inflationMethod === 'uniformPercentage' && (
                        <div>
                            <input 
                                type="number" 
                                placeholder="Enter lower bound" 
                                value={uniformLower} 
                                onChange={(e) => setUniformLower(e.target.value)} 
                            />
                            <input 
                                type="number" 
                                placeholder="Enter upper bound" 
                                value={uniformUpper} 
                                onChange={(e) => setUniformUpper(e.target.value)} 
                            />
                        </div>
                    )}


                    {/* strategy inputs */}
                    <h3>Strategies (Separate each strategy with ; )</h3>
                    <input 
                        type="text" 
                        placeholder="Enter spending strategies" 
                        value={spendingStrategiesInput} 
                        onChange={(e) => setSpendingStrategiesInput(e.target.value)} 
                    />
                    <input 
                        type="text" 
                        placeholder="Enter expense withdrawal strategies" 
                        value={expenseWithdrawalStrategiesInput} 
                        onChange={(e) => setExpenseWithdrawalStrategiesInput(e.target.value)} 
                    />
                    <input 
                        type="text" 
                        placeholder="Enter RMD strategies" 
                        value={rmdStrategiesInput} 
                        onChange={(e) => setRmdStrategiesInput(e.target.value)} 
                    />
                    <input 
                        type="text" 
                        placeholder="Enter Roth conversion strategies" 
                        value={rothConversionStrategiesInput} 
                        onChange={(e) => setRothConversionStrategiesInput(e.target.value)} 
                    />

                    {/* roth optimizer inputs */}
                    <h3>Roth Optimization</h3>
                    <label>
                        <input 
                            type="checkbox" 
                            checked={RothOptimizerEnable} 
                            onChange={(e) => setRothOptimizerEnable(e.target.checked)} 
                        />
                        Enable Roth Optimization
                    </label>

                    {RothOptimizerEnable && (
                        <div>
                            <input 
                                type="number" 
                                placeholder="Enter Start Year" 
                                value={rothRptimizerStartYear} 
                                onChange={(e) => setRothRptimizerStartYear(e.target.value)} 
                            />
                            <input 
                                type="number" 
                                placeholder="Enter End Year" 
                                value={rothOptimizerEndYear} 
                                onChange={(e) => setRothOptimizerEndYear(e.target.value)} 
                            />
                        </div>
                    )}

                    {/* share setting */}
                    <h3>Number of Shared Users</h3>
                        <input 
                            type="number" 
                            min="0"
                            placeholder="Enter number of shared users" 
                            value={sharedUsers.length} 
                            onChange={(e) => {
                                const num = parseInt(e.target.value, 10) || 0;
                                setSharedUsers(new Array(num).fill(""));
                            }} 
                        />

                    {sharedUsers.map((user, index) => {
                        const parts = user.split(";");
                        const email = parts[0] || "";
                        const permission = parts[1] || "readOnly"; // Default to "readOnly"

                        return (
                            <div key={index}>
                                <input 
                                    type="email" 
                                    placeholder="Enter email" 
                                    value={email} 
                                    onChange={(e) => {
                                        setSharedUsers(prevUsers => {
                                            const newUsers = [...prevUsers];
                                            newUsers[index] = `${e.target.value};${permission}`; // Preserve permission
                                            console.log("Shared Users Updated:", newUsers);
                                            return newUsers;
                                        });
                                    }} 
                                />

                                <label>
                                    <input
                                        type="radio"
                                        name={`permission-${index}`}
                                        value="readOnly"
                                        checked={permission === "readOnly"}
                                        onChange={() => {
                                            setSharedUsers(prevUsers => {
                                                const newUsers = [...prevUsers];
                                                newUsers[index] = `${email};readOnly`;
                                                console.log("Shared Users Updated:", newUsers);
                                                return newUsers;
                                            });
                                        }}
                                    />
                                    Read Only
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`permission-${index}`}
                                        value="readWrite"
                                        checked={permission === "readWrite"}
                                        onChange={() => {
                                            setSharedUsers(prevUsers => {
                                                const newUsers = [...prevUsers];
                                                newUsers[index] = `${email};readWrite`;
                                                console.log("Shared Users Updated:", newUsers);
                                                return newUsers;
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
                        value={financialGoal} 
                        onChange={(e) => setFinancialGoal(e.target.value)} 
                    />



                    {/* state of residence */}
                    <h3>State of Residence</h3>
                    <select value={stateOfResidence} onChange={(e) => setStateOfResidence(e.target.value)}>
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
                        <button onClick={() => setPage(4)}>Previous</button>
                        <button onClick={() => {
                            // Validate Inflation Method
                            if (!inflationMethod) {
                                alert("Please select an Inflation Method.");
                                return;
                            }

                            switch (inflationMethod) {
                                case 'fixedPercentage':
                                    if (!fixedPercentage) {
                                        alert("Please enter a Fixed Percentage.");
                                        return;
                                    }
                                    break;
                                case 'normalPercentage':
                                    if (!normalMean || !normalSd) {
                                        alert("Please enter both Mean and Standard Deviation for Normal Percentage.");
                                        return;
                                    }
                                    break;
                                case 'uniformPercentage':
                                    if (!uniformLower || !uniformUpper) {
                                        alert("Please enter both Lower and Upper Bound for Uniform Percentage.");
                                        return;
                                    }
                                    break;
                                default:
                                    // No action needed for unknown fields
                                    break;
                            }

                            // Validate Roth Optimizer
                            if (RothOptimizerEnable) {
                                if (!rothRptimizerStartYear || !rothOptimizerEndYear) {
                                    alert("Both Start Year and End Year are required when Roth Optimization is enabled.");
                                    return;
                                }
                            }

                            // Validate Required Fields
                            if (!financialGoal) {
                                alert("Financial Goal is required.");
                                return;
                            }

                            if (!stateOfResidence) {
                                alert("State of Residence is required.");
                                return;
                            }

                            // Submit the scenario
                            submitScenario();
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

// Converts investments taken from the Database to the format that the form uses to edit a scenario.
function convertInvestmentFormat( dbInvestments) {
    const newInvestments = [];
    let i = 0;
    while (i < dbInvestments.length) {
        newInvestments.push({
            investmentType: {
                name: dbInvestments[i].investmentType.name ?? '',
                description: dbInvestments[i].investmentType.description ?? '',
                expectedReturn: { 
                    returnType: dbInvestments[i].investmentType.expectedAnnualReturn?.method ?? '',
                    fixedValue: dbInvestments[i].investmentType.expectedAnnualReturn?.fixedValue ?? '', 
                    fixedPercentage: dbInvestments[i].investmentType.expectedAnnualReturn?.fixedPercentage ?? '', 
                    normalValue: {
                    mean: dbInvestments[i].investmentType.expectedAnnualReturn?.normalValue?.mean ?? '',
                    sd: dbInvestments[i].investmentType.expectedAnnualReturn?.normalValue?.sd ?? ''
                    },
                    normalPercentage: {
                    mean: dbInvestments[i].investmentType.expectedAnnualReturn?.normalPercentage?.mean ?? '',
                    sd: dbInvestments[i].investmentType.expectedAnnualReturn?.normalPercentage?.sd ?? ''
                    }
                },
                expenseRatio: dbInvestments[i].investmentType.expenseRatio ?? '',
                taxability: dbInvestments[i].investmentType.taxability ?? '',
                },
                value: dbInvestments[i].value ?? '',
                taxStatus: dbInvestments[i].accountTaxStatus ?? '',
        });
          

        i++;
    }
    return newInvestments;
}


// Converts events from the Database to the format that the form uses to edit a scenario.
function convertEventFormat(dbEvents) {
    const newEvents = [];
    let i = 0;
    while (i < dbEvents.length) {
        newEvents.push({
            name: dbEvents[i].name ?? '',
            description: dbEvents[i].description ?? '',
            startYear: {
                returnType: dbEvents[i].startYear?.returnType ?? '',
                fixedValue: dbEvents[i].startYear?.fixedValue ?? '',
                normalValue: {
                    mean: dbEvents[i].startYear?.normalValue?.mean ?? '',
                    sd: dbEvents[i].startYear?.normalValue?.sd ?? ''
                },
                uniformValue: {
                    lowerBound: dbEvents[i].startYear?.uniformValue?.lowerBound ?? '',
                    upperBound: dbEvents[i].startYear?.uniformValue?.upperBound ?? ''
                },
                sameYearAsAnotherEvent: dbEvents[i].startYear?.sameYearAsAnotherEvent ?? '',
                yearAfterAnotherEventEnd: dbEvents[i].startYear?.yearAfterAnotherEventEnd ?? ''
            },
            duration: {
                returnType: dbEvents[i].duration?.returnType ?? '',
                fixedValue: dbEvents[i].duration?.fixedValue ?? '',
                normalValue: {
                    mean: dbEvents[i].duration?.normalValue?.mean ?? '',
                    sd: dbEvents[i].duration?.normalValue?.sd ?? ''
                },
                uniformValue: {
                    lowerBound: dbEvents[i].duration?.uniformValue?.lowerBound ?? '',
                    upperBound: dbEvents[i].duration?.uniformValue?.upperBound ?? ''
                }
            },
            eventType: dbEvents[i].type ?? '',
            income: {
                initialAmount: dbEvents[i].income?.initialAmount ?? '',
                expectedAnnualChange: {
                    returnType: dbEvents[i].income?.expectedAnnualChange?.returnType ?? '',
                    fixedValue: dbEvents[i].income?.expectedAnnualChange?.fixedValue ?? '',
                    normalValue: {
                        mean: dbEvents[i].income?.expectedAnnualChange?.normalValue?.mean ?? '',
                        sd: dbEvents[i].income?.expectedAnnualChange?.normalValue?.sd ?? ''
                    },
                    uniformValue: {
                        lowerBound: dbEvents[i].income?.expectedAnnualChange?.uniformValue?.lowerBound ?? '',
                        upperBound: dbEvents[i].income?.expectedAnnualChange?.uniformValue?.upperBound ?? ''
                    },
                    fixedPercentage: dbEvents[i].income?.expectedAnnualChange?.fixedPercentage ?? '',
                    normalPercentage: {
                        mean: dbEvents[i].income?.expectedAnnualChange?.normalPercentage?.mean ?? '',
                        sd: dbEvents[i].income?.expectedAnnualChange?.normalPercentage?.sd ?? ''
                    },
                    uniformPercentage: {
                        lowerBound: dbEvents[i].income?.expectedAnnualChange?.uniformPercentage?.lowerBound ?? '',
                        upperBound: dbEvents[i].income?.expectedAnnualChange?.uniformPercentage?.upperBound ?? ''
                    }
                },
                isSocialSecurity: dbEvents[i].income?.isSocialSecurity ?? false,  
                inflationAdjustment: dbEvents[i].income?.inflationAdjustment ?? false,
                marriedPercentage: dbEvents[i].income?.marriedPercentage ?? ''
            },
            expense: {
                initialAmount: dbEvents[i].expense?.initialAmount ?? '',
                expectedAnnualChange: {
                    returnType: dbEvents[i].expense?.expectedAnnualChange?.returnType ?? '',
                    fixedValue: dbEvents[i].expense?.expectedAnnualChange?.fixedValue ?? '',
                    normalValue: {
                        mean: dbEvents[i].expense?.expectedAnnualChange?.normalValue?.mean ?? '',
                        sd: dbEvents[i].expense?.expectedAnnualChange?.normalValue?.sd ?? ''
                    },
                    uniformValue: {
                        lowerBound: dbEvents[i].expense?.expectedAnnualChange?.uniformValue?.lowerBound ?? '',
                        upperBound: dbEvents[i].expense?.expectedAnnualChange?.uniformValue?.upperBound ?? ''
                    },
                    fixedPercentage: dbEvents[i].expense?.expectedAnnualChange?.fixedPercentage ?? '',
                    normalPercentage: {
                        mean: dbEvents[i].expense?.expectedAnnualChange?.normalPercentage?.mean ?? '',
                        sd: dbEvents[i].expense?.expectedAnnualChange?.normalPercentage?.sd ?? ''
                    },
                    uniformPercentage: {
                        lowerBound: dbEvents[i].expense?.expectedAnnualChange?.uniformPercentage?.lowerBound ?? '',
                        upperBound: dbEvents[i].expense?.expectedAnnualChange?.uniformPercentage?.upperBound ?? ''
                    }
                },
                isDiscretionary: dbEvents[i].expense?.isDiscretionary ?? false,  
                inflationAdjustment: dbEvents[i].expense?.inflationAdjustment ?? false,
                marriedPercentage: dbEvents[i].expense?.marriedPercentage ?? ''
            },
            invest: {
                returnType: dbEvents[i].invest?.returnType ?? '',
                fixedAllocation: dbEvents[i].invest?.fixedAllocation ?? '',
                glidePath: dbEvents[i].invest?.glidePath ?? '',
                modifyMaximumCash: dbEvents[i].invest?.modifyMaximumCash ?? false,
                newMaximumCash: dbEvents[i].invest?.newMaximumCash ?? ''
            },
            rebalance: {
                returnType: dbEvents[i].rebalance?.returnType ?? '',
                fixedAllocation: dbEvents[i].rebalance?.fixedAllocation ?? '',
                glidePath: dbEvents[i].rebalance?.glidePath ?? ''
            }
        });
        
        i++;
    }
    return newEvents;
}

export default NewScenario;
