


function EventForm({events, set_events,scenario_type,set_page}) {

    const handle_event_count_change = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        set_events((prev) => {
            const new_events = [...prev];

            while (new_events.length < count) {
                new_events.push({
                    name: '',
                    description: '',
                    start_year: { 
                        return_type: 'fixed_value', 
                        fixed_value: '', 
                        normal_value: { mean: '', sd: '' }, 
                        uniform_value: {lower_bound: '', upper_bound: ''},
                        same_year_as_another_event: '',
                        year_after_another_event_end:''
                    },
                    duration: {
                        return_type: '', 
                        fixed_value: '', 
                        normal_value: { mean: '', sd: '' }, 
                        uniform_value: {lower_bound: '', upper_bound: ''},
                    },
                    event_type: '',
                    income: {
                        initial_amount: '', 
                        expected_annual_change: {
                            return_type: 'fixed_value',
                            fixed_value: '', 
                            normal_value: { mean: '', sd: '' }, 
                            uniform_value: {lower_bound: '', upper_bound: ''},
                            fixed_percentage: '', 
                            normal_percentage: { mean: '', sd: '' }, 
                            uniform_percentage: {lower_bound: '', upper_bound: ''},
                            
                        },
                        is_social_security: false,  // default boolean value 
                        inflation_adjustment: false,
                        married_percentage: '' 

                    },
                    expense: {
                        initial_amount: '',
                        expected_annual_change: {
                            return_type: 'fixed_value',
                            fixed_value: '', 
                            normal_value: { mean: '', sd: '' }, 
                            uniform_value: {lower_bound: '', upper_bound: ''},
                            fixed_percentage: '', 
                            normal_percentage: { mean: '', sd: '' }, 
                            uniform_percentage: {lower_bound: '', upper_bound: ''},
                            
                        },
                        is_discretionary: false,  // default boolean value 
                        inflation_adjustment: false,
                        married_percentage: '' 

                    },
                    invest: {
                        return_type: '',
                        fixed_allocation: '',
                        glide_path: '',
                        maximum_cash: ''


                    },
                    rebalance:{
                        return_type: '',
                        fixed_allocation: '',
                        glide_path: '',

                    }

                    
                });
            }

            return new_events.slice(0, count);
        });
    };

    const update_event = (index, field_path, new_value) => {
        set_events((prev) =>
            prev.map((event, i) => {
                if (i !== index) return event; // Skip other events
    
                let updated_event = { ...event }; // Clone top-level event
    
                if (!Array.isArray(field_path)) {
                    // Direct top-level update
                    updated_event[field_path] = new_value;
                } else {
                    // Handle nested updates
                    let target = updated_event;
                    for (let j = 0; j < field_path.length - 1; j++) {
                        const key = field_path[j];
                        
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
    
                    // Apply the final update
                    target[field_path[field_path.length - 1]] = new_value;
                }
    
                console.log(`Updating event ${index}:`, updated_event);
                return updated_event;
            })
        );
    };
    
   
    

    return (
        <div>

            <h2>Number of Events:</h2>

            <input
                type="number"
                value={events.length}
                onChange={handle_event_count_change}
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
                        onChange={(e) => update_event(index, ['name'], e.target.value)} 
                    />

                    {/* Description Input */}
                    <h2>Description:</h2>
                    <input 
                        type="text" 
                        placeholder="Event Description" 
                        value={event.description} 
                        onChange={(e) => update_event(index, ['description'], e.target.value)} 
                    />


                    {/* Start Year */}
                    <h2>Start Year: *</h2>
                    <select
                        value={event.start_year.return_type}
                        onChange={(e) => update_event(index, ['start_year', 'return_type'], e.target.value)}
                    >
                        <option value="fixed_value">Fixed Value</option>
                        <option value="normal_value">Normal Distribution</option>
                        <option value="uniform_value">Uniform Distribution</option>
                        <option value="same_year_as_another_event">Same Year as Another Event</option>
                        <option value="year_after_another_event_end">Year After Another Event Ends</option>
                    </select>

                    {/* Fixed value */}
                    {event.start_year.return_type === 'fixed_value' && (
                        <input
                            type="number"
                            placeholder="Fixed Start Year"
                            value={event.start_year.fixed_value}
                            onChange={(e) => update_event(index, ['start_year', 'fixed_value'], e.target.value)}
                        />
                    )}

                    {/* Normal distribution */}
                    {event.start_year.return_type === 'normal_value' && (
                        <>
                            <input
                                type="number"
                                placeholder="Mean"
                                value={event.start_year.normal_value.mean}
                                onChange={(e) => update_event(index, ['start_year', 'normal_value', 'mean'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Standard Deviation"
                                value={event.start_year.normal_value.sd}
                                onChange={(e) => update_event(index, ['start_year', 'normal_value', 'sd'], e.target.value)}
                            />
                        </>
                    )}

                    {/* Uniform distribution */}
                    {event.start_year.return_type === 'uniform_value' && (
                        <>
                            <input
                                type="number"
                                placeholder="Lower Bound"
                                value={event.start_year.uniform_value.lower_bound}
                                onChange={(e) => update_event(index, ['start_year', 'uniform_value', 'lower_bound'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Upper Bound"
                                value={event.start_year.uniform_value.upper_bound}
                                onChange={(e) => update_event(index, ['start_year', 'uniform_value', 'upper_bound'], e.target.value)}
                            />
                        </>
                    )}

                    {/* Same year as another event */}
                    {event.start_year.return_type === 'same_year_as_another_event' && (
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={event.start_year.same_year_as_another_event}
                            onChange={(e) => update_event(index, ['start_year', 'same_year_as_another_event'], e.target.value)}
                        />
                    )}

                    {/* Year after another event ends */}
                    {event.start_year.return_type === 'year_after_another_event_end' && (
                        <input
                            type="text"
                            placeholder="Event Name"
                            value={event.start_year.year_after_another_event_end}
                            onChange={(e) => update_event(index, ['start_year', 'year_after_another_event_end'], e.target.value)}
                        />
                    )}


                    {/* Duration */}
                    <h2>Duration: *</h2>

                    {/* Buttons to select return type */}
                    <button onClick={() => update_event(index, ['duration', 'return_type'], 'fixed_value')}>
                        Fixed Value
                    </button>

                    <button onClick={() => update_event(index, ['duration', 'return_type'], 'normal_value')}>
                        Fixed Value (Normal Distribution)
                    </button>

                    <button onClick={() => update_event(index, ['duration', 'return_type'], 'uniform_value')}>
                        Fixed Value (Uniform Distribution)
                    </button>

                    {/* Fixed value */}
                    {event.duration.return_type === 'fixed_value' && (
                        <input
                            type="number"
                            placeholder="Fixed Duration"
                            value={event.duration.fixed_value}
                            onChange={(e) => update_event(index, ['duration', 'fixed_value'], e.target.value)}
                        />
                    )}

                    {/* Normal distribution */}
                    {event.duration.return_type === 'normal_value' && (
                        <>
                            <input
                                type="number"
                                placeholder="Mean"
                                value={event.duration.normal_value.mean}
                                onChange={(e) => update_event(index, ['duration', 'normal_value', 'mean'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Standard Deviation"
                                value={event.duration.normal_value.sd}
                                onChange={(e) => update_event(index, ['duration', 'normal_value', 'sd'], e.target.value)}
                            />
                        </>
                    )}

                    {/* Uniform distribution */}
                    {event.duration.return_type === 'uniform_value' && (
                        <>
                            <input
                                type="number"
                                placeholder="Lower Bound"
                                value={event.duration.uniform_value.lower_bound}
                                onChange={(e) => update_event(index, ['duration', 'uniform_value', 'lower_bound'], e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Upper Bound"
                                value={event.duration.uniform_value.upper_bound}
                                onChange={(e) => update_event(index, ['duration', 'uniform_value', 'upper_bound'], e.target.value)}
                            />
                        </>
                    )}


                    {/* Event Type */}
                    <div>
                        <h2>Event Type: *</h2>
                        <select 
                            value={event.event_type} 
                            onChange={(e) => update_event(index, ['event_type'], e.target.value)}
                        >
                            <option value="">Select Event Type</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                            <option value="invest">Invest</option>
                            <option value="rebalance">Rebalance</option>
                        </select>
                    </div>
                    
                    {event.event_type === 'income' && (
                        <div>
    

                            {/* Initial Amount */}
                            <h3>Initial Amount: *</h3>
                            <input 
                                type="number" 
                                placeholder="Initial Amount" 
                                value={event.income.initial_amount} 
                                onChange={(e) => update_event(index, ['income', 'initial_amount'], e.target.value)} 
                            />

                            {/* Expected Annual Change Type - Select Dropdown */}
                            <h3>Expected Annual Change Type: *</h3>
                            <select
                                value={event.income.expected_annual_change.return_type}
                                onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'return_type'], e.target.value)}
                            >
                                <option value="fixed_value">Fixed Value</option>
                                <option value="fixed_percentage">Fixed Percentage</option>
                                <option value="normal_value">Normal Distribution (Fixed Value)</option>
                                <option value="normal_percentage">Normal Distribution (Percentage)</option>
                                <option value="uniform_value">Uniform Distribution (Fixed)</option>
                                <option value="uniform_percentage">Uniform Distribution (Percentage)</option>
                            </select>

                            {/* Fixed Value */}
                            {event.income.expected_annual_change.return_type === 'fixed_value' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Annual Change" 
                                    value={event.income.expected_annual_change.fixed_value} 
                                    onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'fixed_value'], e.target.value)} 
                                />
                            )}

                            {/* Fixed Percentage */}
                            {event.income.expected_annual_change.return_type === 'fixed_percentage' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Percentage (%)" 
                                    value={event.income.expected_annual_change.fixed_percentage} 
                                    onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'fixed_percentage'], e.target.value)} 
                                />
                            )}

                            {/* Normal Distribution (Fixed Value) */}
                            {event.income.expected_annual_change.return_type === 'normal_value' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean" 
                                        value={event.income.expected_annual_change.normal_value.mean} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'normal_value', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation" 
                                        value={event.income.expected_annual_change.normal_value.sd} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'normal_value', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {event.income.expected_annual_change.return_type === 'normal_percentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean (%)" 
                                        value={event.income.expected_annual_change.normal_percentage.mean} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'normal_percentage', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation (%)" 
                                        value={event.income.expected_annual_change.normal_percentage.sd} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'normal_percentage', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Fixed) */}
                            {event.income.expected_annual_change.return_type === 'uniform_value' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound" 
                                        value={event.income.expected_annual_change.uniform_value.lower_bound} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'uniform_value', 'lower_bound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound" 
                                        value={event.income.expected_annual_change.uniform_value.upper_bound} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'uniform_value', 'upper_bound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Percentage) */}
                            {event.income.expected_annual_change.return_type === 'uniform_percentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound (%)" 
                                        value={event.income.expected_annual_change.uniform_percentage.lower_bound} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'uniform_percentage', 'lower_bound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound (%)" 
                                        value={event.income.expected_annual_change.uniform_percentage.upper_bound} 
                                        onChange={(e) => update_event(index, ['income', 'expected_annual_change', 'uniform_percentage', 'upper_bound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Social Security */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.income.is_social_security} 
                                    onChange={(e) => update_event(index, ['income', 'is_social_security'], e.target.checked)} 
                                />
                                Is Social Security?
                            </label>

                            {/* Inflation Adjustment */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.income.inflation_adjustment} 
                                    onChange={(e) => update_event(index, ['income', 'inflation_adjustment'], e.target.checked)} 
                                />
                                Inflation Adjustment?
                            </label>

                            {/* Married Percentage (only if scenario_type is married) */}
                            {scenario_type === 'married' && (
                                <>
                                    <h3>Married Percentage</h3>
                                    <input 
                                        type="number" 
                                        placeholder="Married Percentage" 
                                        value={event.income.married_percentage} 
                                        onChange={(e) => update_event(index, ['income', 'married_percentage'], e.target.value)} 
                                    />
                                </>
                            )}
                        </div>
                    )}


                    {event.event_type === 'expense' && (
                        <div>
                    

                            {/* Initial Amount */}
                            <h3>Initial Amount: *</h3>
                            <input 
                                type="number" 
                                placeholder="Initial Amount" 
                                value={event.expense.initial_amount} 
                                onChange={(e) => update_event(index, ['expense', 'initial_amount'], e.target.value)} 
                            />

                            {/* Expected Annual Change Type - Select Dropdown */}
                            <h3>Expected Annual Change Type:</h3>
                            <select
                                value={event.expense.expected_annual_change.return_type}
                                onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'return_type'], e.target.value)}
                            >
                                <option value="fixed_value">Fixed Value</option>
                                <option value="fixed_percentage">Fixed Percentage</option>
                                <option value="normal_value">Normal Distribution (Fixed Value)</option>
                                <option value="normal_percentage">Normal Distribution (Percentage)</option>
                                <option value="uniform_value">Uniform Distribution (Fixed)</option>
                                <option value="uniform_percentage">Uniform Distribution (Percentage)</option>
                            </select>

                            {/* Fixed Value */}
                            {event.expense.expected_annual_change.return_type === 'fixed_value' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Annual Change" 
                                    value={event.expense.expected_annual_change.fixed_value} 
                                    onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'fixed_value'], e.target.value)} 
                                />
                            )}

                            {/* Fixed Percentage */}
                            {event.expense.expected_annual_change.return_type === 'fixed_percentage' && (
                                <input 
                                    type="number" 
                                    placeholder="Fixed Percentage (%)" 
                                    value={event.expense.expected_annual_change.fixed_percentage} 
                                    onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'fixed_percentage'], e.target.value)} 
                                />
                            )}

                            {/* Normal Distribution (Fixed Value) */}
                            {event.expense.expected_annual_change.return_type === 'normal_value' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean" 
                                        value={event.expense.expected_annual_change.normal_value.mean} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'normal_value', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation" 
                                        value={event.expense.expected_annual_change.normal_value.sd} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'normal_value', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {event.expense.expected_annual_change.return_type === 'normal_percentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Mean (%)" 
                                        value={event.expense.expected_annual_change.normal_percentage.mean} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'normal_percentage', 'mean'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Standard Deviation (%)" 
                                        value={event.expense.expected_annual_change.normal_percentage.sd} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'normal_percentage', 'sd'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Fixed) */}
                            {event.expense.expected_annual_change.return_type === 'uniform_value' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound" 
                                        value={event.expense.expected_annual_change.uniform_value.lower_bound} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'uniform_value', 'lower_bound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound" 
                                        value={event.expense.expected_annual_change.uniform_value.upper_bound} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'uniform_value', 'upper_bound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Uniform Distribution (Percentage) */}
                            {event.expense.expected_annual_change.return_type === 'uniform_percentage' && (
                                <>
                                    <input 
                                        type="number" 
                                        placeholder="Lower Bound (%)" 
                                        value={event.expense.expected_annual_change.uniform_percentage.lower_bound} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'uniform_percentage', 'lower_bound'], e.target.value)} 
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Upper Bound (%)" 
                                        value={event.expense.expected_annual_change.uniform_percentage.upper_bound} 
                                        onChange={(e) => update_event(index, ['expense', 'expected_annual_change', 'uniform_percentage', 'upper_bound'], e.target.value)} 
                                    />
                                </>
                            )}

                            {/* Discretionary Checkbox */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.expense.is_discretionary} 
                                    onChange={(e) => update_event(index, ['expense', 'is_discretionary'], e.target.checked)} 
                                />
                                Is Discretionary?
                            </label>

                            {/* Inflation Adjustment */}
                            <label>
                                <input 
                                    type="checkbox" 
                                    checked={event.expense.inflation_adjustment} 
                                    onChange={(e) => update_event(index, ['expense', 'inflation_adjustment'], e.target.checked)} 
                                />
                                Inflation Adjustment?
                            </label>

                            {/* Married Percentage (only if scenario_type is married) */}
                            {scenario_type === 'married' && (
                                <>
                                    <h3>Married Percentage</h3>
                                    <input 
                                        type="number" 
                                        placeholder="Married Percentage" 
                                        value={event.expense.married_percentage} 
                                        onChange={(e) => update_event(index, ['expense', 'married_percentage'], e.target.value)} 
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {event.event_type === 'invest' && (
                        <div>
                    

                            {/* Return Type Selection Buttons */}
                            <h3>Return Type: *</h3>
                            <button 
                                onClick={() => update_event(index, ['invest', 'return_type'], 'fixed_allocation')}
                            >
                                Fixed Allocation
                            </button>

                            <button 
                                onClick={() => update_event(index, ['invest', 'return_type'], 'glide_path')}
                            >
                                Glide Path
                            </button>

                            {/* Fixed Allocation Input */}
                            {event.invest.return_type === 'fixed_allocation' && (
                                <>
                                    <h3>Enter Name:Percentage pairs (e.g., name1:10;name2:20):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name:percentage pairs"
                                        value={event.invest.fixed_allocation || ""}
                                        onChange={(e) => update_event(index, ['invest', 'fixed_allocation'], e.target.value)}
                                    />
                                </>
                            )}

                            {/* Glide Path Input */}
                            {event.invest.return_type === 'glide_path' && (
                                <>
                                    <h3>Enter Name num1-num2 pairs (e.g., name1 10-20;name2 15-25):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name num1-num2 pairs"
                                        value={event.invest.glide_path || ""}
                                        onChange={(e) => update_event(index, ['invest', 'glide_path'], e.target.value)}
                                    />
                                </>
                            )}

                            {/* Maximum Cash Input */}
                            <h3>Maximum Cash:</h3>
                            <input
                                type="number"
                                placeholder="Enter Maximum Cash"
                                value={event.invest.maximum_cash || ""}
                                onChange={(e) => update_event(index, ['invest', 'maximum_cash'], e.target.value)}
                            />
                        </div>
                    )}

                    {event.event_type === 'rebalance' && (
                        <div>

                            {/* Return Type Selection Buttons */}
                            <h3>Return Type: *</h3>
                            <button 
                                onClick={() => update_event(index, ['rebalance', 'return_type'], 'fixed_allocation')}
                            >
                                Fixed Allocation
                            </button>

                            <button 
                                onClick={() => update_event(index, ['rebalance', 'return_type'], 'glide_path')}
                            >
                                Glide Path
                            </button>

                            {/* Fixed Allocation Input */}
                            {event.rebalance.return_type === 'fixed_allocation' && (
                                <>
                                    <h3>Enter Name:Percentage pairs (e.g., name1:10;name2:20):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name:percentage pairs"
                                        value={event.rebalance.fixed_allocation || ""}
                                        onChange={(e) => update_event(index, ['rebalance', 'fixed_allocation'], e.target.value)}
                                    />
                                </>
                            )}

                            {/* Glide Path Input */}
                            {event.rebalance.return_type === 'glide_path' && (
                                <>
                                    <h3>Enter Name num1-num2 pairs (e.g., name1 10-20;name2 15-25):</h3>
                                    <input
                                        type="text"
                                        placeholder="Enter name num1-num2 pairs"
                                        value={event.rebalance.glide_path || ""}
                                        onChange={(e) => update_event(index, ['rebalance', 'glide_path'], e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    )}






                </div>
            ))}


           {/* Navigation Buttons */}
            <div>
                <button onClick={() => set_page(2)}>Previous</button>
                
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

                        // Validate start_year
                        if (!event.start_year.return_type) {
                            alert(`Event "${event.name}" must have a Start Year Return Type.`);
                            return;
                        }

                        switch (event.start_year.return_type) {
                            case 'fixed_value':
                                if (!event.start_year.fixed_value) {
                                    alert(`Event "${event.name}" requires a Fixed Value for Start Year.`);
                                    return;
                                }
                                break;

                            case 'normal_value':
                                if (!event.start_year.normal_value.mean || !event.start_year.normal_value.sd) {
                                    alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Start Year.`);
                                    return;
                                }
                                break;

                            case 'uniform_value':
                                if (!event.start_year.uniform_value.lower_bound || !event.start_year.uniform_value.upper_bound) {
                                    alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Start Year.`);
                                    return;
                                }
                                break;

                            case 'same_year_as_another_event':
                                if (!event.start_year.same_year_as_another_event) {
                                    alert(`Event "${event.name}" must specify another event for Same Year Start.`);
                                    return;
                                }
                                break;

                            case 'year_after_another_event_end':
                                if (!event.start_year.year_after_another_event_end) {
                                    alert(`Event "${event.name}" must specify another event for Year After Another Event Ends.`);
                                    return;
                                }
                                break;
                        }

                        // Validate duration
                        if (!event.duration.return_type) {
                            alert(`Event "${event.name}" must have a Duration Return Type.`);
                            return;
                        }

                        switch (event.duration.return_type) {
                            case 'fixed_value':
                                if (!event.duration.fixed_value) {
                                    alert(`Event "${event.name}" requires a Fixed Value for Duration.`);
                                    return;
                                }
                                break;

                            case 'normal_value':
                                if (!event.duration.normal_value.mean || !event.duration.normal_value.sd) {
                                    alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Duration.`);
                                    return;
                                }
                                break;

                            case 'uniform_value':
                                if (!event.duration.uniform_value.lower_bound || !event.duration.uniform_value.upper_bound) {
                                    alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Duration.`);
                                    return;
                                }
                                break;
                        }

                        // Ensure the event has an event type
                        if (!event.event_type) {
                            alert(`Event "${event.name}" must have an Event Type.`);
                            return;
                        }

                        switch (event.event_type) {
                            case 'income':
                            case 'expense':
                                const is_income = event.event_type === 'income';
                                const event_data = is_income ? event.income : event.expense;
                        
                                if (!event_data.initial_amount) {
                                    alert(`Event "${event.name}" requires an Initial Amount.`);
                                    return;
                                }
                        
                                if (!event_data.expected_annual_change.return_type) {
                                    alert(`Event "${event.name}" must have a Return Type for Expected Annual Change.`);
                                    return;
                                }
                        
                                switch (event_data.expected_annual_change.return_type) {
                                    case 'fixed_value':
                                        if (!event_data.expected_annual_change.fixed_value) {
                                            alert(`Event "${event.name}" requires a Fixed Value for Expected Annual Change.`);
                                            return;
                                        }
                                        break;
                                    case 'normal_value':
                                        if (!event_data.expected_annual_change.normal_value.mean || !event_data.expected_annual_change.normal_value.sd) {
                                            alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Value.`);
                                            return;
                                        }
                                        break;
                                    case 'uniform_value':
                                        if (!event_data.expected_annual_change.uniform_value.lower_bound || !event_data.expected_annual_change.uniform_value.upper_bound) {
                                            alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Value.`);
                                            return;
                                        }
                                        break;
                                    case 'fixed_percentage':
                                        if (!event_data.expected_annual_change.fixed_percentage) {
                                            alert(`Event "${event.name}" requires a Fixed Percentage for Expected Annual Change.`);
                                            return;
                                        }
                                        break;
                                    case 'normal_percentage':
                                        if (!event_data.expected_annual_change.normal_percentage.mean || !event_data.expected_annual_change.normal_percentage.sd) {
                                            alert(`Event "${event.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                            return;
                                        }
                                        break;
                                    case 'uniform_percentage':
                                        if (!event_data.expected_annual_change.uniform_percentage.lower_bound || !event_data.expected_annual_change.uniform_percentage.upper_bound) {
                                            alert(`Event "${event.name}" requires Lower and Upper Bound for Uniform Percentage.`);
                                            return;
                                        }
                                        break;
                                }
                        
                                if (scenario_type === 'married' && !event_data.married_percentage) {
                                    alert(`Event "${event.name}" requires a Married Percentage because the scenario is Married.`);
                                    return;
                                }
                                break;
                        
                            case 'invest':
                            case 'rebalance':
                                const is_invest = event.event_type === 'invest';
                                const invest_data = is_invest ? event.invest : event.rebalance;
                        
                                if (!invest_data.return_type) {
                                    alert(`Event "${event.name}" must have a Return Type.`);
                                    return;
                                }
                        
                                switch (invest_data.return_type) {
                                    case 'fixed_allocation':
                                        if (!invest_data.fixed_allocation) {
                                            alert(`Event "${event.name}" requires Fixed Allocation details.`);
                                            return;
                                        }
                                        break;
                                    case 'glide_path':
                                        if (!invest_data.glide_path) {
                                            alert(`Event "${event.name}" requires Glide Path details.`);
                                            return;
                                        }
                                        break;
                                }
                        
                                if (is_invest && !invest_data.maximum_cash) {
                                    alert(`Event "${event.name}" requires Maximum Cash.`);
                                    return;
                                }
                                break;
                        }
                        

                        


                    }

                    // If all events are valid, proceed to the next page
                    set_page(4);
                }}>
                    Next
                </button>
            </div>



        </div>
    );
}


export default EventForm;