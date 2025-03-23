

function EventForm({events, set_events,scenario_type}) {

    const handle_event_count_change = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        set_events((prev) => {
            const new_events = [...prev];

            while (new_events.length < count) {
                new_events.push({
                    name: '',
                    description: '',
                    start_year: { 
                        return_type: 'fixed_value', // set default return type
                        fixed_value: '', 
                        normal_value: { mean: '', sd: '' }, 
                        uniform_value: {lower_bound: '', upper_bound: ''},
                        same_year_as_another_event: '',
                        year_after_another_event_end:''
                    },
                    duration: {
                        return_type: 'fixed_value', // set default return type
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
                        return_type: 'fixed_allocation', //default
                        fixed_allocation: '',
                        glide_path: '',
                        maximum_cash: ''


                    },
                    rebalance:{
                        return_type: 'fixed_allocation', //default
                        fixed_allocation: '',
                        glide_path: '',

                    }

                    
                });
            }

            return new_events.slice(0, count);
        });
    };

    const handle_single_nested_update = (index, field, value, type) => {
       
        
        set_events((prev) => {
            const updated_events = [...prev];
            
            // reset structure for start_year
            if (field === "start_year") {
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: { 
                        return_type: value.return_type, // update return type
                        fixed_value: '', 
                        normal_value: { mean: '', sd: '' }, 
                        uniform_value: { lower_bound: '', upper_bound: '' },
                        same_year_as_another_event: '',
                        year_after_another_event_end: ''
                    }
                };
            }
            // reset structure for duration
            else if (field === "duration") {
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        return_type: value.return_type, // update return type
                        fixed_value: '', 
                        normal_value: { mean: '', sd: '' }, 
                        uniform_value: { lower_bound: '', upper_bound: '' }
                    }
                };
            }
            //  handle expected_annual_change subfields correctly
            if (field.startsWith("expected_annual_change.")) {
                const sub_field = field.split(".")[1]; // extract "fixed_value", "normal_value", etc.

                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        ...updated_events[index][type], 
                        expected_annual_change: {
                            ...updated_events[index][type].expected_annual_change, // keep other properties
                            [sub_field]: value, // update only this field
                        },
                    },
                };
            } 
            // handle full reset for expected_annual_change
            else if (field === "expected_annual_change") {
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        ...updated_events[index][type], 
                        expected_annual_change: {
                            return_type: value.return_type, // update return type
                            fixed_value: '', 
                            normal_value: { mean: '', sd: '' }, 
                            uniform_value: { lower_bound: '', upper_bound: '' },
                            fixed_percentage: '', 
                            normal_percentage: { mean: '', sd: '' }, 
                            uniform_percentage: { lower_bound: '', upper_bound: '' },
                        },
                    },
                };
            }
            // separate handling for asset_allocation for "invest" and "rebalance"
            else if (field === "asset_allocation") {
                if (type === "invest") {
                    updated_events[index] = {
                        ...updated_events[index],
                        [type]: {
                            return_type: value.return_type, 
                            fixed_allocation: '', 
                            glide_path: '', 
                            maximum_cash: '', 
                        },
                    };
                } else if (type === "rebalance") {
                    updated_events[index] = {
                        ...updated_events[index],
                        [type]: {
                            return_type: value.return_type, 
                            fixed_allocation: '',
                            glide_path: '', 
                        },
                    };
                }
            }

            else {
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        ...updated_events[index][type], 
                        [field]: value,
                    },
                };
            }
            
            
    
            console.log('Updated investments:', updated_events);
            return updated_events;
        });
    };
    
    const handle_double_nested_update = (index, category, field, value, type) => {
        console.log('Updating double nested field:', { index, category, field, value, type });
    
        set_events((prev) => {
            const updated_events = [...prev];
    
    
            if (type === "income" || type === "expense") {
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        ...updated_events[index][type], 
                        expected_annual_change: {
                            ...updated_events[index][type].expected_annual_change, 
                            [category]: {
                                ...updated_events[index][type].expected_annual_change[category], 
                                [field]: value, 
                            },
                        },
                    },
                };
            } else {
        
                updated_events[index] = {
                    ...updated_events[index],
                    [type]: {
                        ...updated_events[index][type],
                        [category]: {
                            ...updated_events[index][type][category],
                            [field]: value, 
                        },
                    },
                };
            }
    
            console.log('Updated events after double nested update:', updated_events);
            return updated_events;
        });
    };
    

    const handle_event_update = (index, field, value) => {
        set_events((prev) => {
            const updated_events = [...prev];
    
            if (field === "event_type") {
                updated_events[index] = {
                    ...updated_events[index],
                    event_type: value, // set event type
                    
                    // reset all event types to their default structures
                    income: {
                        initial_amount: '',
                        expected_annual_change: {
                            return_type: 'fixed_value',
                            fixed_value: '', 
                            normal_value: { mean: '', sd: '' }, 
                            uniform_value: { lower_bound: '', upper_bound: '' },
                            fixed_percentage: '', 
                            normal_percentage: { mean: '', sd: '' }, 
                            uniform_percentage: { lower_bound: '', upper_bound: '' },
                        },
                        is_social_security: false,
                        inflation_adjustment: false,
                        married_percentage: '' 
                    },
                    expense: {
                        initial_amount: '',
                        expected_annual_change: {
                            return_type: 'fixed_value',
                            fixed_value: '', 
                            normal_value: { mean: '', sd: '' }, 
                            uniform_value: { lower_bound: '', upper_bound: '' },
                            fixed_percentage: '', 
                            normal_percentage: { mean: '', sd: '' }, 
                            uniform_percentage: { lower_bound: '', upper_bound: '' },
                        },
                        is_discretionary: false,
                        inflation_adjustment: false,
                        married_percentage: '' 
                    },
                    invest: {
                        return_type: 'fixed_allocation',
                        fixed_allocation: '',
                        glide_path: '',
                        maximum_cash: ''
                    },
                    rebalance: {
                        return_type: 'fixed_allocation',
                        fixed_allocation: '',
                        glide_path: ''
                    }
                };
            } else {
                // regular update for other fields
                updated_events[index] = {
                    ...updated_events[index],
                    [field]: value,
                };
            }
    
            console.log("Updated Event:", updated_events[index]);
            return updated_events;
        });
    };
    
    

    return (
        <div>
            <label>Number of Events:</label>

            <input
                type="number"
                value={events.length}
                onChange={handle_event_count_change}
            />

            {events.map((event, index) => (
                <div key={index}>
                    <h3>Event {index + 1}</h3>
                    
                    {/* Name and Description */}
                    <input 
                        type="text" 
                        placeholder="Event Name" 
                        value={event.name} 
                        onChange={(e) => handle_event_update(index, 'name', e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="Event Description" 
                        value={event.description} 
                        onChange={(e) => handle_event_update(index, 'description', e.target.value)}
                    />

                    {/* start year */}
                    <div>
                        <label>Start Year:</label>
                        <select 
                            value={event.start_year.return_type} 
                            onChange={(e) => handle_single_nested_update(index, 'start_year', { return_type: e.target.value }, 'start_year')}
                        >
                            <option value="fixed_value">Fixed Value</option>
                            <option value="normal_value">Normal Distribution</option>
                            <option value="uniform_value">Uniform Distribution</option>
                            <option value="same_year_as_another_event">Same Year as Another Event</option>
                            <option value="year_after_another_event_end">Year After Another Event End</option>
                        </select>

                        {/* fixed value */}
                        {event.start_year.return_type === 'fixed_value' && (
                            <input
                                type="number"
                                placeholder="Fixed Start Year"
                                value={event.start_year.fixed_value}
                                onChange={(e) => handle_single_nested_update(index, 'fixed_value', e.target.value, 'start_year')}
                            />
                        )}

                        {/* normal distribution */}
                        {event.start_year.return_type === 'normal_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean"
                                    value={event.start_year.normal_value.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'mean', e.target.value, 'start_year')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={event.start_year.normal_value.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'sd', e.target.value, 'start_year')}
                                />
                            </>
                        )}

                        {/* uniform distribution */}
                        {event.start_year.return_type === 'uniform_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Lower Bound"
                                    value={event.start_year.uniform_value.lower_bound}
                                    onChange={(e) => handle_double_nested_update(index, 'uniform_value', 'lower_bound', e.target.value, 'start_year')}
                                />
                                <input
                                    type="number"
                                    placeholder="Upper Bound"
                                    value={event.start_year.uniform_value.upper_bound}
                                    onChange={(e) => handle_double_nested_update(index, 'uniform_value', 'upper_bound', e.target.value, 'start_year')}
                                />
                            </>
                        )}

                        {/* same year as another event */}
                        {event.start_year.return_type === 'same_year_as_another_event' && (
                            <input
                                type="text"
                                placeholder="Event Name"
                                value={event.start_year.same_year_as_another_event}
                                onChange={(e) => handle_single_nested_update(index, 'same_year_as_another_event', e.target.value, 'start_year')}
                            />
                        )}

                        {/* year after another event ends */}
                        {event.start_year.return_type === 'year_after_another_event_end' && (
                            <input
                                type="text"
                                placeholder="Event Name"
                                value={event.start_year.year_after_another_event_end}
                                onChange={(e) => handle_single_nested_update(index, 'year_after_another_event_end', e.target.value, 'start_year')}
                            />
                        )}

                    </div>

                    <div>
                        <label>Duration:</label>
                        <select 
                            value={event.duration.return_type} 
                            onChange={(e) => handle_single_nested_update(index, 'duration', { return_type: e.target.value }, 'duration')}
                        >
                            <option value="fixed_value">Fixed Value</option>
                            <option value="normal_value">Normal Distribution</option>
                            <option value="uniform_value">Uniform Distribution</option>
                        </select>

                        {/* fixed value */}
                        {event.duration.return_type === 'fixed_value' && (
                            <input
                                type="number"
                                placeholder="Fixed Duration"
                                value={event.duration.fixed_value}
                                onChange={(e) => handle_single_nested_update(index, 'fixed_value', e.target.value, 'duration')}
                            />
                        )}

                        {/* normal distribution */}
                        {event.duration.return_type === 'normal_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean"
                                    value={event.duration.normal_value.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'mean', e.target.value, 'duration')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={event.duration.normal_value.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'sd', e.target.value, 'duration')}
                                />
                            </>
                        )}

                        {/* uniform distribution */}
                        {event.duration.return_type === 'uniform_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Lower Bound"
                                    value={event.duration.uniform_value.lower_bound}
                                    onChange={(e) => handle_double_nested_update(index, 'uniform_value', 'lower_bound', e.target.value, 'duration')}
                                />
                                <input
                                    type="number"
                                    placeholder="Upper Bound"
                                    value={event.duration.uniform_value.upper_bound}
                                    onChange={(e) => handle_double_nested_update(index, 'uniform_value', 'upper_bound', e.target.value, 'duration')}
                                />
                            </>
                        )}
                    </div>

                    {/* event type */}
                    <select 
                        value={event.event_type} 
                        onChange={(e) => handle_event_update(index, 'event_type', e.target.value)}
                    >
                        <option value="">Select Event Type</option>
                        <option value="income">Income</option>

                        <option value="expense">Expense</option>
                        <option value="invest">Invest</option>
                        <option value="rebalance">Rebalance</option>
                    </select>

                    {/* Show additional fields based on event type */}
                    {(event.event_type === "income" || event.event_type === "expense") && (
                        <div>
                            {/* initial amount */}
                            <input 
                                type="number" 
                                placeholder="Initial Amount" 
                                value={event[event.event_type].initial_amount} 
                                onChange={(e) => handle_single_nested_update(index, 'initial_amount', e.target.value, event.event_type)}
                            />

                             {/* expected annual change type selection */}
                            <label>Expected Annual Change Type:</label>
                            <select
                                value={event[event.event_type].expected_annual_change.return_type}
                                onChange={(e) => handle_single_nested_update(index, 'expected_annual_change', { return_type: e.target.value }, event.event_type)}
                            >
                                <option value="fixed_value">Fixed Amount</option>
                                <option value="fixed_percentage">Fixed Percentage</option>
                                <option value="normal_value">Normal Distribution (Amount)</option>
                                <option value="normal_percentage">Normal Distribution (Percentage)</option>
                                <option value="uniform_value">Uniform Distribution (Amount)</option>
                                <option value="uniform_percentage">Uniform Distribution (Percentage)</option>

                            </select>

                            {/* fixed value */}
                            {event[event.event_type].expected_annual_change.return_type === "fixed_value" && (
                                <input
                                    type="number"
                                    placeholder="Fixed Amount"
                                    value={event[event.event_type].expected_annual_change.fixed_value}
                                    onChange={(e) =>
                                        handle_single_nested_update(
                                            index,
                                            "expected_annual_change.fixed_value",
                                            e.target.value,
                                            event.event_type
                                        )
                                    }
                                />
                            )}

                            {/* fixed percentage */}
                            {event[event.event_type].expected_annual_change.return_type === "fixed_percentage" && (
                                <input
                                    type="number"
                                    placeholder="Fixed Percentage"
                                    value={event[event.event_type].expected_annual_change.fixed_percentage}
                                    onChange={(e) =>
                                        handle_single_nested_update(
                                            index,
                                            "expected_annual_change.fixed_percentage",
                                            e.target.value,
                                            event.event_type
                                        )
                                    }
                                />
                            )}

                            {/* normal value */}
                            {event[event.event_type].expected_annual_change.return_type === "normal_value" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Mean"
                                        value={event[event.event_type].expected_annual_change.normal_value.mean}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "normal_value",  // Category
                                                "mean",          // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={event[event.event_type].expected_annual_change.normal_value.sd}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "normal_value",  // Category
                                                "sd",            // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                </>
                            )}

                            {/* normal percentage */}
                            {event[event.event_type].expected_annual_change.return_type === "normal_percentage" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Mean"
                                        value={event[event.event_type].expected_annual_change.normal_percentage.mean}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "normal_percentage",  // Category
                                                "mean",               // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={event[event.event_type].expected_annual_change.normal_percentage.sd}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "normal_percentage",  // Category
                                                "sd",                 // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                </>
                            )}

                            {/* uniform value */}
                            {event[event.event_type].expected_annual_change.return_type === "uniform_value" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Lower Bound"
                                        value={event[event.event_type].expected_annual_change.uniform_value.lower_bound}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "uniform_value",  // Category
                                                "lower_bound",    // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Upper Bound"
                                        value={event[event.event_type].expected_annual_change.uniform_value.upper_bound}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "uniform_value",  // Category
                                                "upper_bound",    // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                </>
                            )}

                            {/* uniform percentage */}
                            {event[event.event_type].expected_annual_change.return_type === "uniform_percentage" && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Lower Bound"
                                        value={event[event.event_type].expected_annual_change.uniform_percentage.lower_bound}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "uniform_percentage",  // Category
                                                "lower_bound",         // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                    <input
                                        type="number"
                                        placeholder="Upper Bound"
                                        value={event[event.event_type].expected_annual_change.uniform_percentage.upper_bound}
                                        onChange={(e) =>
                                            handle_double_nested_update(
                                                index,
                                                "uniform_percentage",  // Category
                                                "upper_bound",         // Field
                                                e.target.value,
                                                event.event_type
                                            )
                                        }
                                    />
                                </>
                            )}

                            {/* Inflation Adjustment */}
                            <label>
                                <input
                                    type="checkbox"
                                    checked={event[event.event_type].inflation_adjustment || false}
                                    onChange={(e) =>
                                        handle_single_nested_update(
                                            index,
                                            "inflation_adjustment",
                                            e.target.checked,
                                            event.event_type
                                        )
                                    }
                                />
                                Inflation Adjustment
                            </label>

                            {/* user's share percentage (only if scenario_type is "married") */}
                            {scenario_type === "married" && (
                                <input
                                    type="number"
                                    placeholder="Your Share Percentage"
                                    value={event[event.event_type].married_percentage || ""}
                                    onChange={(e) =>
                                        handle_single_nested_update(
                                            index,
                                            "married_percentage",
                                            e.target.value,
                                            event.event_type
                                        )
                                    }
                                />
                            )}

                            {/* if event_type is "income", ask whether it's Social Security */}
                            {event.event_type === "income" && (
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={event[event.event_type].is_social_security ?? false}
                                        onChange={(e) => handle_single_nested_update(index, "is_social_security", e.target.checked, event.event_type)}
                                    />
                                    Social Security Income
                                </label>
                            )}

                            {/* if event_type is "expense", ask whether it's Discretionary */}
                            {event.event_type === "expense" && (
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={event[event.event_type].is_discretionary ?? false}
                                        onChange={(e) => handle_single_nested_update(index, "is_discretionary", e.target.checked, event.event_type)}
                                    />
                                    Discretionary Expense
                                </label>
                            )}



                           




                            

                            
                        </div>
                    )}
                
                    {(event.event_type === "invest" || event.event_type === "rebalance") && (
                        <div>
                            {/* Asset Allocation Strategy */}
                            <label>Asset Allocation Strategy:</label>
                            <select
                                value={event[event.event_type].return_type}
                                onChange={(e) => handle_single_nested_update(index, "asset_allocation", { return_type: e.target.value }, event.event_type)}
                            >
                                <option value="fixed_allocation">Fixed Percentages</option>
                                <option value="glide_path">Glide Path</option>
                            </select>

                            {/* If return_type is 'fixed_allocation', show input field for name:percentage pairs */}
                            {event[event.event_type].return_type === "fixed_allocation" && (
                                <div>
                                    <label>Enter Name:Percentage pairs (e.g., name1:10;name2:20):</label>
                                    <input
                                        type="text"
                                        placeholder="Enter name:percentage pairs"
                                        value={event[event.event_type].fixed_allocation || ""}
                                        onChange={(e) => handle_single_nested_update(index, "fixed_allocation", e.target.value, event.event_type)}
                                    />
                                </div>
                            )}

                            {event[event.event_type].return_type === "glide_path" && (
                                <div>
                                    <label>Enter Name num1-num2 pairs (e.g., name1 10-20;name2 15-25):</label>
                                    <input
                                        type="text"
                                        placeholder="Enter name num1-num2 pairs"
                                        value={event[event.event_type].glide_path || ""}
                                        onChange={(e) => handle_single_nested_update(index, "glide_path", e.target.value, event.event_type)}
                                    />
                                </div>
                            )}

                            {/* if event_type is 'invest', show input for maximum_cash */}
                            {event.event_type === "invest" && (
                                <div>
                                    <label>Maximum Cash:</label>
                                    <input
                                        type="number"
                                        placeholder="Enter maximum cash"
                                        value={event[event.event_type].maximum_cash || ""}
                                        onChange={(e) => handle_single_nested_update(index, "maximum_cash", e.target.value, event.event_type)}
                                    />
                                </div>
                            )}

                            

                        </div>


                    )}

                   



                    
                </div>
            ))}
        </div>
    );
}


export default EventForm;