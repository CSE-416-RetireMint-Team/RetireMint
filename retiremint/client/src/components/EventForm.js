import React, { useState, useEffect } from 'react';

function EventForm({events, setEvents, scenarioType, setPage, investments}) {
    // State for investment strategy allocations
    const [preTaxAllocations, setPreTaxAllocations] = useState({});
    const [afterTaxAllocations, setAfterTaxAllocations] = useState({});
    const [nonRetirementAllocations, setNonRetirementAllocations] = useState({});
    const [taxExemptAllocations, setTaxExemptAllocations] = useState({});
    const [taxStatusAllocations, setTaxStatusAllocations] = useState({});
    
    // Global investment strategy object to store across events
    const [investmentStrategy, setInvestmentStrategy] = useState({
        taxStatusAllocation: {},
        afterTaxAllocation: {},
        nonRetirementAllocation: {},
        taxExemptAllocation: {}
    });
    
    // Store the initial maximum cash value from the first page
    const [initialMaximumCash, setInitialMaximumCash] = useState('');
    // Store the date of birth from the first page
    const [dateOfBirth, setDateOfBirth] = useState('');
    
    // List of available investment tax statuses
    const [availableTaxStatuses, setAvailableTaxStatuses] = useState([]);
    
    // Group investments by tax status
    const preTaxInvestments = investments.filter(inv => inv.taxStatus === 'pre-tax');
    const afterTaxInvestments = investments.filter(inv => inv.taxStatus === 'after-tax');
    const nonRetirementInvestments = investments.filter(inv => inv.taxStatus === 'non-retirement');
    const taxExemptInvestments = investments.filter(inv => 
        inv.investmentType.taxability === 'tax-exempt');

    // Load saved allocation data if it exists
    useEffect(() => {
        // Get the stored initial investment strategy from localStorage
        const savedInvestmentStrategy = localStorage.getItem('initialInvestmentStrategy');
        if (savedInvestmentStrategy) {
            const strategy = JSON.parse(savedInvestmentStrategy);
            
            if (strategy.taxStatusAllocation) setInvestmentStrategy(prev => ({
                ...prev,
                taxStatusAllocation: strategy.taxStatusAllocation
            }));
            
            if (strategy.afterTaxAllocation) setInvestmentStrategy(prev => ({
                ...prev,
                afterTaxAllocation: strategy.afterTaxAllocation
            }));
            
            if (strategy.nonRetirementAllocation) setInvestmentStrategy(prev => ({
                ...prev,
                nonRetirementAllocation: strategy.nonRetirementAllocation
            }));
            
            if (strategy.taxExemptAllocation) setInvestmentStrategy(prev => ({
                ...prev,
                taxExemptAllocation: strategy.taxExemptAllocation
            }));
        }
        
        // Load individual allocation values for form persistence
        const savedTaxStatusAllocations = localStorage.getItem('taxStatusAllocations');
        if (savedTaxStatusAllocations) {
            setTaxStatusAllocations(JSON.parse(savedTaxStatusAllocations));
        }
        
        const savedAfterTaxAllocations = localStorage.getItem('afterTaxAllocations');
        if (savedAfterTaxAllocations) {
            setAfterTaxAllocations(JSON.parse(savedAfterTaxAllocations));
        }
        
        const savedNonRetirementAllocations = localStorage.getItem('nonRetirementAllocations');
        if (savedNonRetirementAllocations) {
            setNonRetirementAllocations(JSON.parse(savedNonRetirementAllocations));
        }
        
        const savedTaxExemptAllocations = localStorage.getItem('taxExemptAllocations');
        if (savedTaxExemptAllocations) {
            setTaxExemptAllocations(JSON.parse(savedTaxExemptAllocations));
        }
        
        // Get the initial maximum cash value
        const savedMaxCash = localStorage.getItem('initialMaximumCash');
        if (savedMaxCash) {
            setInitialMaximumCash(savedMaxCash);
            console.log("Loaded maximum cash from localStorage:", savedMaxCash);
        }
        
        // Get the date of birth
        const savedDateOfBirth = localStorage.getItem('dateOfBirth');
        if (savedDateOfBirth) {
            setDateOfBirth(savedDateOfBirth);
            console.log("Loaded birth year from localStorage:", savedDateOfBirth);
        } else {
            console.warn("No birth year found in localStorage");
        }
    }, []);

    useEffect(() => {
        // Initialize available tax statuses
        const taxStatuses = [];
        if (afterTaxInvestments.length > 0) taxStatuses.push('after-tax');
        if (nonRetirementInvestments.length > 0) taxStatuses.push('non-retirement');
        if (taxExemptInvestments.length > 0) taxStatuses.push('tax-exempt');
        setAvailableTaxStatuses(taxStatuses);
        
        // Initialize allocations with default values only if they aren't already set
        if (Object.keys(afterTaxAllocations).length === 0) {
            const initAfterTaxAlloc = {};
            afterTaxInvestments.forEach(inv => {
                initAfterTaxAlloc[inv.name] = 0;
            });
            setAfterTaxAllocations(initAfterTaxAlloc);
        }
        
        if (Object.keys(nonRetirementAllocations).length === 0) {
            const initNonRetirementAlloc = {};
            nonRetirementInvestments.forEach(inv => {
                initNonRetirementAlloc[inv.name] = 0;
            });
            setNonRetirementAllocations(initNonRetirementAlloc);
        }
        
        if (Object.keys(taxExemptAllocations).length === 0) {
            const initTaxExemptAlloc = {};
            taxExemptInvestments.forEach(inv => {
                initTaxExemptAlloc[inv.name] = 0;
            });
            setTaxExemptAllocations(initTaxExemptAlloc);
        }
        
        // Initialize tax status allocations if they aren't already set
        if (Object.keys(taxStatusAllocations).length === 0) {
            const initTaxStatusAlloc = {};
            taxStatuses.forEach(status => {
                initTaxStatusAlloc[status] = 0;
            });
            setTaxStatusAllocations(initTaxStatusAlloc);
        }
    }, [investments]);

    // Update allocation for a specific investment type within a tax status
    const updateAllocation = (taxStatus, investmentType, value) => {
        // Allow empty string for input, but convert to 0 for calculations
        const numValue = value === '' ? '' : parseInt(value, 10);
        
        switch (taxStatus) {
            case 'after-tax':
                setAfterTaxAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                // Save to localStorage for persistence
                setTimeout(() => {
                    localStorage.setItem('afterTaxAllocations', JSON.stringify({
                        ...afterTaxAllocations,
                        [investmentType]: numValue
                    }));
                }, 0);
                break;
            case 'non-retirement':
                setNonRetirementAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                // Save to localStorage for persistence
                setTimeout(() => {
                    localStorage.setItem('nonRetirementAllocations', JSON.stringify({
                        ...nonRetirementAllocations,
                        [investmentType]: numValue
                    }));
                }, 0);
                break;
            case 'tax-exempt':
                setTaxExemptAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                // Save to localStorage for persistence
                setTimeout(() => {
                    localStorage.setItem('taxExemptAllocations', JSON.stringify({
                        ...taxExemptAllocations,
                        [investmentType]: numValue
                    }));
                }, 0);
                break;
            default:
                break;
        }
    };

    // Update allocation for a tax status
    const updateTaxStatusAllocation = (taxStatus, value) => {
        // Allow empty string for input, but convert to 0 for calculations
        const numValue = value === '' ? '' : parseInt(value, 10);
        setTaxStatusAllocations(prev => ({
            ...prev,
            [taxStatus]: numValue
        }));
        
        // Save to localStorage for persistence
        setTimeout(() => {
            localStorage.setItem('taxStatusAllocations', JSON.stringify({
                ...taxStatusAllocations,
                [taxStatus]: numValue
            }));
        }, 0);
    };

    // Check if all allocations sum to 100
    const validateAllocations = () => {
        // Check after-tax allocations if they exist
        if (afterTaxInvestments.length > 0) {
            const sum = Object.values(afterTaxAllocations).reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert("After-tax investment allocations must sum to 100%");
                return false;
            }
        }
        
        // Check non-retirement allocations if they exist
        if (nonRetirementInvestments.length > 0) {
            const sum = Object.values(nonRetirementAllocations).reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert("Non-retirement investment allocations must sum to 100%");
                return false;
            }
        }
        
        // Check tax-exempt allocations if they exist
        if (taxExemptInvestments.length > 0) {
            const sum = Object.values(taxExemptAllocations).reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert("Tax-exempt investment allocations must sum to 100%");
                return false;
            }
        }
        
        // Check tax status allocations
        const sum = Object.values(taxStatusAllocations).reduce((a, b) => a + b, 0);
        if (sum !== 100) {
            alert("Tax status allocations must sum to 100%");
            return false;
        }
        
        return true;
    };

    const handleEventCountChange = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        setEvents((prev) => {
            // Preserve any INITIAL_INVEST_EVENT in the events array
            const initialEvent = prev.find(event => event.name === 'INITIAL_INVEST_EVENT');
            const regularEvents = prev.filter(event => event.name !== 'INITIAL_INVEST_EVENT');
            const newEvents = [...regularEvents];

            while (newEvents.length < count) {
                newEvents.push({
                    name: '',
                    description: '',
                    startYear: { 
                        returnType: 'fixedValue', 
                        fixedValue: '', 
                        normalValue: { mean: '', sd: '' }, 
                        uniformValue: {lowerBound: '', upperBound: ''},
                        sameYearAsAnotherEvent: '',
                        yearAfterAnotherEventEnd:''
                    },
                    duration: {
                        returnType: '', 
                        fixedValue: '', 
                        normalValue: { mean: '', sd: '' }, 
                        uniformValue: {lowerBound: '', upperBound: ''},
                    },
                    eventType: '',
                    income: {
                        initialAmount: '', 
                        expectedAnnualChange: {
                            returnType: 'fixedValue',
                            fixedValue: '', 
                            normalValue: { mean: '', sd: '' }, 
                            uniformValue: {lowerBound: '', upperBound: ''},
                            fixedPercentage: '', 
                            normalPercentage: { mean: '', sd: '' }, 
                            uniformPercentage: {lowerBound: '', upperBound: ''},
                            
                        },
                        isSocialSecurity: false,
                        inflationAdjustment: false,
                        marriedPercentage: '' 

                    },
                    expense: {
                        initialAmount: '',
                        expectedAnnualChange: {
                            returnType: 'fixedValue',
                            fixedValue: '', 
                            normalValue: { mean: '', sd: '' }, 
                            uniformValue: {lowerBound: '', upperBound: ''},
                            fixedPercentage: '', 
                            normalPercentage: { mean: '', sd: '' }, 
                            uniformPercentage: {lowerBound: '', upperBound: ''},
                            
                        },
                        isDiscretionary: false,
                        inflationAdjustment: false,
                        marriedPercentage: '' 

                    },
                    invest: {
                        returnType: 'fixedAllocation',
                        executionType: 'fixedAllocation',
                        modifyMaximumCash: false,
                        newMaximumCash: initialMaximumCash || localStorage.getItem('initialMaximumCash') || '',
                        modifyTaxStatusAllocation: false,
                        modifyAfterTaxAllocation: false,
                        modifyNonRetirementAllocation: false,
                        modifyTaxExemptAllocation: false,
                        investmentStrategy: {
                            taxStatusAllocation: { ...taxStatusAllocations },
                            afterTaxAllocation: { ...afterTaxAllocations },
                            nonRetirementAllocation: { ...nonRetirementAllocations },
                            taxExemptAllocation: { ...taxExemptAllocations }
                        }
                    },
                    rebalance:{
                        returnType: 'fixedAllocation',
                        executionType: 'fixedAllocation',
                        modifyTaxStatusAllocation: false,
                        modifyPreTaxAllocation: false,
                        modifyAfterTaxAllocation: false,
                        modifyNonRetirementAllocation: false,
                        modifyTaxExemptAllocation: false,
                        taxStatusAllocation: {},
                        preTaxAllocation: {},
                        afterTaxAllocation: {},
                        nonRetirementAllocation: {},
                        taxExemptAllocation: {}
                    }
                });
            }

            // Slice to requested count, then add back the INITIAL_INVEST_EVENT if it exists
            const result = newEvents.slice(0, count);
            return initialEvent ? [...result, initialEvent] : result;
        });
    };

    // Helper function to ensure investmentStrategy is always properly initialized
    const ensureInvestmentStrategy = (event) => {
        if (!event.invest) {
            event.invest = {};
        }
        if (!event.invest.investmentStrategy) {
            event.invest.investmentStrategy = {
                taxStatusAllocation: {},
                afterTaxAllocation: {},
                nonRetirementAllocation: {},
                taxExemptAllocation: {}
            };
        }
        return event;
    };

    const updateEvent = (index, fieldPath, newValue) => {
        setEvents((prev) => {
            // Get only the regular events (not INITIAL_INVEST_EVENT)
            const regularEvents = prev.filter(event => event.name !== 'INITIAL_INVEST_EVENT');
            const initialEvent = prev.find(event => event.name === 'INITIAL_INVEST_EVENT');
            
            // Update the correct event based on the visible index (which is among regular events)
            const updatedRegularEvents = regularEvents.map((event, i) => {
                if (i !== index) return event; // Skip other events
    
                let updatedEvent = { ...event }; // Clone top-level event
                
                // Make sure all required fields exist with empty values if not already present
                if (!updatedEvent.expense) {
                    updatedEvent.expense = {
                        initialAmount: '',
                        expectedAnnualChange: {
                            returnType: 'fixedValue',
                            fixedValue: '',
                            normalValue: { mean: '', sd: '' },
                            uniformValue: { lowerBound: '', upperBound: '' },
                            fixedPercentage: '',
                            normalPercentage: { mean: '', sd: '' },
                            uniformPercentage: { lowerBound: '', upperBound: '' }
                        },
                        isDiscretionary: false,
                        inflationAdjustment: false,
                        marriedPercentage: ''
                    };
                }
                
                if (!updatedEvent.income) {
                    updatedEvent.income = {
                        initialAmount: '',
                        expectedAnnualChange: {
                            returnType: 'fixedValue',
                            fixedValue: '',
                            normalValue: { mean: '', sd: '' },
                            uniformValue: { lowerBound: '', upperBound: '' },
                            fixedPercentage: '',
                            normalPercentage: { mean: '', sd: '' },
                            uniformPercentage: { lowerBound: '', upperBound: '' }
                        },
                        isSocialSecurity: false,
                        inflationAdjustment: false,
                        marriedPercentage: ''
                    };
                }
                
                if (!updatedEvent.rebalance) {
                    updatedEvent.rebalance = {
                        returnType: 'fixedAllocation',
                        executionType: 'fixedAllocation',
                        modifyTaxStatusAllocation: false,
                        modifyPreTaxAllocation: false,
                        modifyAfterTaxAllocation: false,
                        modifyNonRetirementAllocation: false,
                        modifyTaxExemptAllocation: false,
                        taxStatusAllocation: {},
                        preTaxAllocation: {},
                        afterTaxAllocation: {},
                        nonRetirementAllocation: {},
                        taxExemptAllocation: {}
                    };
                }
                
                // If this is an invest event, ensure investmentStrategy is initialized
                if (updatedEvent.eventType === 'invest') {
                    updatedEvent = ensureInvestmentStrategy(updatedEvent);
                }
    
                if (!Array.isArray(fieldPath)) {
                    // Direct top-level update
                    updatedEvent[fieldPath] = newValue;
                } else {
                    // Special handling for allocation fields that should only exist in investmentStrategy
                    const isAllocationField = 
                        fieldPath.length >= 2 && 
                        fieldPath[0] === 'invest' && 
                        ['investmentStrategy', 'afterTaxAllocation', 'nonRetirementAllocation', 'taxExemptAllocation', 'taxStatusAllocation'].includes(fieldPath[1]);
                    
                    if (isAllocationField) {
                        // If we're trying to update any allocation at the invest level, redirect it to investmentStrategy
                        if (fieldPath[1] !== 'investmentStrategy') {
                            const allocationField = fieldPath[1];
                            const value = fieldPath.length > 2 ? 
                                { ...updatedEvent.invest.investmentStrategy[allocationField], [fieldPath[2]]: newValue } :
                                newValue;
                            
                            updatedEvent.invest.investmentStrategy = {
                                ...updatedEvent.invest.investmentStrategy,
                                [allocationField]: value
                            };
                            
                            // Return the modified event - skip the regular update path
                            return updatedEvent;
                        }
                    }
                    
                    // Regular nested update for non-allocation fields
                    let target = updatedEvent;
                    for (let j = 0; j < fieldPath.length - 1; j++) {
                        const key = fieldPath[j];
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
                    
                    // Apply the final update
                    target[fieldPath[fieldPath.length - 1]] = newValue;
                }
    
                return updatedEvent;
            });
            
            // Combine regular events with the INITIAL_INVEST_EVENT if it exists
            return initialEvent 
                ? [...updatedRegularEvents, initialEvent] 
                : updatedRegularEvents;
        });
    };
    
    // Save the validated allocation data
    const saveAllocationData = () => {
        // Create a strategy object based on the allocations
        const strategy = {
            taxStatusAllocation: { ...taxStatusAllocations },
            afterTaxAllocation: { ...afterTaxAllocations },
            nonRetirementAllocation: { ...nonRetirementAllocations },
            taxExemptAllocation: { ...taxExemptAllocations }
        };
        
        // Save the strategy to the global state
        setInvestmentStrategy(strategy);
        
        // Save to localStorage to persist between page navigation
        localStorage.setItem('initialInvestmentStrategy', JSON.stringify(strategy));
        
        // Save the allocation values individually to persist form state
        localStorage.setItem('taxStatusAllocations', JSON.stringify(taxStatusAllocations));
        localStorage.setItem('afterTaxAllocations', JSON.stringify(afterTaxAllocations));
        localStorage.setItem('nonRetirementAllocations', JSON.stringify(nonRetirementAllocations));
        localStorage.setItem('taxExemptAllocations', JSON.stringify(taxExemptAllocations));
        
        // No longer update all invest events - each event maintains its own strategy
    };

    // Add the initial investment strategy as an event
    const createInitialInvestEvent = () => {        
        // Get the initial maximum cash value from localStorage
        const maxCash = initialMaximumCash || localStorage.getItem('initialMaximumCash') || '';
        
        // Create a strategy object based on the allocations but WITHOUT preTaxAllocation
        const strategy = {
            taxStatusAllocation: { ...taxStatusAllocations },
            afterTaxAllocation: { ...afterTaxAllocations },
            nonRetirementAllocation: { ...nonRetirementAllocations },
            taxExemptAllocation: { ...taxExemptAllocations }
        };
        
        // Check which allocations have data and set modifiers accordingly
        const hasTaxStatusAllocations = Object.keys(taxStatusAllocations).length > 0;
        const hasAfterTaxAllocations = Object.keys(afterTaxAllocations).length > 0;
        const hasNonRetirementAllocations = Object.keys(nonRetirementAllocations).length > 0;
        const hasTaxExemptAllocations = Object.keys(taxExemptAllocations).length > 0;
        
        // Create the initial investment event with consistent structure
        const initialInvestEvent = {
            name: 'INITIAL_INVEST_EVENT',
            description: 'Initial investment allocation',
            startYear: { 
                returnType: 'fixedValue', 
                fixedValue: '2025',
                normalValue: { mean: '', sd: '' },
                uniformValue: { lowerBound: '', upperBound: '' },
                sameYearAsAnotherEvent: '',
                yearAfterAnotherEventEnd: ''
            },
            duration: {
                returnType: 'fixedValue',
                fixedValue: '1',
                normalValue: { mean: '', sd: '' },
                uniformValue: { lowerBound: '', upperBound: '' }
            },
            eventType: 'invest',
            expense: {
                initialAmount: '',
                expectedAnnualChange: {
                    returnType: 'fixedValue',
                    fixedValue: '',
                    normalValue: { mean: '', sd: '' },
                    uniformValue: { lowerBound: '', upperBound: '' },
                    fixedPercentage: '',
                    normalPercentage: { mean: '', sd: '' },
                    uniformPercentage: { lowerBound: '', upperBound: '' }
                },
                isDiscretionary: false,
                inflationAdjustment: false,
                marriedPercentage: ''
            },
            income: {
                initialAmount: '',
                expectedAnnualChange: {
                    returnType: 'fixedValue',
                    fixedValue: '',
                    normalValue: { mean: '', sd: '' },
                    uniformValue: { lowerBound: '', upperBound: '' },
                    fixedPercentage: '',
                    normalPercentage: { mean: '', sd: '' },
                    uniformPercentage: { lowerBound: '', upperBound: '' }
                },
                isSocialSecurity: false,
                inflationAdjustment: false,
                marriedPercentage: ''
            },
            invest: {
                returnType: 'fixedAllocation',
                executionType: 'fixedAllocation',
                modifyMaximumCash: true,
                newMaximumCash: maxCash,
                modifyTaxStatusAllocation: hasTaxStatusAllocations,
                modifyAfterTaxAllocation: hasAfterTaxAllocations,
                modifyNonRetirementAllocation: hasNonRetirementAllocations,
                modifyTaxExemptAllocation: hasTaxExemptAllocations,
                investmentStrategy: strategy
            },
            rebalance: {
                returnType: 'fixedAllocation',
                executionType: 'fixedAllocation',
                modifyTaxStatusAllocation: false,
                modifyPreTaxAllocation: false,
                modifyAfterTaxAllocation: false,
                modifyNonRetirementAllocation: false,
                modifyTaxExemptAllocation: false,
                taxStatusAllocation: {},
                preTaxAllocation: {},
                afterTaxAllocation: {},
                nonRetirementAllocation: {},
                taxExemptAllocation: {}
            }
        };

        // Don't modify other events, maintain independence
        console.log("Created initial invest event with start year:", initialInvestEvent.startYear);
        return initialInvestEvent;
    };

    return (
        <div>
            {/* Investment Strategy Form */}
            <div className="investment-strategy-form" style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <h2>Initial Investment Strategy</h2>
                <p>Specify how future income should be allocated to each investment type.</p>
                
                {/* Tax Status Allocation */}
                {availableTaxStatuses.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Tax Status Allocation</h3>
                        <p>Specify what percentage of future income should be allocated to each tax status:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {availableTaxStatuses.map(status => (
                                <div key={status} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        {status === 'after-tax' ? 'After-Tax' : 
                                         status === 'non-retirement' ? 'Non-Retirement' : 'Tax-Exempt'}:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxStatusAllocations[status] || ''}
                                        onChange={(e) => updateTaxStatusAllocation(status, e.target.value)}
                                        onFocus={(e) => {
                                            // Clear the value when focused
                                            updateTaxStatusAllocation(status, '');
                                        }}
                                        style={{ width: '60px' }}
                                    />
                                    <span>%</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                            Total: {Object.values(taxStatusAllocations).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                        </div>
                    </div>
                )}
                
                {/* After-Tax Investment Allocation */}
                {afterTaxInvestments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3>After-Tax Investment Allocation</h3>
                        <p>Specify what percentage of after-tax investments should be allocated to each investment:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {afterTaxInvestments.map(inv => (
                                <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        {inv.name}:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={afterTaxAllocations[inv.name] || ''}
                                        onChange={(e) => updateAllocation('after-tax', inv.name, e.target.value)}
                                        onFocus={(e) => {
                                            // Clear the value when focused
                                            updateAllocation('after-tax', inv.name, '');
                                        }}
                                        style={{ width: '60px' }}
                                    />
                                    <span>%</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                            Total: {Object.values(afterTaxAllocations).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                        </div>
                    </div>
                )}
                
                {/* Non-Retirement Investment Allocation */}
                {nonRetirementInvestments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Non-Retirement Investment Allocation</h3>
                        <p>Specify what percentage of non-retirement investments should be allocated to each investment:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {nonRetirementInvestments.map(inv => (
                                <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        {inv.name}:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={nonRetirementAllocations[inv.name] || ''}
                                        onChange={(e) => updateAllocation('non-retirement', inv.name, e.target.value)}
                                        onFocus={(e) => {
                                            // Clear the value when focused
                                            updateAllocation('non-retirement', inv.name, '');
                                        }}
                                        style={{ width: '60px' }}
                                    />
                                    <span>%</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                            Total: {Object.values(nonRetirementAllocations).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                        </div>
                    </div>
                )}
                
                {/* Tax-Exempt Investment Allocation */}
                {taxExemptInvestments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Tax-Exempt Investment Allocation</h3>
                        <p>Specify what percentage of tax-exempt investments should be allocated to each investment:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {taxExemptInvestments.map(inv => (
                                <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>
                                        {inv.name}:
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxExemptAllocations[inv.name] || ''}
                                        onChange={(e) => updateAllocation('tax-exempt', inv.name, e.target.value)}
                                        onFocus={(e) => {
                                            // Clear the value when focused
                                            updateAllocation('tax-exempt', inv.name, '');
                                        }}
                                        style={{ width: '60px' }}
                                    />
                                    <span>%</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                            Total: {Object.values(taxExemptAllocations).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                        </div>
                    </div>
                )}
            </div>

            <h2>Number of Events:</h2>

            <input
                type="number"
                value={events.filter(event => event.name !== 'INITIAL_INVEST_EVENT').length}
                onChange={handleEventCountChange}
            />

            {events.filter(event => event.name !== 'INITIAL_INVEST_EVENT').map((event, index) => (
                <div key={index}>
                    <h2>Event {index + 1}</h2>

                    {/* Name Input */}
                    <h2>Name: *</h2>
                    <input 
                        type="text" 
                        placeholder="Event Name" 
                        value={event.name} 
                        onChange={(e) => updateEvent(index, ['name'], e.target.value)} 
                    />

                    {/* Description Input */}
                    <h2>Description:</h2>
                    <input 
                        type="text" 
                        placeholder="Event Description" 
                        value={event.description} 
                        onChange={(e) => updateEvent(index, ['description'], e.target.value)} 
                    />


                    {/* Start Year */}
                    <h2>Start Year: *</h2>
                    <select
                        value={event.startYear.returnType}
                        onChange={(e) => updateEvent(index, ['startYear', 'returnType'], e.target.value)}
                    >
                        <option value="fixedValue">Fixed Value</option>
                        <option value="normalValue">Normal Distribution</option>
                        <option value="uniformValue">Uniform Distribution</option>
                        <option value="sameYearAsAnotherEvent">Same Year as Another Event</option>
                        <option value="yearAfterAnotherEventEnd">Year After Another Event Ends</option>
                    </select>

                    {/* Fixed value */}
                    {event.startYear.returnType === 'fixedValue' && (
                        <input
                            type="number"
                            placeholder="Fixed Start Year"
                            value={event.startYear.fixedValue}
                            onChange={(e) => updateEvent(index, ['startYear', 'fixedValue'], e.target.value)}
                        />
                    )}

                    {/* Normal distribution */}
                    {event.startYear.returnType === 'normalValue' && (
                        <div>
                            <input
                                type="number"
                                placeholder="Mean"
                                value={event.startYear.normalValue.mean}
                                onChange={(e) => updateEvent(index, ['startYear', 'normalValue', 'mean'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Standard Deviation"
                                value={event.startYear.normalValue.sd}
                                onChange={(e) => updateEvent(index, ['startYear', 'normalValue', 'sd'], e.target.value)}
                            />
                        </div>
                    )}

                    {/* Uniform distribution */}
                    {event.startYear.returnType === 'uniformValue' && (
                        <div>
                            <input
                                type="number"
                                placeholder="Lower Bound"
                                value={event.startYear.uniformValue.lowerBound}
                                onChange={(e) => updateEvent(index, ['startYear', 'uniformValue', 'lowerBound'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Upper Bound"
                                value={event.startYear.uniformValue.upperBound}
                                onChange={(e) => updateEvent(index, ['startYear', 'uniformValue', 'upperBound'], e.target.value)}
                            />
                        </div>
                    )}

                    {/* Same year as another event */}
                    {event.startYear.returnType === 'sameYearAsAnotherEvent' && (
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={event.startYear.sameYearAsAnotherEvent}
                            onChange={(e) => updateEvent(index, ['startYear', 'sameYearAsAnotherEvent'], e.target.value)}
                        />
                    )}

                    {/* Year after another event ends */}
                    {event.startYear.returnType === 'yearAfterAnotherEventEnd' && (
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={event.startYear.yearAfterAnotherEventEnd}
                            onChange={(e) => updateEvent(index, ['startYear', 'yearAfterAnotherEventEnd'], e.target.value)}
                        />
                    )}


                    {/* Duration */}
                    <h2>Duration: *</h2>

                    {/* Buttons to select return type */}
                    <button onClick={() => updateEvent(index, ['duration', 'returnType'], 'fixedValue')}>
                        Fixed Value
                    </button>

                    <button onClick={() => updateEvent(index, ['duration', 'returnType'], 'normalValue')}>
                        Fixed Value (Normal Distribution)
                    </button>

                    <button onClick={() => updateEvent(index, ['duration', 'returnType'], 'uniformValue')}>
                        Fixed Value (Uniform Distribution)
                    </button>

                    {/* Fixed value */}
                    {event.duration.returnType === 'fixedValue' && (
                        <input
                            type="number"
                            placeholder="Fixed Duration"
                            value={event.duration.fixedValue}
                            onChange={(e) => updateEvent(index, ['duration', 'fixedValue'], e.target.value)}
                        />
                    )}

                    {/* Normal distribution */}
                    {event.duration.returnType === 'normalValue' && (
                        <>
                            <input
                                type="number"
                                placeholder="Mean"
                                value={event.duration.normalValue.mean}
                                onChange={(e) => updateEvent(index, ['duration', 'normalValue', 'mean'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Standard Deviation"
                                value={event.duration.normalValue.sd}
                                onChange={(e) => updateEvent(index, ['duration', 'normalValue', 'sd'], e.target.value)}
                            />
                        </>
                    )}

                    {/* Uniform distribution */}
                    {event.duration.returnType === 'uniformValue' && (
                        <>
                            <input
                                type="number"
                                placeholder="Lower Bound"
                                value={event.duration.uniformValue.lowerBound}
                                onChange={(e) => updateEvent(index, ['duration', 'uniformValue', 'lowerBound'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Upper Bound"
                                value={event.duration.uniformValue.upperBound}
                                onChange={(e) => updateEvent(index, ['duration', 'uniformValue', 'upperBound'], e.target.value)}
                            />
                        </>
                    )}


                    {/* Event Type */}
                    <div>
                        <h2>Event Type: *</h2>
                        <select 
                            value={event.eventType} 
                            onChange={(e) => updateEvent(index, ['eventType'], e.target.value)}
                        >
                            <option value="">Select Event Type</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="invest">Invest</option>
                            <option value="rebalance">Rebalance</option>
                        </select>
                    </div>
                    
                    {event.eventType === 'income' && (
                        <div>
                            {/* Initial Amount */}
                            <h3>Initial Amount: *</h3>
                            <input 
                                type="number" 
                                placeholder="Initial Amount" 
                                value={event.income.initialAmount} 
                                onChange={(e) => updateEvent(index, ['income', 'initialAmount'], e.target.value)} 
                            />

                            {/* Expected Annual Change Type - Select Dropdown */}
                            <h3>Expected Annual Change Type: *</h3>
                            <select
                                value={event.income.expectedAnnualChange.returnType}
                                onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'returnType'], e.target.value)}
                            >
                                <option value="fixedValue">Fixed Value</option>
                                <option value="fixedPercentage">Fixed Percentage</option>
                                <option value="normalValue">Normal Distribution (Fixed Value)</option>
                                <option value="normalPercentage">Normal Distribution (Percentage)</option>
                                <option value="uniformValue">Uniform Distribution (Fixed)</option>
                                <option value="uniformPercentage">Uniform Distribution (Percentage)</option>
                            </select>

                            {/* Fixed Value */}
                            {event.income.expectedAnnualChange.returnType === 'fixedValue' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Annual Change" 
                                    value={event.income.expectedAnnualChange.fixedValue} 
                                    onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'fixedValue'], e.target.value)} 
                                />
                            )}

                            {/* Fixed Percentage */}
                            {event.income.expectedAnnualChange.returnType === 'fixedPercentage' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Percentage (%)" 
                                    value={event.income.expectedAnnualChange.fixedPercentage} 
                                    onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'fixedPercentage'], e.target.value)} 
                                />
                            )}

                            {/* Normal Distribution (Fixed Value) */}
                            {event.income.expectedAnnualChange.returnType === 'normalValue' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean" 
                                        value={event.income.expectedAnnualChange.normalValue.mean} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'normalValue', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation" 
                                        value={event.income.expectedAnnualChange.normalValue.sd} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'normalValue', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {event.income.expectedAnnualChange.returnType === 'normalPercentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean (%)" 
                                        value={event.income.expectedAnnualChange.normalPercentage.mean} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'normalPercentage', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation (%)" 
                                        value={event.income.expectedAnnualChange.normalPercentage.sd} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'normalPercentage', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Fixed) */}
                            {event.income.expectedAnnualChange.returnType === 'uniformValue' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound" 
                                        value={event.income.expectedAnnualChange.uniformValue.lowerBound} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'uniformValue', 'lowerBound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound" 
                                        value={event.income.expectedAnnualChange.uniformValue.upperBound} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'uniformValue', 'upperBound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Percentage) */}
                            {event.income.expectedAnnualChange.returnType === 'uniformPercentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound (%)" 
                                        value={event.income.expectedAnnualChange.uniformPercentage.lowerBound} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'uniformPercentage', 'lowerBound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound (%)" 
                                        value={event.income.expectedAnnualChange.uniformPercentage.upperBound} 
                                        onChange={(e) => updateEvent(index, ['income', 'expectedAnnualChange', 'uniformPercentage', 'upperBound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Social Security */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.income.isSocialSecurity} 
                                    onChange={(e) => updateEvent(index, ['income', 'isSocialSecurity'], e.target.checked)} 
                                />
                                Is Social Security?
                            </label>

                            {/* Inflation Adjustment */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.income.inflationAdjustment} 
                                    onChange={(e) => updateEvent(index, ['income', 'inflationAdjustment'], e.target.checked)} 
                                />
                                Inflation Adjustment?
                            </label>

                            {/* Married Percentage (only if scenarioType is married) */}
                            {scenarioType === 'married' && (
                                <>
                                    <h3>Married Percentage</h3>
                                    <input 
                                        type="number" 
                                        placeholder="Married Percentage" 
                                        value={event.income.marriedPercentage} 
                                        onChange={(e) => updateEvent(index, ['income', 'marriedPercentage'], e.target.value)} 
                                    />
                                </>
                            )}
                        </div>
                    )}


                    {event.eventType === 'expense' && (
                        <div>
                            {/* Initial Amount */}
                            <h3>Initial Amount: *</h3>
                            <input 
                                type="number" 
                                placeholder="Initial Amount" 
                                value={event.expense.initialAmount} 
                                onChange={(e) => updateEvent(index, ['expense', 'initialAmount'], e.target.value)} 
                            />

                            {/* Expected Annual Change Type - Select Dropdown */}
                            <h3>Expected Annual Change Type:</h3>
                            <select
                                value={event.expense.expectedAnnualChange.returnType}
                                onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'returnType'], e.target.value)}
                            >
                                <option value="fixedValue">Fixed Value</option>
                                <option value="fixedPercentage">Fixed Percentage</option>
                                <option value="normalValue">Normal Distribution (Fixed Value)</option>
                                <option value="normalPercentage">Normal Distribution (Percentage)</option>
                                <option value="uniformValue">Uniform Distribution (Fixed)</option>
                                <option value="uniformPercentage">Uniform Distribution (Percentage)</option>
                            </select>

                            {/* Fixed Value */}
                            {event.expense.expectedAnnualChange.returnType === 'fixedValue' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Annual Change" 
                                    value={event.expense.expectedAnnualChange.fixedValue} 
                                    onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'fixedValue'], e.target.value)} 
                                />
                            )}

                            {/* Fixed Percentage */}
                            {event.expense.expectedAnnualChange.returnType === 'fixedPercentage' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Percentage (%)" 
                                    value={event.expense.expectedAnnualChange.fixedPercentage} 
                                    onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'fixedPercentage'], e.target.value)} 
                                />
                            )}

                            {/* Normal Distribution (Fixed Value) */}
                            {event.expense.expectedAnnualChange.returnType === 'normalValue' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean" 
                                        value={event.expense.expectedAnnualChange.normalValue.mean} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'normalValue', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation" 
                                        value={event.expense.expectedAnnualChange.normalValue.sd} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'normalValue', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {event.expense.expectedAnnualChange.returnType === 'normalPercentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean (%)" 
                                        value={event.expense.expectedAnnualChange.normalPercentage.mean} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'normalPercentage', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation (%)" 
                                        value={event.expense.expectedAnnualChange.normalPercentage.sd} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'normalPercentage', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Fixed) */}
                            {event.expense.expectedAnnualChange.returnType === 'uniformValue' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound" 
                                        value={event.expense.expectedAnnualChange.uniformValue.lowerBound} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'uniformValue', 'lowerBound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound" 
                                        value={event.expense.expectedAnnualChange.uniformValue.upperBound} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'uniformValue', 'upperBound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Percentage) */}
                            {event.expense.expectedAnnualChange.returnType === 'uniformPercentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound (%)" 
                                        value={event.expense.expectedAnnualChange.uniformPercentage.lowerBound} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'uniformPercentage', 'lowerBound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound (%)" 
                                        value={event.expense.expectedAnnualChange.uniformPercentage.upperBound} 
                                        onChange={(e) => updateEvent(index, ['expense', 'expectedAnnualChange', 'uniformPercentage', 'upperBound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Discretionary Checkbox */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.expense.isDiscretionary} 
                                    onChange={(e) => updateEvent(index, ['expense', 'isDiscretionary'], e.target.checked)} 
                                />
                                Is Discretionary?
                            </label>

                            {/* Inflation Adjustment */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.expense.inflationAdjustment} 
                                    onChange={(e) => updateEvent(index, ['expense', 'inflationAdjustment'], e.target.checked)} 
                                />
                                Inflation Adjustment?
                            </label>

                            {/* Married Percentage (only if scenarioType is married) */}
                            {scenarioType === 'married' && (
                                <>
                                    <h3>Married Percentage</h3>
                                    <input 
                                        type="number" 
                                        placeholder="Married Percentage" 
                                        value={event.expense.marriedPercentage} 
                                        onChange={(e) => updateEvent(index, ['expense', 'marriedPercentage'], e.target.value)} 
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* INVEST SECTION - Fixed the nesting issues */}
                    {event.eventType === 'invest' && (
                        <div>
                            {/* Return Type Selection Buttons */}
                            <h3>Execution Type: *</h3>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name={`executionType-${index}`}
                                        value="fixedAllocation"
                                        checked={event.invest.executionType === 'fixedAllocation'}
                                        onChange={() => {
                                            updateEvent(index, ['invest', 'executionType'], 'fixedAllocation')
                                            updateEvent(index, ['invest', 'returnType'], 'fixedAllocation')
                                        }}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Fixed Allocation
                                </label>
                                
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name={`executionType-${index}`}
                                        value="glidePath"
                                        checked={event.invest.executionType === 'glidePath'}
                                        onChange={() => {
                                            updateEvent(index, ['invest', 'executionType'], 'glidePath')
                                            updateEvent(index, ['invest', 'returnType'], 'glidePath')
                                        }}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Glide Path
                                </label>
                            </div>
                            
                            {event.invest.executionType === 'glidePath' && (
                                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '5px', fontSize: '0.9em' }}>
                                    <p style={{ margin: '0' }}>
                                        Assets will increase or decrease linearly from the rates they previously were at to the rates you are now specifying over the event duration.
                                    </p>
                                </div>
                            )}

                            {/* Maximum Cash Option */}
                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    <input
                                        type="checkbox" 
                                        checked={event.invest.modifyMaximumCash || false} 
                                        onChange={(e) => updateEvent(index, ['invest', 'modifyMaximumCash'], e.target.checked)} 
                                    />
                                    Modify Maximum Cash
                                </label>
                                
                                {event.invest.modifyMaximumCash && (
                                    <div style={{ marginLeft: '20px', marginTop: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            New Maximum Cash:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={event.invest.newMaximumCash || ''}
                                            onChange={(e) => updateEvent(index, ['invest', 'newMaximumCash'], e.target.value)}
                                            style={{ width: '100px' }}
                                        />
                                        <span>$</span>
                                    </div>
                                )}
                            </div>

                            {/* Allocation Strategy Selection */}
                            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                                <h3>Which allocation strategy would you like to modify?</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.invest.modifyTaxStatusAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['invest', 'modifyTaxStatusAllocation'], e.target.checked)} 
                                        />
                                        Tax-Status Allocation
                                    </label>
                                    
                                    {event.invest.modifyTaxStatusAllocation && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            {availableTaxStatuses.length > 0 && (
                                                <div>
                                                    <h4>Tax Status Allocation</h4>
                                                    <p>Specify what percentage of future income should be allocated to each tax status:</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {availableTaxStatuses.map(status => (
                                                            <div key={status} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                                                    {status === 'after-tax' ? 'After-Tax' : 
                                                                     status === 'non-retirement' ? 'Non-Retirement' : 'Tax-Exempt'}:
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={event.invest.investmentStrategy.taxStatusAllocation?.[status] || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                        // Only update within investmentStrategy
                                                                        updateEvent(index, ['invest', 'investmentStrategy', 'taxStatusAllocation'], {
                                                                            ...event.invest.investmentStrategy.taxStatusAllocation || {},
                                                                            [status]: value
                                                                        });
                                                                    }}
                                                                    style={{ width: '60px' }}
                                                                />
                                                                <span>%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                        Total: {Object.values(event.invest.investmentStrategy.taxStatusAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.invest.modifyAfterTaxAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['invest', 'modifyAfterTaxAllocation'], e.target.checked)} 
                                        />
                                        After-Tax Allocation
                                    </label>
                                    
                                    {event.invest.modifyAfterTaxAllocation && afterTaxInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>After-Tax Investment Allocation</h4>
                                            <p>Specify what percentage of after-tax investments should be allocated to each investment:</p>
                                                                                        {event.invest.modifyAfterTaxAllocation && afterTaxInvestments.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {afterTaxInvestments.map(inv => (
                                                        <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                                                {inv.name}:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={event.invest.investmentStrategy.afterTaxAllocation?.[inv.name] || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                    // Update the value in investmentStrategy ONLY
                                                                    updateEvent(index, ['invest', 'investmentStrategy', 'afterTaxAllocation'], {
                                                                        ...event.invest.investmentStrategy.afterTaxAllocation || {},
                                                                        [inv.name]: value
                                                                    });
                                                                }}
                                                                style={{ width: '60px' }}
                                                            />
                                                            <span>%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.invest.investmentStrategy.afterTaxAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.invest.modifyNonRetirementAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['invest', 'modifyNonRetirementAllocation'], e.target.checked)} 
                                        />
                                        Non-Retirement Allocation
                                    </label>
                                    
                                    {event.invest.modifyNonRetirementAllocation && nonRetirementInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Non-Retirement Investment Allocation</h4>
                                            <p>Specify what percentage of non-retirement investments should be allocated to each investment:</p>
                                                                                        {event.invest.modifyNonRetirementAllocation && nonRetirementInvestments.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {nonRetirementInvestments.map(inv => (
                                                        <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                                                {inv.name}:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={event.invest.investmentStrategy.nonRetirementAllocation?.[inv.name] || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                    // Only update in investmentStrategy
                                                                    updateEvent(index, ['invest', 'investmentStrategy', 'nonRetirementAllocation'], {
                                                                        ...event.invest.investmentStrategy.nonRetirementAllocation || {},
                                                                        [inv.name]: value
                                                                    });
                                                                }}
                                                                style={{ width: '60px' }}
                                                            />
                                                            <span>%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.invest.investmentStrategy.nonRetirementAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.invest.modifyTaxExemptAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['invest', 'modifyTaxExemptAllocation'], e.target.checked)} 
                                        />
                                        Tax-Exempt Allocation
                                    </label>
                                    
                                    {event.invest.modifyTaxExemptAllocation && taxExemptInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Tax-Exempt Investment Allocation</h4>
                                            <p>Specify what percentage of tax-exempt investments should be allocated to each investment:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {taxExemptInvestments.map(inv => (
                                                    <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                                            {inv.name}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={event.invest.investmentStrategy.taxExemptAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                // Only update in investmentStrategy
                                                                updateEvent(index, ['invest', 'investmentStrategy', 'taxExemptAllocation'], {
                                                                    ...event.invest.investmentStrategy.taxExemptAllocation || {},
                                                                    [inv.name]: value
                                                                });
                                                            }}
                                                            style={{ width: '60px' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.invest.investmentStrategy.taxExemptAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REBALANCE SECTION - Fixed the nesting issues */}
                    {event.eventType === 'rebalance' && (
                        <div>
                            {/* Return Type Selection Buttons */}
                            <h3>Execution Type: *</h3>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name={`executionType-rebalance-${index}`}
                                        value="fixedAllocation"
                                        checked={event.rebalance.executionType === 'fixedAllocation'}
                                        onChange={() => {
                                            updateEvent(index, ['rebalance', 'executionType'], 'fixedAllocation')
                                            updateEvent(index, ['rebalance', 'returnType'], 'fixedAllocation')
                                        }}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Fixed Allocation
                                </label>
                                
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input 
                                        type="radio" 
                                        name={`executionType-rebalance-${index}`}
                                        value="glidePath"
                                        checked={event.rebalance.executionType === 'glidePath'}
                                        onChange={() => {
                                            updateEvent(index, ['rebalance', 'executionType'], 'glidePath')
                                            updateEvent(index, ['rebalance', 'returnType'], 'glidePath')
                                        }}
                                        style={{ marginRight: '5px' }}
                                    />
                                    Glide Path
                                </label>
                            </div>
                            
                            {event.rebalance.executionType === 'glidePath' && (
                                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '5px', fontSize: '0.9em' }}>
                                    <p style={{ margin: '0' }}>
                                        Assets will increase or decrease linearly from the rates they previously were at to the rates you are now specifying over the event duration.
                                    </p>
                                </div>
                            )}

                            {/* Allocation Strategy Selection */}
                            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                                <h3>Over what domain would you like to rebalance?</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label>
                                        <input
                                            type="checkbox" 
                                            checked={event.rebalance.modifyTaxStatusAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyTaxStatusAllocation'], e.target.checked)} 
                                        />
                                        Rebalance by Tax-Status
                                    </label>
                                    
                                    {event.rebalance.modifyTaxStatusAllocation && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            {availableTaxStatuses.length > 0 && (
                                                <div>
                                                    <h4>Tax Status Rebalance</h4>
                                                    <p>Specify what percentage of assets should be rebalanced to each tax status:</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {availableTaxStatuses.map(status => (
                                                            <div key={status} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                                                    {status === 'after-tax' ? 'After-Tax' : 
                                                                     status === 'non-retirement' ? 'Non-Retirement' : 'Tax-Exempt'}:
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={event.rebalance.taxStatusAllocation?.[status] || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                        updateEvent(index, ['rebalance', 'taxStatusAllocation'], {
                                                                            ...event.rebalance.taxStatusAllocation || {},
                                                                            [status]: value
                                                                        });
                                                                    }}
                                                                    style={{ width: '60px' }}
                                                                />
                                                                <span>%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                        Total: {Object.values(event.rebalance.taxStatusAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input
                                            type="checkbox" 
                                            checked={event.rebalance.modifyAfterTaxAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyAfterTaxAllocation'], e.target.checked)} 
                                        />
                                        Rebalance After-Tax Assets
                                    </label>
                                    
                                    {event.rebalance.modifyAfterTaxAllocation && afterTaxInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>After-Tax Investment Rebalance</h4>
                                            <p>Specify how after-tax investments should be rebalanced:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {afterTaxInvestments.map(inv => (
                                                    <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                                            {inv.name}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={event.rebalance.afterTaxAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['rebalance', 'afterTaxAllocation'], {
                                                                    ...event.rebalance.afterTaxAllocation || {},
                                                                    [inv.name]: value
                                                                });
                                                            }}
                                                            style={{ width: '60px' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.rebalance.afterTaxAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.rebalance.modifyNonRetirementAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyNonRetirementAllocation'], e.target.checked)} 
                                        />
                                        Rebalance Non-Retirement Assets
                                    </label>
                                    
                                    {event.rebalance.modifyNonRetirementAllocation && nonRetirementInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Non-Retirement Investment Rebalance</h4>
                                            <p>Specify how non-retirement investments should be rebalanced:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {nonRetirementInvestments.map(inv => (
                                                    <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                                            {inv.name}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={event.rebalance.nonRetirementAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['rebalance', 'nonRetirementAllocation'], {
                                                                    ...event.rebalance.nonRetirementAllocation || {},
                                                                    [inv.name]: value
                                                                });
                                                            }}
                                                            style={{ width: '60px' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.rebalance.nonRetirementAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.rebalance.modifyTaxExemptAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyTaxExemptAllocation'], e.target.checked)} 
                                        />
                                        Rebalance Tax-Exempt Assets
                                    </label>
                                    
                                    {event.rebalance.modifyTaxExemptAllocation && taxExemptInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Tax-Exempt Investment Rebalance</h4>
                                            <p>Specify how tax-exempt investments should be rebalanced:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {taxExemptInvestments.map(inv => (
                                                    <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                                            {inv.name}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={event.rebalance.taxExemptAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['rebalance', 'taxExemptAllocation'], {
                                                                    ...event.rebalance.taxExemptAllocation || {},
                                                                    [inv.name]: value
                                                                });
                                                            }}
                                                            style={{ width: '60px' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.rebalance.taxExemptAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.rebalance.modifyPreTaxAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyPreTaxAllocation'], e.target.checked)} 
                                        />
                                        Rebalance Pre-Tax Assets
                                    </label>
                                    
                                    {event.rebalance.modifyPreTaxAllocation && preTaxInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Pre-Tax Investment Rebalance</h4>
                                            <p>Specify how pre-tax investments should be rebalanced:</p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {preTaxInvestments.map(inv => (
                                                    <div key={inv.name} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                                            {inv.name}:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={event.rebalance.preTaxAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['rebalance', 'preTaxAllocation'], {
                                                                    ...event.rebalance.preTaxAllocation || {},
                                                                    [inv.name]: value
                                                                });
                                                            }}
                                                            style={{ width: '60px' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                                                Total: {Object.values(event.rebalance.preTaxAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Navigation Buttons */}
            <div>
                <button onClick={() => setPage(3)}>Previous</button>
                
                <button onClick={() => {
                    console.log('Starting form validation...');
                    
                    // First validate all investment allocations
                    if (!validateAllocations()) {
                        console.log('Investment allocations validation failed');
                        return;
                    }
                    
                    // Save allocation data if validation passes
                    saveAllocationData();
                    
                    if (events.length === 0) {
                        console.log('No events found');
                        alert("At least one event is required.");
                        return;
                    }

                    let validationPassed = true;

                    for (const event of events) {
                        console.log(`Validating event: ${event.name}`);
                        
                        // Ensure the event has a name
                        if (!event.name.trim()) {
                            console.log(`Event missing name: ${event.name}`);
                            alert("Each event must have a Name.");
                            validationPassed = false;
                            break;
                        }

                        // Validate startYear
                        if (!event.startYear.returnType) {
                            console.log(`Event missing startYear returnType: ${event.name}`);
                            alert(`Event "${event.name}" must have a Start Year Return Type.`);
                            validationPassed = false;
                            break;
                        }

                        switch (event.startYear.returnType) {
                            case 'fixedValue':
                                if (!event.startYear.fixedValue) {
                                    console.log(`Event missing fixedValue for startYear: ${event.name}`);
                                    alert(`Event "${event.name}" requires a Fixed Value for Start Year.`);
                                    validationPassed = false;
                                    break;
                                }
                                break;

                            case 'normalValue':
                                if (!event.startYear.normalValue.mean || !event.startYear.normalValue.sd) {
                                    alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Start Year.`);
                                    return;
                                }
                                break;

                            case 'uniformValue':
                                if (!event.startYear.uniformValue.lowerBound || !event.startYear.uniformValue.upperBound) {
                                    alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Start Year.`);
                                    return;
                                }
                                break;

                            case 'sameYearAsAnotherEvent':
                                if (!event.startYear.sameYearAsAnotherEvent) {
                                    alert(`Event "${event.name}" must specify another event for Same Year Start.`);
                                    return;
                                }
                                break;

                            case 'yearAfterAnotherEventEnd':
                                if (!event.startYear.yearAfterAnotherEventEnd) {
                                    alert(`Event "${event.name}" must specify another event for Year After Another Event Ends.`);
                                    return;
                                }
                                break;

                            default:
                                // No action needed for unknown return type
                                break;
                        }

                        if (!validationPassed) break;

                        // Ensure the event has an event type
                        if (!event.eventType) {
                            console.log(`Event missing eventType: ${event.name}`);
                            alert(`Event "${event.name}" must have an Event Type.`);
                            validationPassed = false;
                            break;
                        }

                        switch (event.eventType) {
                            case 'income':
                            case 'expense':
                                const isIncome = event.eventType === 'income';
                                const eventData = isIncome ? event.income : event.expense;
                        
                                if (!eventData.initialAmount) {
                                    console.log(`Event missing initialAmount: ${event.name}`);
                                    alert(`Event "${event.name}" requires an Initial Amount.`);
                                    validationPassed = false;
                                    break;
                                }
                        
                                if (!eventData.expectedAnnualChange.returnType) {
                                    console.log(`Event missing expectedAnnualChange returnType: ${event.name}`);
                                    alert(`Event "${event.name}" must have a Return Type for Expected Annual Change.`);
                                    validationPassed = false;
                                    break;
                                }
                        
                                switch (eventData.expectedAnnualChange.returnType) {
                                    case 'fixedValue':
                                        if (!eventData.expectedAnnualChange.fixedValue) {
                                            alert(`Event "${event.name}" requires a Fixed Value for Expected Annual Change.`);
                                            return;
                                        }
                                        break;
                                    case 'normalValue':
                                        if (!eventData.expectedAnnualChange.normalValue.mean || !eventData.expectedAnnualChange.normalValue.sd) {
                                            alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Value.`);
                                            return;
                                        }
                                        break;
                                    case 'uniformValue':
                                        if (!eventData.expectedAnnualChange.uniformValue.lowerBound || !eventData.expectedAnnualChange.uniformValue.upperBound) {
                                            alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Value.`);
                                            return;
                                        }
                                        break;
                                    case 'fixedPercentage':
                                        if (!eventData.expectedAnnualChange.fixedPercentage) {
                                            alert(`Event "${event.name}" requires a Fixed Percentage for Expected Annual Change.`);
                                            return;
                                        }
                                        break;
                                    case 'normalPercentage':
                                        if (!eventData.expectedAnnualChange.normalPercentage.mean || !eventData.expectedAnnualChange.normalPercentage.sd) {
                                            alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                            return;
                                        }
                                        break;
                                    case 'uniformPercentage':
                                        if (!eventData.expectedAnnualChange.uniformPercentage.lowerBound || !eventData.expectedAnnualChange.uniformPercentage.upperBound) {
                                            alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Percentage.`);
                                            return;
                                        }
                                        break;
                                    default:
                                        // No action needed for unknown return type
                                        break;
                                }
                        
                                if (scenarioType === 'married' && !eventData.marriedPercentage) {
                                    alert(`Event "${event.name}" requires a Married Percentage because the scenario is Married.`);
                                    return;
                                }
                                break;
                        
                            case 'invest':
                            case 'rebalance':
                                const isInvest = event.eventType === 'invest';
                                const investData = isInvest ? event.invest : event.rebalance;
                        
                                if (!investData.executionType) {
                                    console.log(`${isInvest ? 'Invest' : 'Rebalance'} event missing executionType: ${event.name}`);
                                    alert(`Event "${event.name}" must have an Execution Type.`);
                                    validationPassed = false;
                                    break;
                                }
                                
                                if (isInvest) {
                                    // Validate allocation modifications for invest events
                                    if (investData.modifyTaxStatusAllocation) {
                                        const sum = Object.values(investData.investmentStrategy?.taxStatusAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`Tax status allocations don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" tax status allocations must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    // Check maximum cash if modified
                                    if (investData.modifyMaximumCash) {
                                        if (!investData.newMaximumCash) {
                                            console.log(`Maximum cash value missing: ${event.name}`);
                                            alert(`Event "${event.name}" requires a New Maximum Cash value when Modify Maximum Cash is checked.`);
                                            validationPassed = false;
                                            break;
                                        }
                                        if (isNaN(parseInt(investData.newMaximumCash, 10))) {
                                            console.log(`Maximum cash value must be a number: ${event.name}`);
                                            alert(`Event "${event.name}" Maximum Cash value must be a valid number.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }

                                    // Check if at least one allocation strategy is selected
                                    if (!investData.modifyTaxStatusAllocation && 
                                        !investData.modifyAfterTaxAllocation && 
                                        !investData.modifyNonRetirementAllocation && 
                                        !investData.modifyTaxExemptAllocation) {
                                        console.log(`No allocation strategy selected: ${event.name}`);
                                        alert(`Event "${event.name}" must have at least one allocation strategy selected.`);
                                        validationPassed = false;
                                        break;
                                    }
                                }
                                else {
                                    // Validate rebalance event allocation selections
                                    if (investData.modifyTaxStatusAllocation) {
                                        const sum = Object.values(investData.taxStatusAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`Tax status allocations for rebalance don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" tax status allocations for rebalance must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    if (investData.modifyAfterTaxAllocation) {
                                        const sum = Object.values(investData.afterTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`After-tax allocations for rebalance don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" after-tax allocations for rebalance must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    if (investData.modifyNonRetirementAllocation) {
                                        const sum = Object.values(investData.nonRetirementAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`Non-retirement allocations for rebalance don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" non-retirement allocations for rebalance must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    if (investData.modifyTaxExemptAllocation) {
                                        const sum = Object.values(investData.taxExemptAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`Tax-exempt allocations for rebalance don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" tax-exempt allocations for rebalance must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    if (investData.modifyPreTaxAllocation) {
                                        const sum = Object.values(investData.preTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            console.log(`Pre-tax allocations for rebalance don't sum to 100%: ${event.name}`);
                                            alert(`Event "${event.name}" pre-tax allocations for rebalance must sum to 100%.`);
                                            validationPassed = false;
                                            break;
                                        }
                                    }
                                    
                                    // Check if at least one rebalance domain is selected
                                    if (!investData.modifyTaxStatusAllocation && 
                                        !investData.modifyAfterTaxAllocation && 
                                        !investData.modifyNonRetirementAllocation && 
                                        !investData.modifyTaxExemptAllocation &&
                                        !investData.modifyPreTaxAllocation) {
                                        console.log(`No rebalance domain selected: ${event.name}`);
                                        alert(`Event "${event.name}" must have at least one domain selected for rebalancing.`);
                                        validationPassed = false;
                                        break;
                                    }
                                }
                                break;

                            default:
                                // No action needed for unknown event type
                                break;
                        }
                        
                        if (!validationPassed) break;
                    }

                    if (validationPassed) {
                        console.log('All validations passed, proceeding to next page');
                        
                        // Save allocation data if validation passes
                        saveAllocationData();
                        
                        // Create the initial investment event
                        const initialInvestEvent = createInitialInvestEvent();
                        
                        // Validate the initial invest event
                        if (!initialInvestEvent.startYear.fixedValue) {
                            console.log('Initial invest event missing start year');
                            alert("Error: Birth year information is missing. Please return to the first page and enter your birth year.");
                            return;
                        }
                        
                        // Add the initial investment event to the events array
                        setEvents(prevEvents => {
                            // Make sure we don't add duplicates
                            const filteredEvents = prevEvents.filter(event => event.name !== 'INITIAL_INVEST_EVENT');
                            // Place initialInvestEvent as the first element in the array
                            const updatedEvents = [initialInvestEvent, ...filteredEvents];
                            
                            // Log the updated events array for debugging
                            console.log("Events array with INITIAL_INVEST_EVENT:", updatedEvents);
                            
                            // Store in localStorage to ensure persistence
                            localStorage.setItem('events', JSON.stringify(updatedEvents));
                            
                            return updatedEvents;
                        });
                        
                        // Navigate to the next page with a delay to ensure state updates
                        setTimeout(() => {
                            console.log("Navigating to next page...");
                            setPage(5);
                        }, 200); // Increased delay to ensure event is added before navigating
                    } else {
                        console.log('Validation failed, not proceeding to next page');
                    }
                }}>Next</button>
            </div>
        </div>
    );
}

export default EventForm;