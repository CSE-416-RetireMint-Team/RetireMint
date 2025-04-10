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
        preTaxAllocation: {},
        afterTaxAllocation: {},
        nonRetirementAllocation: {},
        taxExemptAllocation: {}
    });
    
    // List of available investment tax statuses
    const [availableTaxStatuses, setAvailableTaxStatuses] = useState([]);
    
    // Group investments by tax status
    const preTaxInvestments = investments.filter(inv => inv.taxStatus === 'pre-tax');
    const afterTaxInvestments = investments.filter(inv => inv.taxStatus === 'after-tax');
    const nonRetirementInvestments = investments.filter(inv => inv.taxStatus === 'non-retirement');
    const taxExemptInvestments = investments.filter(inv => 
        inv.investmentType.taxability === 'tax-exempt');

    useEffect(() => {
        // Initialize available tax statuses
        const taxStatuses = [];
        if (preTaxInvestments.length > 0) taxStatuses.push('pre-tax');
        if (afterTaxInvestments.length > 0) taxStatuses.push('after-tax');
        if (nonRetirementInvestments.length > 0) taxStatuses.push('non-retirement');
        if (taxExemptInvestments.length > 0) taxStatuses.push('tax-exempt');
        setAvailableTaxStatuses(taxStatuses);
        
        // Initialize allocations with default values
        const initPreTaxAlloc = {};
        preTaxInvestments.forEach(inv => {
            initPreTaxAlloc[inv.name] = 0;
        });
        setPreTaxAllocations(initPreTaxAlloc);
        
        const initAfterTaxAlloc = {};
        afterTaxInvestments.forEach(inv => {
            initAfterTaxAlloc[inv.name] = 0;
        });
        setAfterTaxAllocations(initAfterTaxAlloc);
        
        const initNonRetirementAlloc = {};
        nonRetirementInvestments.forEach(inv => {
            initNonRetirementAlloc[inv.name] = 0;
        });
        setNonRetirementAllocations(initNonRetirementAlloc);
        
        const initTaxExemptAlloc = {};
        taxExemptInvestments.forEach(inv => {
            initTaxExemptAlloc[inv.name] = 0;
        });
        setTaxExemptAllocations(initTaxExemptAlloc);
        
        // Initialize tax status allocations
        const initTaxStatusAlloc = {};
        taxStatuses.forEach(status => {
            initTaxStatusAlloc[status] = 0;
        });
        setTaxStatusAllocations(initTaxStatusAlloc);
    }, [investments]);

    // Update allocation for a specific investment type within a tax status
    const updateAllocation = (taxStatus, investmentType, value) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        
        switch (taxStatus) {
            case 'pre-tax':
                setPreTaxAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                break;
            case 'after-tax':
                setAfterTaxAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                break;
            case 'non-retirement':
                setNonRetirementAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                break;
            case 'tax-exempt':
                setTaxExemptAllocations(prev => ({
                    ...prev,
                    [investmentType]: numValue
                }));
                break;
            default:
                break;
        }
    };

    // Update allocation for a tax status
    const updateTaxStatusAllocation = (taxStatus, value) => {
        const numValue = value === '' ? 0 : parseInt(value, 10);
        setTaxStatusAllocations(prev => ({
            ...prev,
            [taxStatus]: numValue
        }));
    };

    // Check if all allocations sum to 100
    const validateAllocations = () => {
        // Check pre-tax allocations if they exist
        if (preTaxInvestments.length > 0) {
            const sum = Object.values(preTaxAllocations).reduce((a, b) => a + b, 0);
            if (sum !== 100) {
                alert("Pre-tax investment allocations must sum to 100%");
                return false;
            }
        }
        
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
            const newEvents = [...prev];

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
                        isSocialSecurity: false,  // default boolean value 
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
                        isDiscretionary: false,  // default boolean value 
                        inflationAdjustment: false,
                        marriedPercentage: '' 

                    },
                    invest: {
                        returnType: '',
                        executionType: '',
                        modifyMaximumCash: false,
                        newMaximumCash: '',
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
                    },
                    rebalance:{
                        returnType: '',
                        executionType: '',
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

            return newEvents.slice(0, count);
        });
    };

    const updateEvent = (index, fieldPath, newValue) => {
        setEvents((prev) =>
            prev.map((event, i) => {
                if (i !== index) return event; // Skip other events
    
                let updatedEvent = { ...event }; // Clone top-level event
    
                if (!Array.isArray(fieldPath)) {
                    // Direct top-level update
                    updatedEvent[fieldPath] = newValue;
                } else {
                    // Handle nested updates
                    let target = updatedEvent;
                    for (let j = 0; j < fieldPath.length - 1; j++) {
                        const key = fieldPath[j];
                        
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
    
                    // Apply the final update
                    target[fieldPath[fieldPath.length - 1]] = newValue;
                }
    
                console.log(`Updating event ${index}:`, updatedEvent);
                return updatedEvent;
            })
        );
    };
    
    // Save the validated allocation data
    const saveAllocationData = () => {
        // Create a strategy object based on the allocations
        const strategy = {
            taxStatusAllocation: { ...taxStatusAllocations },
            preTaxAllocation: { ...preTaxAllocations },
            afterTaxAllocation: { ...afterTaxAllocations },
            nonRetirementAllocation: { ...nonRetirementAllocations },
            taxExemptAllocation: { ...taxExemptAllocations }
        };
        
        // Save the strategy to the global state
        setInvestmentStrategy(strategy);
        
        // Add investment strategy to all invest events
        setEvents(prevEvents => 
            prevEvents.map(event => {
                if (event.eventType === 'invest') {
                    return {
                        ...event,
                        invest: {
                            ...event.invest,
                            investmentStrategy: strategy
                        }
                    };
                }
                return event;
            })
        );
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
                                        {status === 'pre-tax' ? 'Pre-Tax' : 
                                         status === 'after-tax' ? 'After-Tax' : 
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
                
                {/* Pre-Tax Investment Allocation */}
                {preTaxInvestments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Pre-Tax Investment Allocation</h3>
                        <p>Specify what percentage of pre-tax investments should be allocated to each investment:</p>
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
                                        value={preTaxAllocations[inv.name] || ''}
                                        onChange={(e) => updateAllocation('pre-tax', inv.name, e.target.value)}
                                        onFocus={(e) => {
                                            // Clear the value when focused
                                            updateAllocation('pre-tax', inv.name, '');
                                        }}
                                        style={{ width: '60px' }}
                                    />
                                    <span>%</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                            Total: {Object.values(preTaxAllocations).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
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
                value={events.length}
                onChange={handleEventCountChange}
            />

            {events.map((event, index) => (
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
                        <>
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
                        </>
                    )}

                    {/* Uniform distribution */}
                    {event.startYear.returnType === 'uniformValue' && (
                        <>
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
                        </>
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
                                        onChange={() => updateEvent(index, ['invest', 'executionType'], 'fixedAllocation')}
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
                                        onChange={() => updateEvent(index, ['invest', 'executionType'], 'glidePath')}
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
                                                                    {status === 'pre-tax' ? 'Pre-Tax' : 
                                                                     status === 'after-tax' ? 'After-Tax' : 
                                                                     status === 'non-retirement' ? 'Non-Retirement' : 'Tax-Exempt'}:
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={event.invest.taxStatusAllocation?.[status] || ''}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                        updateEvent(index, ['invest', 'taxStatusAllocation'], {
                                                                            ...event.invest.taxStatusAllocation || {},
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
                                                        Total: {Object.values(event.invest.taxStatusAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    <label>
                                        <input 
                                            type="checkbox" 
                                            checked={event.invest.modifyPreTaxAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['invest', 'modifyPreTaxAllocation'], e.target.checked)} 
                                        />
                                        Pre-Tax Allocation
                                    </label>
                                    
                                    {event.invest.modifyPreTaxAllocation && preTaxInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Pre-Tax Investment Allocation</h4>
                                            <p>Specify what percentage of pre-tax investments should be allocated to each investment:</p>
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
                                                            value={event.invest.preTaxAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['invest', 'preTaxAllocation'], {
                                                                    ...event.invest.preTaxAllocation || {},
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
                                                Total: {Object.values(event.invest.preTaxAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
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
                                                            value={event.invest.afterTaxAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['invest', 'afterTaxAllocation'], {
                                                                    ...event.invest.afterTaxAllocation || {},
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
                                                Total: {Object.values(event.invest.afterTaxAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
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
                                                            value={event.invest.nonRetirementAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['invest', 'nonRetirementAllocation'], {
                                                                    ...event.invest.nonRetirementAllocation || {},
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
                                                Total: {Object.values(event.invest.nonRetirementAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
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
                                                            value={event.invest.taxExemptAllocation?.[inv.name] || ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                                                updateEvent(index, ['invest', 'taxExemptAllocation'], {
                                                                    ...event.invest.taxExemptAllocation || {},
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
                                                Total: {Object.values(event.invest.taxExemptAllocation || {}).filter(val => !isNaN(val) && val !== '').reduce((a, b) => a + b, 0)}% (must equal 100%)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                                        onChange={() => updateEvent(index, ['rebalance', 'executionType'], 'fixedAllocation')}
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
                                        onChange={() => updateEvent(index, ['rebalance', 'executionType'], 'glidePath')}
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
                                                    <h4>Tax Status Revalance</h4>
                                                    <p>Specify what percentage of assets should be rebalanced to each tax status:</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {availableTaxStatuses.map(status => (
                                                            <div key={status} style={{ marginBottom: '10px', minWidth: '200px' }}>
                                                                <label style={{ display: 'block', marginBottom: '5px' }}>
                                                                    {status === 'pre-tax' ? 'Pre-Tax' : 
                                                                     status === 'after-tax' ? 'After-Tax' : 
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
                                            checked={event.rebalance.modifyPreTaxAllocation || false} 
                                            onChange={(e) => updateEvent(index, ['rebalance', 'modifyPreTaxAllocation'], e.target.checked)} 
                                        />
                                        Rebalance Pre-Tax Assets
                                    </label>
                                    
                                    {event.rebalance.modifyPreTaxAllocation && preTaxInvestments.length > 0 && (
                                        <div style={{ marginLeft: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                            <h4>Pre-Tax Investment Allocation</h4>
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
                                            <h4>After-Tax Investment Revalance</h4>
                                            <p>Specify how pre-tax investments should be rebalanced:</p>
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
                                            <p>Specify how tax exempt investments should be rebalanced:</p>
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
                    // First validate all investment allocations
                    if (!validateAllocations()) {
                        return;
                    }
                    
                    // Save allocation data if validation passes
                    saveAllocationData();
                    
                    if (events.length === 0) {
                        alert("At least one event is required.");
                        return;
                    }

                    for (const event of events) {
                        // Ensure the event has a name
                        if (!event.name.trim()) {
                            alert("Each event must have a Name.");
                            return;
                        }

                        // Validate startYear
                        if (!event.startYear.returnType) {
                            alert(`Event "${event.name}" must have a Start Year Return Type.`);
                            return;
                        }

                        switch (event.startYear.returnType) {
                            case 'fixedValue':
                                if (!event.startYear.fixedValue) {
                                    alert(`Event "${event.name}" requires a Fixed Value for Start Year.`);
                                    return;
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

                        // Validate duration
                        if (!event.duration.returnType) {
                            alert(`Event "${event.name}" must have a Duration Return Type.`);
                            return;
                        }

                        switch (event.duration.returnType) {
                            case 'fixedValue':
                                if (!event.duration.fixedValue) {
                                    alert(`Event "${event.name}" requires a Fixed Value for Duration.`);
                                    return;
                                }
                                break;

                            case 'normalValue':
                                if (!event.duration.normalValue.mean || !event.duration.normalValue.sd) {
                                    alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Duration.`);
                                    return;
                                }
                                break;

                            case 'uniformValue':
                                if (!event.duration.uniformValue.lowerBound || !event.duration.uniformValue.upperBound) {
                                    alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Duration.`);
                                    return;
                                }
                                break;

                            default:
                                // No action needed for unknown return type
                                break;
                        }

                        // Ensure the event has an event type
                        if (!event.eventType) {
                            alert(`Event "${event.name}" must have an Event Type.`);
                            return;
                        }

                        switch (event.eventType) {
                            case 'income':
                            case 'expense':
                                const isIncome = event.eventType === 'income';
                                const eventData = isIncome ? event.income : event.expense;
                        
                                if (!eventData.initialAmount) {
                                    alert(`Event "${event.name}" requires an Initial Amount.`);
                                    return;
                                }
                        
                                if (!eventData.expectedAnnualChange.returnType) {
                                    alert(`Event "${event.name}" must have a Return Type for Expected Annual Change.`);
                                    return;
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
                        
                                if (isInvest) {
                                    if (!investData.executionType) {
                                        alert(`Event "${event.name}" must have an Execution Type.`);
                                        return false;
                                    }
                                    
                                    // Validate allocation modifications for invest events
                                    // Check tax status allocation if modified
                                    if (investData.modifyTaxStatusAllocation) {
                                        const sum = Object.values(investData.taxStatusAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" tax status allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check pre-tax allocation if modified
                                    if (investData.modifyPreTaxAllocation && preTaxInvestments.length > 0) {
                                        const sum = Object.values(investData.preTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" pre-tax investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check after-tax allocation if modified
                                    if (investData.modifyAfterTaxAllocation && afterTaxInvestments.length > 0) {
                                        const sum = Object.values(investData.afterTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" after-tax investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check non-retirement allocation if modified
                                    if (investData.modifyNonRetirementAllocation && nonRetirementInvestments.length > 0) {
                                        const sum = Object.values(investData.nonRetirementAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" non-retirement investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check tax-exempt allocation if modified
                                    if (investData.modifyTaxExemptAllocation && taxExemptInvestments.length > 0) {
                                        const sum = Object.values(investData.taxExemptAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" tax-exempt investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                } else {
                                    // For rebalance events
                                    if (!investData.executionType) {
                                        alert(`Event "${event.name}" must have an Execution Type.`);
                                        return false;
                                    }
                                    
                                    // Validate allocation modifications for rebalance events
                                    // Check tax status allocation if modified
                                    if (investData.modifyTaxStatusAllocation) {
                                        const sum = Object.values(investData.taxStatusAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" tax status allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check pre-tax allocation if modified
                                    if (investData.modifyPreTaxAllocation && preTaxInvestments.length > 0) {
                                        const sum = Object.values(investData.preTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" pre-tax investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check after-tax allocation if modified
                                    if (investData.modifyAfterTaxAllocation && afterTaxInvestments.length > 0) {
                                        const sum = Object.values(investData.afterTaxAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" after-tax investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check non-retirement allocation if modified
                                    if (investData.modifyNonRetirementAllocation && nonRetirementInvestments.length > 0) {
                                        const sum = Object.values(investData.nonRetirementAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" non-retirement investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                    
                                    // Check tax-exempt allocation if modified
                                    if (investData.modifyTaxExemptAllocation && taxExemptInvestments.length > 0) {
                                        const sum = Object.values(investData.taxExemptAllocation || {}).reduce((a, b) => a + b, 0);
                                        if (sum !== 100) {
                                            alert(`Event "${event.name}" tax-exempt investment allocations must sum to 100%.`);
                                            return false;
                                        }
                                    }
                                }
                                
                                break;

                            default:
                                // No action needed for unknown event type
                                break;
                        }
                    }

                    // If all events are valid, proceed to the next page
                    setPage(5);
                }}>
                    Next
                </button>
            </div>
        </div>
    );
};

export default EventForm;