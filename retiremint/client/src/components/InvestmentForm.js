import React from 'react';

function InvestmentForm({ investments, setInvestments, investmentTypes, setInvestmentTypes, setPage}) {

    const handleInvestmentCountChange = (e) => {
        const count = parseInt(e.target.value, 10) || 0;

        setInvestments((prev) => {
            const newInvestments = [...prev];

            while (newInvestments.length < count) {
                newInvestments.push({
                    name: '',
                    desc: '',
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
                            value={investment.name} 
                            onChange={(e) => updateInvestment(index, ['name'], e.target.value)} 
                        />
                         <h2>Description:</h2>
                        <input 
                            type="text" 
                            placeholder="Investment Description" 
                            value={investment.investmentType.description} 
                            onChange={(e) => updateInvestment(index, ['description'], e.target.value)}
                        />
                    </>

                    <>
                    {/* picking a investment type */}
                        <h2>Investment Type:</h2>
                        {/*investmentTypes.map((investmentType, index) => {
                            <div>

                            </div>
                        })*/}
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
                <button onClick={() => setPage(2)}>Previous</button>
                <button onClick={() => {
                    if (investments.length === 0) {
                        alert("At least one investment is required.");
                        return;
                    }

                    for (const investment of investments) {
                        if (!investment.name) {
                            alert("Each investment must have a Name.");
                            return;
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
                            alert(`Investment "${investment.name}" must have a Value in Dollars.`);
                            return;
                        }

                        if (!investment.taxStatus) {
                            alert(`Investment "${investment.name}" must have a Tax Status.`);
                            return;
                        }
                    }

                    

                    // If all investments are valid, proceed to the next page
                    setPage(4);




                }}>
                    Next
                </button>


            </div>

            
        </div>
    );
}

export default InvestmentForm;
