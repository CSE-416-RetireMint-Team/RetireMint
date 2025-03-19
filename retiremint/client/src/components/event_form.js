

function EventForm({events, set_events}) {

    const handle_event_count_change = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        set_events((prev) => {
            const new_events = [...prev];

            while (new_events.length < count) {
                new_events.push({ 
                    name: '',
                    description: '',
                    startYear: '',
                    startYearType: '',
                    duration: '',
                    type: '',
                    initialAmount: '',
                    expectedAnnualChange: '',
                    expectedAnnualChangeType: '',
                    inflationAdjusted: '',
                    spousePercentage: '',
                    isSocialSecurity: '',
                    isDiscretionary: '',
                    assetAllocation: '',
                    maximumCash: '',
                });
            }
            return new_events.slice(0, count);
        });
    };

    const handle_single_nested_update = (index, field, value, type) => {
        console.log('Updating single nested field:', { index, field, value, type });
        set_events((prev) => {
            const updated_events = [...prev];

            // Update investment fields such as name, description, expense_ratio and taxability
            if ( field === "name" ||
                field === "description" || 
                field === "startYear" || 
                field === "startYearType" || 
                field === "duration" || 
                field === "type" ||
                field === "initialAmount" ||
                field === "expectedAnnualChange" ||
                field === "expectedAnnualChangeType" ||
                field === "inflationAdjusted" ||
                field === "spousePercentage" ||
                field === "isSocialSecurity" ||
                field === "isDiscretionary" ||
                field === "assetAllocation" ||
                field === "maximumCash"
            ) { 
                updated_events[index] = {
                    ...updated_events[index],
                    [field]: value
                }
            }
            return updated_events;      
        })
    }

    return(
        <div>
            <label>Enter your number of Event Series below:</label>

            <input
                type="number"
                value={events.length}
                onChange={handle_event_count_change}
            />


            {events.map((event, index) => (
                <div key={index}>
                    <h3>Event {index + 1}</h3>
                    
                    <label>Enter the Name of the Event below:</label>
                    <input 
                        type="text"
                        placeholder="Event Name"
                        value={event.name}
                        onChange={(e) => handle_single_nested_update(index, 'name', e.target.value)}
                    />
                    <label>Enter a description for the event below: </label>
                    <input 
                        type="description"
                        placeholder="Event Description"
                        value={event.description}
                        onChange={(e) => handle_single_nested_update(index, 'description', e.target.value)}
                    />

                    <label>Choose one of the methods to enter start year:</label>
                    <select
                    value={event.startYearType}
                    onChange={(e) => handle_single_nested_update(index, 'startYearType', e.target.value)}>
                        <option value="fixed_value">Fixed Value</option>
                        <option value="uniform_distribution">Uniform Distribution</option>
                        <option value="normal_distribution">Normal Distribution</option>
                        <option value="same_year">The same year than an Event Series starts</option>
                        <option value="after_year">The year after an Event Series ends</option>
                    </select>
                    {event.startYearType === 'same_year' && (
                        <div>
                            {/*TODO: Get back to this*/}?
                        </div>
                    )}

                    <label>Choose one of the time methods to enter time duration: </label>
                    <select 
                    value={event.duration_type}
                    >
                        <option value="fixed_amount">Fixed Distribution</option>
                        <option value="uniform_distribution">Uniform Distribution</option>
                        <option value="normal_distribution">Normal Distribution</option>
                    </select>
                    
                    <label>Choose one of the types:</label>
                    <select
                    value={event.type}
                    onChange={(e) => handle_single_nested_update(index, "type", e.target.value)}>
                        <option value="income">Income</option>                       
                        <option value="expense">Expense</option>
                        <option value="invest">Invest</option>
                        <option value="rebalance">Rebalance</option>
                    </select>

                    <label>Enter initial amount below:</label>
                    <input type="number"
                    value={event.initialAmount}
                    onChange={(e) => handle_single_nested_update(index, 'initialAmount', e.target.value)}
                    />
                    {(event.type === "income" || event.type == "expense") && (
                        <div>
                            <label>
                                Choose one of the methods to express expected annual change in amount
                            </label>
                            <select
                            value={event.expectedAnnualChangeType}
                            onChange={(e) => handle_single_nested_update(index, 'expectedAnnualChangeType', e.target.value)}>
                                <option value="fixed_amount">Fixed Amount</option>
                                <option value="fixed_percentage">Fixed Percentage</option>
                                <option value="uniform_amount">Amount Sampled From Uniform Distribution</option>
                                <option value="uniform_percentage">Percentage Sampled From Uniform Distribution</option>
                                <option value="normal_amount">Amount Sampled From Normal Distribution</option>
                                <option value="normal_percentage">Amount Sampled From Normal Distribution</option>
                            </select>
                            <input
                            type="number"
                            value={event.expectedAnnualChange}
                            onChange={(e) => handle_single_nested_update(index, "expectedAnnualChange", e.target.value)} />
                        </div>
                    )}
                    {event.type === "income" && (
                        <div>
                            <label>Is this income Social Security?</label>
                            <input 
                            type="checkbox" 
                            onChange={(e) => handle_single_nested_update(index, 'isSocialSecurity', e.target.value)}
                            />
                        </div>
                    )}
                    {event.type === "expense" && (
                        <div>
                            <label>Is this expense discretionary?</label>
                            <input 
                            type="checkbox" 
                            onChange={(e) => handle_single_nested_update(index, 'isDiscretionary', e.target.value)}
                            />
                        </div>
                    )}

                

                </div>
            ))}
        </div>

    )
}


export default EventForm;