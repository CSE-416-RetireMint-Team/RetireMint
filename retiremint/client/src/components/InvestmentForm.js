import React from 'react';

function InvestmentForm({ investments, setInvestments ,setPage}) {

    const handleInvestmentCountChange = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        setInvestments((prev) => {
            const newInvestments = [...prev];

            while (newInvestments.length < count) {
                newInvestments.push({
                    investmentType: {
                        name: '',
                        description: '',
                        expectedReturn: { 
                            returnType: '',
                            fixedValue: '', 
                            fixedPercentage: '', 
                            normalValue: { mean: '', sd: '' }, 
                            normalPercentage: { mean: '', sd: '' }
                        },
                        expenseRatio: '',
                        taxability: '',
                    },
                    value: '',
                    taxStatus: '',
                });
            }

            return newInvestments.slice(0, count);
        });
    };

    const updateInvestment = (index, fieldPath, newValue) => {
        setInvestments((prev) =>
            prev.map((investment, i) => {
                if (i !== index) return investment; // Skip other investments
    
                let updatedInvestment = { ...investment }; // Clone top-level object
    
                if (!Array.isArray(fieldPath)) {
                    // Direct top-level update
                    updatedInvestment[fieldPath] = newValue;
                } else {
                    // Handle nested updates
                    let target = updatedInvestment;
                    for (let j = 0; j < fieldPath.length - 1; j++) {
                        const key = fieldPath[j];
                        
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
    
                    // Apply the final update
                    target[fieldPath[fieldPath.length - 1]] = newValue;
                }
    
                console.log(`Updating investment ${index}:`, updatedInvestment);
                return updatedInvestment;
            })
        );
    };
    
    
    
    

   

    return (
        <div>
            <h2>Number of Investments:</h2>
            <input 
                type="number" 
                value={investments.length} 
                onChange={handleInvestmentCountChange} 
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
                            value={investment.investmentType.name} 
                            onChange={(e) => updateInvestment(index, ['investmentType', 'name'], e.target.value)} 
                        />
                         <h2>Description:</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Description" 
                            value={investment.investmentType.description} 
                            onChange={(e) => updateInvestment(index, ['investmentType', 'description'], e.target.value)}
                        />
                    </>

                    <> {/* expected annual return */}
                        <div>
                            <h2>Expected Annual Return: *</h2>
                            
                            <button onClick={() => updateInvestment(index, ['investmentType', 'expectedReturn', 'returnType'], 'fixedValue')}>
                                Fixed Value
                            </button>
                            
                            <button onClick={() => updateInvestment(index, ['investmentType', 'expectedReturn', 'returnType'], 'fixedPercentage')}>
                                Fixed Percentage
                            </button>
                            
                            <button onClick={() => updateInvestment(index, ['investmentType', 'expectedReturn', 'returnType'], 'normalValue')}>
                                Fixed Value (Normal Distribution)
                            </button>
                            
                            <button onClick={() => updateInvestment(index, ['investmentType', 'expectedReturn', 'returnType'], 'normalPercentage')}>
                                Percentage (Normal Distribution)
                            </button>
                        </div>

                        <>
                            {/* Fixed Value */}
                            {investment.investmentType.expectedReturn.returnType === 'fixedValue' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Value"
                                    value={investment.investmentType.expectedReturn.fixedValue}
                                    onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'fixedValue'], e.target.value)}
                                />
                            )}

                            {/* Fixed Percentage */}
                            {investment.investmentType.expectedReturn.returnType === 'fixedPercentage' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Percentage"
                                    value={investment.investmentType.expectedReturn.fixedPercentage}
                                    onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'fixedPercentage'], e.target.value)}
                                />
                            )}

                            {/* Normal Distribution (Value) */}
                            {investment.investmentType.expectedReturn.returnType === 'normalValue' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Value"
                                        value={investment.investmentType.expectedReturn.normalValue.mean}
                                        onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'normalValue', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investmentType.expectedReturn.normalValue.sd}
                                        onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'normalValue', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {investment.investmentType.expectedReturn.returnType === 'normalPercentage' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Percentage"
                                        value={investment.investmentType.expectedReturn.normalPercentage.mean}
                                        onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'normalPercentage', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investment.investmentType.expectedReturn.normalPercentage.sd}
                                        onChange={(e) => updateInvestment(index, ['investmentType', 'expectedReturn', 'normalPercentage', 'sd'], e.target.value)}
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
                            value={investment.investmentType.expenseRatio}
                            onChange={(e) => updateInvestment(index, ['investmentType', 'expenseRatio'], e.target.value)}
                        />
                    </div>


                    {/* taxability section */}
                    <div>
                        <h2>Taxability: *</h2>
                        <ul>
                            <li>
                                <label>
                                    <input
                                        type="radio"
                                        name={`taxability${index}`}
                                        value="taxable"
                                        checked={investment.investmentType.taxability === "taxable"}
                                        onChange={(e) => updateInvestment(index, ["investmentType", "taxability"], e.target.value)}
                                    />
                                    Taxable
                                </label>
                            </li>
                            <li>
                                <label>
                                    <input
                                        type="radio"
                                        name={`taxability${index}`}
                                        value="tax-exempt"
                                        checked={investment.investmentType.taxability === "tax-exempt"}
                                        onChange={(e) => updateInvestment(index, ["investmentType", "taxability"], e.target.value)}
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
                        onChange={(e) => updateInvestment(index, ['value'], e.target.value)}
                    />

                    <h2>Tax Status: *</h2>
                    {/* tax status */}
                    <div>
                        <label>Tax Status:</label>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`taxStatus${index}`}
                                    value="non-retirement"
                                    checked={investment.taxStatus === "non-retirement"}
                                    onChange={(e) => updateInvestment(index, ["taxStatus"], e.target.value)}
                                />
                                Non-Retirement
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`taxStatus${index}`}
                                    value="pre-tax"
                                    checked={investment.taxStatus === "pre-tax"}
                                    onChange={(e) => updateInvestment(index, ["taxStatus"], e.target.value)}
                                />
                                Pre-Tax
                            </label>
                        </div>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    name={`taxStatus${index}`}
                                    value="after-tax"
                                    checked={investment.taxStatus === "after-tax"}
                                    onChange={(e) => updateInvestment(index, ["taxStatus"], e.target.value)}
                                />
                                After-Tax
                            </label>
                        </div>
                    </div>


                


                    
                </div>
            ))}

            {/* navigation buttons */}
            <div>
                <button onClick={() => setPage(1)}>Previous</button>
                <button onClick={() => {
                    if (investments.length === 0) {
                        alert("At least one investment is required.");
                        return;
                    }

                    for (const investment of investments) {
                        if (!investment.investmentType.name) {
                            alert("Each investment must have a Name.");
                            return;
                        }

                        // Validate Expected Annual Return
                        if (!investment.investmentType.expectedReturn.returnType) {
                            alert(`Investment "${investment.investmentType.name}" must have a Return Type for Expected Annual Return.`);
                            return;
                        }

                        switch (investment.investmentType.expectedReturn.returnType) {
                            case 'fixedValue':
                                if (!investment.investmentType.expectedReturn.fixedValue) {
                                    alert(`Investment "${investment.investmentType.name}" requires a Fixed Value for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'fixedPercentage':
                                if (!investment.investmentType.expectedReturn.fixedPercentage) {
                                    alert(`Investment "${investment.investmentType.name}" requires a Fixed Percentage for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'normalValue':
                                if (!investment.investmentType.expectedReturn.normalValue.mean || !investment.investmentType.expectedReturn.normalValue.sd) {
                                    alert(`Investment "${investment.investmentType.name}" requires Mean and Standard Deviation for Normal Value.`);
                                    return;
                                }
                                break;
                            case 'normalPercentage':
                                if (!investment.investmentType.expectedReturn.normalPercentage.mean || !investment.investmentType.expectedReturn.normalPercentage.sd) {
                                    alert(`Investment "${investment.investmentType.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                    return;
                                }
                                break;
                            default:
                                // No action needed for unknown fields
                                break;
                        }

                        // Validate other required fields
                        if (!investment.investmentType.expenseRatio) {
                            alert(`Investment "${investment.investmentType.name}" must have an Expense Ratio.`);
                            return;
                        }

                        if (!investment.investmentType.taxability) {
                            alert(`Investment "${investment.investmentType.name}" must have a Taxability status.`);
                            return;
                        }

                        if (!investment.value) {
                            alert(`Investment "${investment.investmentType.name}" must have a Value in Dollars.`);
                            return;
                        }

                        if (!investment.taxStatus) {
                            alert(`Investment "${investment.investmentType.name}" must have a Tax Status.`);
                            return;
                        }
                    }

                    

                    // If all investments are valid, proceed to the next page
                    setPage(3);




                }}>
                    Next
                </button>


            </div>

            
        </div>
    );
}

export default InvestmentForm;
