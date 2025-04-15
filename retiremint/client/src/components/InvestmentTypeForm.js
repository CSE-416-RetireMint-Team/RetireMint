import { useEffect } from 'react';

function InvestmentTypeForm({ investmentTypes, setInvestmentTypes, setPage}) {
    // Initialize investmentTypes with default values if empty
    useEffect(() => {
        if (investmentTypes.length === 0) {
            setInvestmentTypes([{
                name: '',
                description: '',
                expectedReturn: { 
                    returnType: '',
                    fixedValue: '', 
                    fixedPercentage: '', 
                    normalValue: { mean: '', sd: '' }, 
                    normalPercentage: { mean: '', sd: '' }
                },
                expectedIncome: { 
                    returnType: '',
                    fixedValue: '', 
                    fixedPercentage: '', 
                    normalValue: { mean: '', sd: '' }, 
                    normalPercentage: { mean: '', sd: '' }
                },
                expenseRatio: '',
                taxability: ''
            }]);
        }
    }, [investmentTypes.length, setInvestmentTypes]);

    const handleInvestmentTypeCountChange = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        setInvestmentTypes((prev) => {
            const newInvestmentTypes = [...prev];

            while (newInvestmentTypes.length < count) {
                newInvestmentTypes.push({
                    name: '',
                    description: '',
                    expectedReturn: { 
                        returnType: '',
                        fixedValue: '', 
                        fixedPercentage: '', 
                        normalValue: { mean: '', sd: '' }, 
                        normalPercentage: { mean: '', sd: '' }
                    },
                    expectedIncome: { 
                        returnType: '',
                        fixedValue: '', 
                        fixedPercentage: '', 
                        normalValue: { mean: '', sd: '' }, 
                        normalPercentage: { mean: '', sd: '' }
                    },
                    expenseRatio: '',
                    taxability: ''
                });
            }

            return newInvestmentTypes.slice(0, count);
        });
    };

    const updateInvestmentType = (index, fieldPath, newValue) => {
        setInvestmentTypes((prev) =>
            prev.map((investmentType, i) => {
                if (i !== index) return investmentType; // Skip other investments
    
                let updatedInvestmentType = { ...investmentType }; // Clone top-level object
    
                if (!Array.isArray(fieldPath)) {
                    // Direct top-level update
                    updatedInvestmentType[fieldPath] = newValue;
                } else {
                    // Handle nested updates
                    let target = updatedInvestmentType;
                    for (let j = 0; j < fieldPath.length - 1; j++) {
                        const key = fieldPath[j];
                        
                        target[key] = { ...target[key] }; // Clone the nested object
                        target = target[key]; // Move deeper
                    }
    
                    // Apply the final update
                    target[fieldPath[fieldPath.length - 1]] = newValue;
                }
    
                // console.log(`Updating investment type ${index}:`, updatedInvestmentType);
                return updatedInvestmentType;
            })
        );
    };
    
    
    
    

   

    return (
        <div>
            <h2>Number of Investment Types:</h2>
            <input 
                type="number" 
                value={investmentTypes.length} 
                onChange={handleInvestmentTypeCountChange} 
            />

            {investmentTypes.map((investmentType, index) => (
                <div key={index}>
                    <h2>Investment Type {index + 1}</h2>
                    
                    <>
                    {/* name and description */}
                        <h2>Name: *</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Type Name" 
                            value={investmentType.name || ''} 
                            onChange={(e) => updateInvestmentType(index, ['name'], e.target.value)} 
                        />
                         <h2>Description:</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Type Description" 
                            value={investmentType.description || ''} 
                            onChange={(e) => updateInvestmentType(index, ['description'], e.target.value)}
                        />
                    </>

                    <> {/* expected annual return */}
                        <div>
                            <h2>Expected Annual Return: *</h2>
                            
                            <button onClick={() => updateInvestmentType(index, ['expectedReturn', 'returnType'], 'fixedValue')}>
                                Fixed Value
                            </button>
                            
                            <button onClick={() => updateInvestmentType(index, ['expectedReturn', 'returnType'], 'fixedPercentage')}>
                                Fixed Percentage
                            </button>
                            
                            <button onClick={() => updateInvestmentType(index, ['expectedReturn', 'returnType'], 'normalValue')}>
                                Fixed Value (Normal Distribution)
                            </button>
                            
                            <button onClick={() => updateInvestmentType(index, ['expectedReturn', 'returnType'], 'normalPercentage')}>
                                Percentage (Normal Distribution)
                            </button>
                        </div>

                        <>
                            {/* Fixed Value */}
                            {investmentType.expectedReturn.returnType === 'fixedValue' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Value"
                                    value={investmentType.expectedReturn.fixedValue}
                                    onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'fixedValue'], e.target.value)}
                                />
                            )}

                            {/* Fixed Percentage */}
                            {investmentType.expectedReturn.returnType === 'fixedPercentage' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Return Percentage"
                                    value={investmentType.expectedReturn.fixedPercentage}
                                    onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'fixedPercentage'], e.target.value)}
                                />
                            )}

                            {/* Normal Distribution (Value) */}
                            {investmentType.expectedReturn.returnType === 'normalValue' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Value"
                                        value={investmentType.expectedReturn.normalValue.mean}
                                        onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'normalValue', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investmentType.expectedReturn.normalValue.sd}
                                        onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'normalValue', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {investmentType.expectedReturn.returnType === 'normalPercentage' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Percentage"
                                        value={investmentType.expectedReturn.normalPercentage.mean}
                                        onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'normalPercentage', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investmentType.expectedReturn.normalPercentage.sd}
                                        onChange={(e) => updateInvestmentType(index, ['expectedReturn', 'normalPercentage', 'sd'], e.target.value)}
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
                            value={investmentType.expenseRatio || ''}
                            onChange={(e) => updateInvestmentType(index, ['expenseRatio'], e.target.value)}
                        />
                    </div>


                    <> {/* expected annual income */}
                        <div>
                            <h2>Expected Annual Income from Interest or Dividends: *</h2>

                            <button onClick={() => updateInvestmentType(index, ['expectedIncome', 'returnType'], 'fixedValue')}>
                                Fixed Value
                            </button>

                            <button onClick={() => updateInvestmentType(index, ['expectedIncome', 'returnType'], 'fixedPercentage')}>
                                Fixed Percentage
                            </button>

                            <button onClick={() => updateInvestmentType(index, ['expectedIncome', 'returnType'], 'normalValue')}>
                                Fixed Value (Normal Distribution)
                            </button>

                            <button onClick={() => updateInvestmentType(index, ['expectedIncome', 'returnType'], 'normalPercentage')}>
                                Percentage (Normal Distribution)
                            </button>
                        </div>

                        <>  
                            {/* Fixed Value */}
                            {investmentType.expectedIncome.returnType === 'fixedValue' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Income Value"
                                    value={investmentType.expectedIncome.fixedValue}
                                    onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'fixedValue'], e.target.value)}
                                />
                            )}

                            {/* Fixed Percentage */}
                            {investmentType.expectedIncome.returnType === 'fixedPercentage' && (
                                <input
                                    type="number"
                                    placeholder="Fixed Income Percentage"
                                    value={investmentType.expectedIncome.fixedPercentage}
                                    onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'fixedPercentage'], e.target.value)}
                                />
                            )}

                            {/* Normal Distribution (Value) */}
                            {investmentType.expectedIncome.returnType === 'normalValue' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Value"
                                        value={investmentType.expectedIncome.normalValue.mean}
                                        onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'normalValue', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investmentType.expectedIncome.normalValue.sd}
                                        onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'normalValue', 'sd'], e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Normal Distribution (Percentage) */}
                            {investmentType.expectedIncome.returnType === 'normalPercentage' && (
                                <div>
                                    <input
                                        type="number"
                                        placeholder="Mean Percentage"
                                        value={investmentType.expectedIncome.normalPercentage.mean}
                                        onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'normalPercentage', 'mean'], e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Standard Deviation"
                                        value={investmentType.expectedIncome.normalPercentage.sd}
                                        onChange={(e) => updateInvestmentType(index, ['expectedIncome', 'normalPercentage', 'sd'], e.target.value)}
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
                                        name={`taxability${index}`}
                                        value="taxable"
                                        checked={investmentType.taxability === "taxable"}
                                        onChange={(e) => updateInvestmentType(index, ["taxability"], e.target.value)}
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
                                        checked={investmentType.taxability === "tax-exempt"}
                                        onChange={(e) => updateInvestmentType(index, ["taxability"], e.target.value)}
                                    />
                                    Tax-Exempt
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
            ))}

            {/* navigation buttons */}
            <div>
                <button onClick={() => setPage(1)}>Previous</button>
                <button onClick={() => {
                    if (investmentTypes.length === 0) {
                        alert("At least one investment type is required.");
                        return;
                    }

                    for (const investmentType of investmentTypes) {
                        if (!investmentType.name) {
                            alert("Each investment type must have a Name.");
                            return;
                        }

                        // Validate Expected Annual Return
                        if (!investmentType.expectedReturn.returnType) {
                            alert(`Investment Type "${investmentType.name}" must have a Return Type for Expected Annual Return.`);
                            return;
                        }

                        switch (investmentType.expectedReturn.returnType) {
                            case 'fixedValue':
                                if (!investmentType.expectedReturn.fixedValue) {
                                    alert(`Investment Type "${investmentType.name}" requires a Fixed Value for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'fixedPercentage':
                                if (!investmentType.expectedReturn.fixedPercentage) {
                                    alert(`Investment Type "${investmentType.name}" requires a Fixed Percentage for Expected Annual Return.`);
                                    return;
                                }
                                break;
                            case 'normalValue':
                                if (!investmentType.expectedReturn.normalValue.mean || !investmentType.expectedReturn.normalValue.sd) {
                                    alert(`Investment Type "${investmentType.name}" requires Mean and Standard Deviation for Normal Value.`);
                                    return;
                                }
                                break;
                            case 'normalPercentage':
                                if (!investmentType.expectedReturn.normalPercentage.mean || !investmentType.expectedReturn.normalPercentage.sd) {
                                    alert(`Investment Type"${investmentType.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                    return;
                                }
                                break;
                            default:
                                // No action needed for unknown fields
                                break;
                        }

                        // Validate Expected Annual Income
                        if (!investmentType.expectedIncome.returnType) {
                            alert(`Investment Type "${investmentType.name}" must have a Return Type for Expected Annual Income.`);
                            return;
                        }

                        switch (investmentType.expectedIncome.returnType) {
                            case 'fixedValue':
                                if (!investmentType.expectedIncome.fixedValue) {
                                    alert(`Investment Type"${investmentType.name}" requires a Fixed Value for Expected Annual Income.`);
                                    return;
                                }
                                break;
                            case 'fixedPercentage':
                                if (!investmentType.expectedIncome.fixedPercentage) {
                                    alert(`Investment Type "${investmentType.name}" requires a Fixed Percentage for Expected Annual Income.`);
                                    return;
                                }
                                break;
                            case 'normalValue':
                                if (!investmentType.expectedIncome.normalValue.mean || !investmentType.expectedIncome.normalValue.sd) {
                                    alert(`Investment Type "${investmentType.name}" requires Mean and Standard Deviation for Normal Value.`);
                                    return;
                                }
                                break;
                            case 'normalPercentage':
                                if (!investmentType.expectedIncome.normalPercentage.mean || !investmentType.expectedIncome.normalPercentage.sd) {
                                    alert(`Investment Type "${investmentType.name}" requires Mean and Standard Deviation for Normal Percentage.`);
                                    return;
                                }
                                break;
                            default:
                                // Handle unknown investment type
                                break;
                        }

                        // Validate other required fields
                        if (!investmentType.expenseRatio) {
                            alert(`Investment Type "${investmentType.name}" must have an Expense Ratio.`);
                            return;
                        }

                        if (!investmentType.taxability) {
                            alert(`Investment Type "${investmentType.name}" must have a Taxability status.`);
                            return;
                        }
                    }

                    // If all investment types are valid, proceed to the next page
                    setPage(3);
                }}>
                    Next
                </button>


            </div>

            
        </div>
    );
}

export default InvestmentTypeForm;
