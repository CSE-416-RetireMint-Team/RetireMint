function EventForm({events, setEvents,scenarioType,setPage}) {

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
                        fixedAllocation: '',
                        glidePath: ''
                    },
                    rebalance:{
                        returnType: '',
                        fixedAllocation: '',
                        glidePath: '',

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
    
   
    

    return (
        <div>

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
                            <h3>Return Type: *</h3>
                            <button 
                                onClick={() => updateEvent(index, ['invest', 'returnType'], 'fixedAllocation')}
                            >
                                Fixed Allocation
                            </button>

                            <button 
                                onClick={() => updateEvent(index, ['invest', 'returnType'], 'glidePath')}
                            >
                                Glide Path
                            </button>

                            {/* Fixed Allocation Input */}
                            {event.invest.returnType === 'fixedAllocation' && (
                                <>
                                    <h3>Enter Name:Percentage pairs (e.g., name1:10;name2:20):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name:percentage pairs"
                                        value={event.invest.fixedAllocation || ""}
                                        onChange={(e) => updateEvent(index, ['invest', 'fixedAllocation'], e.target.value)}
                                    />
                                </>
                            )}

                            {/* Glide Path Input */}
                            {event.invest.returnType === 'glidePath' && (
                                <>
                                    <h3>Enter Name num1-num2 pairs (e.g., name1 10-20;name2 15-25):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name num1-num2 pairs"
                                        value={event.invest.glidePath || ""}
                                        onChange={(e) => updateEvent(index, ['invest', 'glidePath'], e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {event.eventType === 'rebalance' && (
                        <div>

                            {/* Return Type Selection Buttons */}
                            <h3>Return Type: *</h3>
                            <button 
                                onClick={() => updateEvent(index, ['rebalance', 'returnType'], 'fixedAllocation')}
                            >
                                Fixed Allocation
                            </button>

                            <button 
                                onClick={() => updateEvent(index, ['rebalance', 'returnType'], 'glidePath')}
                            >
                                Glide Path
                            </button>

                            {/* Fixed Allocation Input */}
                            {event.rebalance.returnType === 'fixedAllocation' && (
                                <>
                                    <h3>Enter Name:Percentage pairs (e.g., name1:10;name2:20):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name:percentage pairs"
                                        value={event.rebalance.fixedAllocation || ""}
                                        onChange={(e) => updateEvent(index, ['rebalance', 'fixedAllocation'], e.target.value)}
                                    />
                                </>
                            )}

                            {/* Glide Path Input */}
                            {event.rebalance.returnType === 'glidePath' && (
                                <>
                                    <h3>Enter Name num1-num2 pairs (e.g., name1 10-20;name2 15-25):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name num1-num2 pairs"
                                        value={event.rebalance.glidePath || ""}
                                        onChange={(e) => updateEvent(index, ['rebalance', 'glidePath'], e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    )}






                </div>
            ))}


           {/* Navigation Buttons */}
            <div>
                <button onClick={() => setPage(3)}>Previous</button>
                
                <button onClick={() => {
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
                        
                                if (!investData.returnType) {
                                    alert(`Event "${event.name}" must have a Return Type.`);
                                    return;
                                }
                        
                                switch (investData.returnType) {
                                    case 'fixedAllocation':
                                        if (!investData.fixedAllocation) {
                                            alert(`Event "${event.name}" requires Fixed Allocation details.`);
                                            return;
                                        }
                                        break;
                                    case 'glidePath':
                                        if (!investData.glidePath) {
                                            alert(`Event "${event.name}" requires Glide Path details.`);
                                            return;
                                        }
                                        break;
                                    default:
                                        // No action needed for unknown return type
                                        break;
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
}


export default EventForm;