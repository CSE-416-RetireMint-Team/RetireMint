import React, { useState } from 'react';

function Investment_form({ investments, set_investments ,set_page}) {

    const handle_investment_count_change = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        set_investments((prev) => {
            const new_investments = [...prev];

            while (new_investments.length < count) {
                new_investments.push({
                    investment_type: {
                        name: '',
                        description: '',
                        expected_return: { 
                            return_type: '',
                            fixed_value: '', 
                            fixed_percentage: '', 
                            normal_value: { mean: '', sd: '' }, 
                            normal_percentage: { mean: '', sd: '' }
                        },
                        expected_income: { 
                            return_type: '',
                            fixed_value: '', 
                            fixed_percentage: '', 
                            normal_value: { mean: '', sd: '' }, 
                            normal_percentage: { mean: '', sd: '' }
                        },
                        expense_ratio: '',
                        taxability: '',
                    },
                    value: '',
                    tax_status: '',
                });
            }

            return new_investments.slice(0, count);
        });
    };

    const update_investment = (index, field_path, new_value) => {
        set_investments((prev) =>
            prev.map((investment, i) => {
                if (i !== index) return investment; // Skip other investments
    
                let updated_investment = { ...investment }; // Clone top-level object
    
                if (!Array.isArray(field_path)) {
                    // Direct top-level update
                    updated_investment[field_path] = new_value;
                } else {
                    // Handle nested updates
                    let target = updated_investment;
                    for (let j = 0; j < field_path.length - 1; j++) {
                        const key = field_path[j];
                        
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
    
                    // Apply the final update
                    target[field_path[field_path.length - 1]] = new_value;
                }
    
                console.log(`Updating investment ${index}:`, updated_investment);
                return updated_investment;
            })
        );
    };
    
    
    
    

   

    return (
        <div>
            <h2>Number of Investments:</h2>
            <input 
                type="number" 
                value={investments.length} 
                onChange={handle_investment_count_change} 
            />

            {investments.map((investment, index) => (
                <div key={index}>
                    <h2>Investment {index + 1}</h2>
                    
                    <>
                    {/* name and description */}
                        <h2>Name: *</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Name" 
                            value={investment.investment_type.name} 
                            onChange={(e) => update_investment(index, ['investment_type', 'name'], e.target.value)} 
                        />
                         <h2>Description:</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Description" 
                            value={investment.investment_type.description} 
                            onChange={(e) => update_investment(index, ['investment_type', 'description'], e.target.value)}
                        />
                    </>

                    <> {/* expected annual return */}
                        <div>
                            <h2>Expected Annual Return: *</h2>
                            
                            <button onClick={() => update_investment(index, ['investment_type', 'expected_return', 'return_type'], 'fixed_value')}>
                                Fixed Value
                            </button>
                            
                            <button onClick={() => update_investment(index, ['investment_type', 'expected_return', 'return_type'], 'fixed_percentage')}>
                                Fixed Percentage
                            </button>
                            
                            <button onClick={() => update_investment(index, ['investment_type', 'expected_return', 'return_type'], 'normal_value')}>
                                Fixed Value (Normal Distribution)
                            </button>
                            
                            <button onClick={() => update_investment(index, ['investment_type', 'expected_return', 'return_type'], 'normal_percentage')}>
                                Percentage (Normal Distribution)
                            </button>
                        </div>

                        <>
                            {/* Fixed Value */}
                            {investment.investment_type.expected_return.return_type === 'fixed_value' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Value"
                                    value={investment.investment_type.expected_return.fixed_value}
                                    onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'fixed_value'], e.target.value)}
                                />
                            )}

                            {/* Fixed Percentage */}
                            {investment.investment_type.expected_return.return_type === 'fixed_percentage' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Percentage"
                                    value={investment.investment_type.expected_return.fixed_percentage}
                                    onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'fixed_percentage'], e.target.value)}
                                />
                            )}

                            {/* Normal Distribution (Value) */}
                            {investment.investment_type.expected_return.return_type === 'normal_value' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Value"
                                        value={investment.investment_type.expected_return.normal_value.mean}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'normal_value', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investment_type.expected_return.normal_value.sd}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'normal_value', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {investment.investment_type.expected_return.return_type === 'normal_percentage' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Percentage"
                                        value={investment.investment_type.expected_return.normal_percentage.mean}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'normal_percentage', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investment_type.expected_return.normal_percentage.sd}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_return', 'normal_percentage', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                        
                        
                        </>


                    </>

                     {/* expense ratio */}
                     <div>
                        <h2>Expense Ratio (%) *:</h2>
                        <input
                            type="number"
                            placeholder="Expense Ratio"
                            value={investment.investment_type.expense_ratio}
                            onChange={(e) => update_investment(index, ['investment_type', 'expense_ratio'], e.target.value)}
                        />
                    </div>


                    <> {/* expected annual income */}
                        <div>
                            <h2>Expected Annual Income: *</h2>

                            <button onClick={() => update_investment(index, ['investment_type', 'expected_income', 'return_type'], 'fixed_value')}>
                                Fixed Value
                            </button>

                            <button onClick={() => update_investment(index, ['investment_type', 'expected_income', 'return_type'], 'fixed_percentage')}>
                                Fixed Percentage
                            </button>

                            <button onClick={() => update_investment(index, ['investment_type', 'expected_income', 'return_type'], 'normal_value')}>
                                Fixed Value (Normal Distribution)
                            </button>

                            <button onClick={() => update_investment(index, ['investment_type', 'expected_income', 'return_type'], 'normal_percentage')}>
                                Percentage (Normal Distribution)
                            </button>
                        </div>

                        <>  
                            {/* Fixed Value */}
                            {investment.investment_type.expected_income.return_type === 'fixed_value' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Income Value"
                                    value={investment.investment_type.expected_income.fixed_value}
                                    onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'fixed_value'], e.target.value)}
                                />
                            )}

                            {/* Fixed Percentage */}
                            {investment.investment_type.expected_income.return_type === 'fixed_percentage' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Income Percentage"
                                    value={investment.investment_type.expected_income.fixed_percentage}
                                    onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'fixed_percentage'], e.target.value)}
                                />
                            )}

                            {/* Normal Distribution (Value) */}
                            {investment.investment_type.expected_income.return_type === 'normal_value' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Value"
                                        value={investment.investment_type.expected_income.normal_value.mean}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'normal_value', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investment_type.expected_income.normal_value.sd}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'normal_value', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {investment.investment_type.expected_income.return_type === 'normal_percentage' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Percentage"
                                        value={investment.investment_type.expected_income.normal_percentage.mean}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'normal_percentage', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investment_type.expected_income.normal_percentage.sd}
                                        onChange={(e) => update_investment(index, ['investment_type', 'expected_income', 'normal_percentage', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}
                        </>
                    </>

                   
                    

                    {/* taxability section */}
                    <div>
                        <h2>Taxability: *</h2>
                        <ul>
                            <li>
                                <label>
                                    <input
                                        type="radio"
                                        name={`taxability_${index}`}
                                        value="taxable"
                                        checked={investment.investment_type.taxability === "taxable"}
                                        onChange={(e) => update_investment(index, ["investment_type", "taxability"], e.target.value)}
                                    />
                                    Taxable
                                </label>
                            </li>
                            <li>
                                <label>
                                    <input
                                        type="radio"
                                        name={`taxability_${index}`}
                                        value="tax-exempt"
                                        checked={investment.investment_type.taxability === "tax-exempt"}
                                        onChange={(e) => update_investment(index, ["investment_type", "taxability"], e.target.value)}
                                    />
                                    Tax-Exempt
                                </label>
                            </li>
                        </ul>
                    </div>


                    {/* value in dollars */}
                    <h2>Value In Dollars: *:</h2>
                    <input 
                        type="number" 
                        placeholder="Value in dollars" 
                        value={investment.value}  
                        onChange={(e) => update_investment(index, ['value'], e.target.value)}
                    />

                    <h2>Tax Status: *</h2>
                    {/* tax status */}
                    <div>
                        <label>Tax Status:</label>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`tax_status_${index}`}
                                    value="non-retirement"
                                    checked={investment.tax_status === "non-retirement"}
                                    onChange={(e) => update_investment(index, ["tax_status"], e.target.value)}
                                />
                                Non-Retirement
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`tax_status_${index}`}
                                    value="pre-tax"
                                    checked={investment.tax_status === "pre-tax"}
                                    onChange={(e) => update_investment(index, ["tax_status"], e.target.value)}
                                />
                                Pre-Tax
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`tax_status_${index}`}
                                    value="after-tax"
                                    checked={investment.tax_status === "after-tax"}
                                    onChange={(e) => update_investment(index, ["tax_status"], e.target.value)}
                                />
                                After-Tax
                            </label>
                        </div>
                    </div>


                


                    
                </div>
            ))}

            {/* navigation buttons */}
            <div>
                <button onClick={() => set_page(1)}>Previous</button>
                <button onClick={() => {
                    if (investments.length === 0) {
                        alert("At least one investment is required.");
                        return;
                    }

                    for (const investment of investments) {
                        if (!investment.investment_type.name) {
                            alert("Each investment must have a Name.");
                            return;
                        }

                        // Validate Expected Annual Return
                        if (!investment.investment_type.expected_return.return_type) {
                            alert(`Investment "${investment.investment_type.name}" must have a Return Type for Expected Annual Return.`);
                            return;
                        }

                        switch (investment.investment_type.expected_return.return_type) {
                            case 'fixed_value':
                                if (!investment.investment_type.expected_return.fixed_value) {
                                    alert(`Investment "${investment.investment_type.name}" requires a Fixed Value for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'fixed_percentage':
                                if (!investment.investment_type.expected_return.fixed_percentage) {
                                    alert(`Investment "${investment.investment_type.name}" requires a Fixed Percentage for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'normal_value':
                                if (!investment.investment_type.expected_return.normal_value.mean || !investment.investment_type.expected_return.normal_value.sd) {
                                    alert(`Investment "${investment.investment_type.name}" requires Mean and Standard Deviation for Normal Value.`);
                                    return;
                                }
                                break;
                            case 'normal_percentage':
                                if (!investment.investment_type.expected_return.normal_percentage.mean || !investment.investment_type.expected_return.normal_percentage.sd) {
                                    alert(`Investment "${investment.investment_type.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                    return;
                                }
                                break;
                        }

                        // Validate Expected Annual Income
                        if (!investment.investment_type.expected_income.return_type) {
                            alert(`Investment "${investment.investment_type.name}" must have a Return Type for Expected Annual Income.`);
                            return;
                        }

                        switch (investment.investment_type.expected_income.return_type) {
                            case 'fixed_value':
                                if (!investment.investment_type.expected_income.fixed_value) {
                                    alert(`Investment "${investment.investment_type.name}" requires a Fixed Value for Expected Annual Income.`);
                                    return;
                                }
                                break;
                            case 'fixed_percentage':
                                if (!investment.investment_type.expected_income.fixed_percentage) {
                                    alert(`Investment "${investment.investment_type.name}" requires a Fixed Percentage for Expected Annual Income.`);
                                    return;
                                }
                                break;
                            case 'normal_value':
                                if (!investment.investment_type.expected_income.normal_value.mean || !investment.investment_type.expected_income.normal_value.sd) {
                                    alert(`Investment "${investment.investment_type.name}" requires Mean and Standard Deviation for Normal Value.`);
                                    return;
                                }
                                break;
                            case 'normal_percentage':
                                if (!investment.investment_type.expected_income.normal_percentage.mean || !investment.investment_type.expected_income.normal_percentage.sd) {
                                    alert(`Investment "${investment.investment_type.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                    return;
                                }
                                break;
                        }

                        // Validate other required fields
                        if (!investment.investment_type.expense_ratio) {
                            alert(`Investment "${investment.investment_type.name}" must have an Expense Ratio.`);
                            return;
                        }

                        if (!investment.investment_type.taxability) {
                            alert(`Investment "${investment.investment_type.name}" must have a Taxability status.`);
                            return;
                        }

                        if (!investment.value) {
                            alert(`Investment "${investment.investment_type.name}" must have a Value in Dollars.`);
                            return;
                        }

                        if (!investment.tax_status) {
                            alert(`Investment "${investment.investment_type.name}" must have a Tax Status.`);
                            return;
                        }
                    }

                    

                    // If all investments are valid, proceed to the next page
                    set_page(3);




                }}>
                    Next
                </button>


            </div>

            
        </div>
    );
}

export default Investment_form;
