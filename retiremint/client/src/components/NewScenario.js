import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Header from './HeaderComp';
import InvestmentTypeForm from './InvestmentTypeForm';
import InvestmentForm from './InvestmentForm';
import EventForm from './EventForm';
import '../Stylesheets/NewScenario.css';

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

    // Strategy states for drag and drop
    const [expenseWithdrawalStrategies, setExpenseWithdrawalStrategies] = useState([]); 
    const [rmdStrategies, setRmdStrategies] = useState([]);
    const [rothConversionStrategies, setRothConversionStrategies] = useState([]);
    
    // Legacy strategy text inputs (kept for backward compatibility)
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

    // Flag to check if user has pre-tax investments
    const [hasPreTaxInvestments, setHasPreTaxInvestments] = useState(false);
    
    // Handle drag end for all strategy lists
    const handleDragEnd = (result, strategyType) => {
        if (!result.destination) return;
        
        // Get the appropriate strategy list based on type
        const items = Array.from(
            strategyType === 'expense' ? expenseWithdrawalStrategies : 
            strategyType === 'rmd' ? rmdStrategies : 
            rothConversionStrategies
        );
        
        // Reorder the item in the array
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        // Update the appropriate state
        if (strategyType === 'expense') {
            console.log("Updated expense withdrawal strategies after drag:", items);
            setExpenseWithdrawalStrategies(items);
        } else if (strategyType === 'rmd') {
            console.log("Updated RMD strategies after drag:", items);
            setRmdStrategies(items);
        } else {
            console.log("Updated Roth conversion strategies after drag:", items);
            setRothConversionStrategies(items);
        }
    };

    // Initialize strategy lists based on investments
    useEffect(() => {
        // This is now handled by the useEffect that triggers on page change to page 5
        // Keeping this for backward compatibility but disabling the initialization
        if (investments.length > 0) {
            // Check for pre-tax investments and update flag only
            const hasPreTax = investments.some(inv => inv.taxStatus === 'pre-tax');
            if (page !== 5) {
                setHasPreTaxInvestments(hasPreTax);
            }
        }
    }, [investments, page]);
    
    // Convert strategy lists to string format when submitting
    useEffect(() => {
        // Update text inputs when drag lists change (for backward compatibility)
        setExpenseWithdrawalStrategiesInput(expenseWithdrawalStrategies.join(';'));
        setRmdStrategiesInput(rmdStrategies.join(';'));
        setRothConversionStrategiesInput(rothConversionStrategies.join(';'));
    }, [expenseWithdrawalStrategies, rmdStrategies, rothConversionStrategies]);

    // Load all previously inputted values if editting a Scenario
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

                    // --- Load Life Expectancy Data --- 
                    // User
                    if (response.data.lifeExpectancy) {
                        const le = response.data.lifeExpectancy;
                        setLifeExpectancyMethod(le.lifeExpectancyMethod || '');
                        if (le.lifeExpectancyMethod === 'fixedValue') {
                            setFixedValue(le.fixedValue || '');
                        } else if (le.lifeExpectancyMethod === 'normalDistribution') {
                            setMean(le.normalDistribution?.mean || ''); // Correct state setter
                            setStandardDeviation(le.normalDistribution?.standardDeviation || ''); // Correct state setter
                        }
                    } else {
                         console.warn('User life expectancy data missing from scenario.');
                         // Reset user life expectancy state
                         setLifeExpectancyMethod('');
                         setFixedValue('');
                         setMean('');
                         setStandardDeviation('');
                    }

                    // Spouse
                    if (response.data.scenarioType === 'married' && response.data.spouseLifeExpectancy) {
                        const sle = response.data.spouseLifeExpectancy;
                        setSpouseLifeExpectancyMethod(sle.lifeExpectancyMethod || '');
                        if (sle.lifeExpectancyMethod === 'fixedValue') {
                            setSpouseFixedValue(sle.fixedValue || ''); // Correct state setter
                        } else if (sle.lifeExpectancyMethod === 'normalDistribution') {
                            setSpouseMean(sle.normalDistribution?.mean || ''); // Correct state setter
                            setSpouseStandardDeviation(sle.normalDistribution?.standardDeviation || ''); // Correct state setter
                        }
                    } else {
                         // Reset spouse life expectancy state if not married or data missing
                         setSpouseLifeExpectancyMethod('');
                         setSpouseFixedValue('');
                         setSpouseMean('');
                         setSpouseStandardDeviation('');
                    }
                    // --- End Life Expectancy Data --- 

                    // Fetch Investments with all id's broken down and convert it to the investment format in the form.
                    const responseInvestments = await axios.post(`http://localhost:8000/simulation/scenario/investments`, {scenarioIdEdit: response.data._id});
                    const convertedInvestments = convertInvestmentFormat(responseInvestments.data.investments);
                    setInvestments(convertedInvestments);

                    const convertedInvestmentTypes = convertInvestmentTypeFormat(responseInvestments.data.investmentTypes);
                    setInvestmentTypes(convertedInvestmentTypes);
                    console.log(`Investment Types: ${investmentTypes}`);

                    // Check for pre-tax investments
                    const hasPreTax = convertedInvestments.some(inv => inv.taxStatus === 'pre-tax');
                    setHasPreTaxInvestments(hasPreTax);

                    // Fetch Events with all id's broken down and convert it to the event format in the form.
                    const responseEvents = await axios.post(`http://localhost:8000/simulation/scenario/events`, {scenarioIdEdit: response.data._id});
                    const convertedEvents = convertEventFormat(responseEvents.data.events);
                    setEvents(convertedEvents);

                    // Load simulation settings data (including inflation)
                    if (response.data.simulationSettings) {
                        const settings = response.data.simulationSettings; // Use populated settings directly

                        // Load expense withdrawal strategies if available
                        if (settings.expenseWithdrawalStrategies && settings.expenseWithdrawalStrategies.length > 0) {
                            setExpenseWithdrawalStrategies(settings.expenseWithdrawalStrategies);
                            setExpenseWithdrawalStrategiesInput(settings.expenseWithdrawalStrategies.join(';'));
                        }
                        
                        // Load RMD strategies if available
                        if (settings.rmdStrategies && settings.rmdStrategies.length > 0) {
                            setRmdStrategies(settings.rmdStrategies);
                            setRmdStrategiesInput(settings.rmdStrategies.join(';'));
                        }
                        
                        // Load Roth conversion strategies if available
                        if (settings.rothConversionStrategies && settings.rothConversionStrategies.length > 0) {
                            setRothConversionStrategies(settings.rothConversionStrategies);
                            setRothConversionStrategiesInput(settings.rothConversionStrategies.join(';'));
                        }
                        
                        // Load Roth optimizer settings if available
                        if (settings.rothOptimizerEnable !== undefined) {
                            setRothOptimizerEnable(settings.rothOptimizerEnable);
                            
                            if (settings.rothOptimizerEnable) {
                                setRothRptimizerStartYear(settings.rothOptimizerStartYear || '');
                                setRothOptimizerEndYear(settings.rothOptimizerEndYear || '');
                            }
                        }
                        
                        // Load inflation assumption data
                        if (settings.inflationAssumption) {
                            const inflation = settings.inflationAssumption;
                            setInflationMethod(inflation.method || '');
                            
                            switch (inflation.method) {
                                case 'fixedPercentage':
                                    setFixedPercentage(inflation.fixedPercentage || '');
                                    break;
                                case 'normalPercentage':
                                    setNormalMean(inflation.normalPercentage?.mean || '');
                                    setNormalSd(inflation.normalPercentage?.sd || '');
                                    break;
                                case 'uniformPercentage':
                                    setUniformLower(inflation.uniformPercentage?.lowerBound || '');
                                    setUniformUpper(inflation.uniformPercentage?.upperBound || '');
                                    break;
                                default:
                                    // Clear other fields if method is unknown or not set
                                    setFixedPercentage('');
                                    setNormalMean('');
                                    setNormalSd('');
                                    setUniformLower('');
                                    setUniformUpper('');
                                    break;
                            }
                        } else {
                             // Handle case where inflationAssumption might be missing (optional based on schema?)
                             console.warn('Inflation Assumption data is missing from simulation settings.');
                             setInflationMethod(''); // Reset inflation method state
                             // Optionally reset other inflation fields too
                        }

                    }

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
                setLoading(false);
            }
        }
        fetchScenario();
    }, [reportId]);

    const submitScenario = async (existingReportId) => {
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

            // Format shared users
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
                // Use the arrays directly from our drag-and-drop lists
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
            console.log('Scenario created/updated with ID:', scenarioId);
            
            // Removed step 2: Running simulation immediately
            
            // Removed step 3: Storing report ID
            
            // Removed step 4: Deleting old report (should be handled differently if needed)
            
            // Navigate back to the dashboard
            console.log('Scenario saved. Navigating to dashboard...');
            navigate('/dashboard'); 
            
        } catch (error) {
            console.error('Error during scenario submission or simulation:', error);
            alert('Error: ' + (error.response?.data?.error || error.message || 'Unknown error'));
        }
    };

    // Log investments for debugging
    useEffect(() => {
        //console.log("Investments updated:", investments);
        //console.log("Investment names:", investments.map(inv => inv.name));
        
        // Log pre-tax investments
        const preTaxInvestments = investments.filter(inv => inv.taxStatus === 'pre-tax');
        //console.log("Pre-tax investments:", preTaxInvestments.map(inv => inv.name));
        
        // Log after-tax investments
        const afterTaxInvestments = investments.filter(inv => inv.taxStatus === 'after-tax');
        //console.log("After-tax investments:", afterTaxInvestments.map(inv => inv.name));
        
        // Log tax-exempt investments
        const taxExemptInvestments = investments.filter(inv => inv.investmentType.taxability === 'tax-exempt');
        //console.log("Tax-exempt investments:", taxExemptInvestments.map(inv => inv.name));
        
        // Log non-retirement investments
        const nonRetirementInvestments = investments.filter(inv => inv.taxStatus === 'non-retirement');
        //console.log("Non-retirement investments:", nonRetirementInvestments.map(inv => inv.name));
    }, [investments]);

    // Initialize strategy lists when reaching page 5 or when investments change
    useEffect(() => {
        if (page === 5 && investments.length > 0) {
            // First collect all by tax status
            const postTaxInvestments = investments
                .filter(inv => inv.taxStatus === 'after-tax')
                .map(inv => inv.name);
            
            const preTaxInvestments = investments
                .filter(inv => inv.taxStatus === 'pre-tax')
                .map(inv => inv.name);
            
            const taxExemptInvestments = investments
                .filter(inv => inv.investmentType.taxability === 'tax-exempt')
                .map(inv => inv.name);
            
            const nonRetirementInvestments = investments
                .filter(inv => inv.taxStatus === 'non-retirement')
                .map(inv => inv.name);
            
            // All investments in preferred order
            const allAvailableInvestments = [
                ...postTaxInvestments,
                ...preTaxInvestments,
                ...taxExemptInvestments, 
                ...nonRetirementInvestments
            ];
            
            // Update expense withdrawal strategies - preserve order of existing entries
            setExpenseWithdrawalStrategies(prevStrategies => {
                // Remove investments that no longer exist
                const filteredStrategies = prevStrategies.filter(
                    investment => allAvailableInvestments.includes(investment)
                );
                
                // Add new investments that aren't already in the list
                const newInvestments = allAvailableInvestments.filter(
                    investment => !filteredStrategies.includes(investment)
                );
                
                console.log("Updating expense withdrawal strategies - adding:", newInvestments);
                return [...filteredStrategies, ...newInvestments];
            });
            
            // Update RMD strategies - only if pre-tax investments exist
            if (preTaxInvestments.length > 0) {
                setHasPreTaxInvestments(true);
                
                setRmdStrategies(prevStrategies => {
                    // Remove investments that no longer exist
                    const filteredStrategies = prevStrategies.filter(
                        investment => preTaxInvestments.includes(investment)
                    );
                    
                    // Add new investments that aren't already in the list
                    const newInvestments = preTaxInvestments.filter(
                        investment => !filteredStrategies.includes(investment)
                    );
                    
                    console.log("Updating RMD strategies - adding:", newInvestments);
                    return [...filteredStrategies, ...newInvestments];
                });
                
                setRothConversionStrategies(prevStrategies => {
                    // Remove investments that no longer exist
                    const filteredStrategies = prevStrategies.filter(
                        investment => preTaxInvestments.includes(investment)
                    );
                    
                    // Add new investments that aren't already in the list
                    const newInvestments = preTaxInvestments.filter(
                        investment => !filteredStrategies.includes(investment)
                    );
                    
                    console.log("Updating Roth conversion strategies - adding:", newInvestments);
                    return [...filteredStrategies, ...newInvestments];
                });
            } else {
                setHasPreTaxInvestments(false);
            }
        }
    }, [page, investments]);

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

                            // Save birth year and maximum cash to localStorage
                            localStorage.setItem('dateOfBirth', birthYear);
                            localStorage.setItem('initialMaximumCash', maximumCash);

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

                    {/* Strategy sections with drag and drop */}
                    <div className="strategies-section">
                        <h3>Investment Strategies</h3>
                        <p className="helper-text">
                            Arrange investments in priority order. Investments at the top of the list will be used first, 
                            while those at the bottom will be used last. Drag and drop to reorder.
                        </p>
                        
                        <div className="strategy-list">
                            <h4>Expense Withdrawal Strategy - {expenseWithdrawalStrategies.length} investments</h4>
                            <p className="helper-text">Priority order for withdrawals to cover expenses</p>
                            <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'expense')}>
                                <Droppable droppableId="expenseWithdrawalStrategiesList">
                                    {(provided) => (
                                        <ul 
                                            className="draggable-list"
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {expenseWithdrawalStrategies.length > 0 ? (
                                                expenseWithdrawalStrategies.map((investment, index) => (
                                                    <Draggable key={`expense-${investment}-${index}`} draggableId={`expense-${investment}-${index}`} index={index}>
                                                        {(provided) => (
                                                            <li
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="draggable-item"
                                                            >
                                                                {investment}
                                                            </li>
                                                        )}
                                                    </Draggable>
                                                ))
                                            ) : (
                                                <div className="draggable-list-empty">
                                                    No investments added yet. Please add investments in the Investment Form.
                                                </div>
                                            )}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                        
                        {hasPreTaxInvestments && (
                            <>
                                <div className="strategy-list">
                                    <h4>RMD Strategy (Pre-Tax Investments) - {rmdStrategies.length} investments</h4>
                                    <p className="helper-text">Priority order for required minimum distributions from pre-tax accounts</p>
                                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'rmd')}>
                                        <Droppable droppableId="rmdStrategiesList">
                                            {(provided) => (
                                                <ul 
                                                    className="draggable-list"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {rmdStrategies.length > 0 ? (
                                                        rmdStrategies.map((investment, index) => (
                                                            <Draggable key={`rmd-${investment}-${index}`} draggableId={`rmd-${investment}-${index}`} index={index}>
                                                                {(provided) => (
                                                                    <li
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="draggable-item"
                                                                    >
                                                                        {investment}
                                                                    </li>
                                                                )}
                                                            </Draggable>
                                                        ))
                                                    ) : (
                                                        <div className="draggable-list-empty">
                                                            No pre-tax investments added yet. RMD strategy only applies to pre-tax investments.
                                                        </div>
                                                    )}
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>
                                
                                <div className="strategy-list">
                                    <h4>Roth Conversion Strategy (Pre-Tax Investments) - {rothConversionStrategies.length} investments</h4>
                                    <p className="helper-text">Priority order for Roth conversions from pre-tax accounts</p>
                                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, 'roth')}>
                                        <Droppable droppableId="rothConversionStrategiesList">
                                            {(provided) => (
                                                <ul 
                                                    className="draggable-list"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {rothConversionStrategies.length > 0 ? (
                                                        rothConversionStrategies.map((investment, index) => (
                                                            <Draggable key={`roth-${investment}-${index}`} draggableId={`roth-${investment}-${index}`} index={index}>
                                                                {(provided) => (
                                                                    <li
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className="draggable-item"
                                                                    >
                                                                        {investment}
                                                                    </li>
                                                                )}
                                                            </Draggable>
                                                        ))
                                                    ) : (
                                                        <div className="draggable-list-empty">
                                                            No pre-tax investments added yet. Roth conversion only applies to pre-tax investments.
                                                        </div>
                                                    )}
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>

                                {/* Roth Optimizer section */}
                                <div className="roth-optimizer">
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
                                </div>
                            </>
                        )}
                    </div>

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
                              'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                              'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                              'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                              'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                              'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
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

                            // Validate investment strategies
                            if (expenseWithdrawalStrategies.length === 0) {
                                alert("You must define at least one investment for Expense Withdrawal Strategy.");
                                return;
                            }

                            // Only validate pre-tax strategies if user has pre-tax investments
                            if (hasPreTaxInvestments) {
                                if (rmdStrategies.length === 0) {
                                    alert("You must define at least one investment for RMD Strategy.");
                                    return;
                                }
                                
                                if (rothConversionStrategies.length === 0) {
                                    alert("You must define at least one investment for Roth Conversion Strategy.");
                                    return;
                                }
                                
                                // Validate Roth Optimizer if enabled
                            if (RothOptimizerEnable) {
                                if (!rothRptimizerStartYear || !rothOptimizerEndYear) {
                                    alert("Both Start Year and End Year are required when Roth Optimization is enabled.");
                                    return;
                                    }
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
                            submitScenario(reportId);
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
// Converts InvestmentType taken from Inventory in the Databaseto the format that the form uses to edit a scenario.
function convertInvestmentTypeFormat(dbInvestmentTypes) {
    const newInvestmentTypes = [];
    let i = 0;
    while (i < dbInvestmentTypes.length) {
        newInvestmentTypes.push({
                name: dbInvestmentTypes[i].name ?? '',
                description: dbInvestmentTypes[i].description ?? '',
                expectedReturn: { 
                    returnType: dbInvestmentTypes[i].expectedAnnualReturn?.method ?? '',
                    fixedValue: dbInvestmentTypes[i].expectedAnnualReturn?.fixedValue ?? '', 
                    fixedPercentage: dbInvestmentTypes[i].expectedAnnualReturn?.fixedPercentage ?? '', 
                    normalValue: {
                    mean: dbInvestmentTypes[i].expectedAnnualReturn?.normalValue?.mean ?? '',
                    sd: dbInvestmentTypes[i].expectedAnnualReturn?.normalValue?.sd ?? ''
                    },
                    normalPercentage: {
                    mean: dbInvestmentTypes[i].expectedAnnualReturn?.normalPercentage?.mean ?? '',
                    sd: dbInvestmentTypes[i].expectedAnnualReturn?.normalPercentage?.sd ?? ''
                    }
                },
                expectedIncome: {
                    returnType: dbInvestmentTypes[i].expectedAnnualReturn?.method ?? '',
                    fixedValue: dbInvestmentTypes[i].expectedAnnualReturn?.fixedValue ?? '', 
                    fixedPercentage: dbInvestmentTypes[i].expectedAnnualReturn?.fixedPercentage ?? '', 
                    normalValue: {
                    mean: dbInvestmentTypes[i].expectedAnnualReturn?.normalValue?.mean ?? '',
                    sd: dbInvestmentTypes[i].expectedAnnualReturn?.normalValue?.sd ?? ''
                    },
                    normalPercentage: {
                    mean: dbInvestmentTypes[i].expectedAnnualReturn?.normalPercentage?.mean ?? '',
                    sd: dbInvestmentTypes[i].expectedAnnualReturn?.normalPercentage?.sd ?? ''
                    }
                },
                expenseRatio: dbInvestmentTypes[i].expenseRatio ?? '',
                taxability: dbInvestmentTypes[i].taxability ?? '',
        });
        i++;
    }
    return newInvestmentTypes;
}
// Converts investments taken from the Database to the format that the form uses to edit a scenario.
function convertInvestmentFormat(dbInvestments) {
    const newInvestments = [];
    let i = 0;
    while (i < dbInvestments.length) {
        newInvestments.push({
            name: dbInvestments[i].name ?? '',
            value: dbInvestments[i].value ?? '',
            taxStatus: dbInvestments[i].accountTaxStatus ?? '',
            maxAnnualContribution: dbInvestments[i].maxAnnualContribution ?? '',
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
                expectedIncome: { 
                    returnType: dbInvestments[i].investmentType.expectedAnnualIncome?.method ?? '',
                    fixedValue: dbInvestments[i].investmentType.expectedAnnualIncome?.fixedValue ?? '', 
                    fixedPercentage: dbInvestments[i].investmentType.expectedAnnualIncome?.fixedPercentage ?? '', 
                    normalValue: {
                        mean: dbInvestments[i].investmentType.expectedAnnualIncome?.normalValue?.mean ?? '',
                        sd: dbInvestments[i].investmentType.expectedAnnualincome?.normalValue?.sd ?? ''
                    },
                    normalPercentage: {
                        mean: dbInvestments[i].investmentType.expectedAnnualIncome?.normalPercentage?.mean ?? '',
                        sd: dbInvestments[i].investmentType.expectedAnnualIncome?.normalPercentage?.sd ?? ''
                    }
                },
                expenseRatio: dbInvestments[i].investmentType.expenseRatio ?? '',
                taxability: dbInvestments[i].investmentType.taxability ?? '',
            },
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
                returnType: dbEvents[i].startYear?.method ?? '',
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
                returnType: dbEvents[i].duration?.method ?? '',
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
                    returnType: dbEvents[i].income?.expectedAnnualChange?.method ?? '',
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
                    returnType: dbEvents[i].expense?.expectedAnnualChange?.method ?? '',
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
                allocations : {
                    returnType: dbEvents[i].invest?.allocations?.method ?? '',
                    fixedAllocation: dbEvents[i].invest?.allocations?.fixedAllocation ?? '',
                    glidePath: dbEvents[i].invest?.allocations?.glidePath ?? '',
                },
                modifyMaximumCash: dbEvents[i].invest?.modifyMaximumCash ?? false,
                newMaximumCash: dbEvents[i].invest?.newMaximumCash ?? '',
                investmentStrategy: {
                    taxStatusAllocation: dbEvents[i].invest?.investmentStrategy?.taxStatusAllocation ?? {},
                    preTaxAllocation: dbEvents[i].invest?.investmentStrategy?.preTaxAllocation ?? {},
                    afterTaxAllocation: dbEvents[i].invest?.investmentStrategy?.afterTaxAllocation ?? {},
                    nonRetirementAllocation: dbEvents[i].invest?.investmentStrategy?.nonRetirementAllocation ?? {},
                    taxExemptAllocation: dbEvents[i].invest?.investmentStrategy?.taxExemptAllocation ?? {},
                }
            },
            rebalance: {
                allocations : {
                    returnType: dbEvents[i].rebalance?.allocations?.method ?? '',
                    fixedAllocation: dbEvents[i].rebalance?.allocations?.fixedAllocation ?? '',
                    glidePath: dbEvents[i].rebalance?.allocations?.glidePath ?? '',

                },
                // Add the rebalanceStrategy object with null checks
                rebalanceStrategy: {
                    taxStatusAllocation: dbEvents[i].rebalance?.rebalanceStrategy?.taxStatusAllocation ?? {},
                    preTaxAllocation: dbEvents[i].rebalance?.rebalanceStrategy?.preTaxAllocation ?? {},
                    afterTaxAllocation: dbEvents[i].rebalance?.rebalanceStrategy?.afterTaxAllocation ?? {},
                    nonRetirementAllocation: dbEvents[i].rebalance?.rebalanceStrategy?.nonRetirementAllocation ?? {},
                    taxExemptAllocation: dbEvents[i].rebalance?.rebalanceStrategy?.taxExemptAllocation ?? {}
                }
            }
        });
        
        i++;
    }
    return newEvents;
}

export default NewScenario;
