import React, { useState } from 'react';

function Investment_form({ investments, set_investments }) {

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
                            return_type: 'fixed_value', // set default return type
                            fixed_value: '', 
                            fixed_percentage: '', 
                            normal_value: { mean: '', sd: '' }, 
                            normal_percentage: { mean: '', sd: '' }, 
                            gbm: { mu: '', sigma: '', elapsed_time: '' }
                        },
                        expected_income: { 
                            return_type: 'fixed_value', //same format as expected_return
                            fixed_value: '', 
                            fixed_percentage: '', 
                            normal_value: { mean: '', sd: '' }, 
                            normal_percentage: { mean: '', sd: '' }, 
                            gbm: { mu: '', sigma: '', elapsed_time: '' }
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

    const handle_single_nested_update = (index, field, value, type) => {
        console.log('Updating single nested field:', { index, field, value, type });
        
        set_investments((prev) => {
            const updated_investments = [...prev];
    
            // Update investment fields such as name, description, expense_ratio, and taxability
            if (field === "name" || field === "description" || field === "expense_ratio" || field === "taxability") {
                updated_investments[index] = {
                    ...updated_investments[index],
                    investment_type: {
                        ...updated_investments[index].investment_type,
                        [field]: value, // Update the specific field
                    },
                };
            } 
            // Handle updates to expected_return or expected_income
            else if (field === "expected_return" || field === "expected_income") {
                updated_investments[index] = {
                    ...updated_investments[index],
                    investment_type: {
                        ...updated_investments[index].investment_type,
                        [type]: {
                            return_type: value.return_type, // Update return type
                            fixed_value: '', 
                            fixed_percentage: '', 
                            normal_value: { mean: '', sd: '' }, 
                            normal_percentage: { mean: '', sd: '' }, 
                            gbm: { mu: '', sigma: '', elapsed_time: '' },
                        },
                    },
                };
            } 
            // Handle updates for fixed_value or fixed_percentage
            else if (field === 'fixed_value' || field === 'fixed_percentage') {
                updated_investments[index] = {
                    ...updated_investments[index],
                    investment_type: {
                        ...updated_investments[index].investment_type,
                        [type]: {
                            ...updated_investments[index].investment_type[type],
                            [field]: value, // Update the specific fixed value or percentage
                        },
                    },
                };
            }
    
            console.log('Updated investments:', updated_investments);
            return updated_investments;
        });
    };
    
    const handle_double_nested_update = (index, category, field, value, type) => {
        console.log('Updating double nested field:', { index, category, field, value, type });
    
        set_investments((prev) => {
            const updated_investments = [...prev];
    
            updated_investments[index] = {
                ...updated_investments[index],
                investment_type: {
                    ...updated_investments[index].investment_type,
                    [type]: {
                        ...updated_investments[index].investment_type[type],
                        [category]: {
                            ...updated_investments[index].investment_type[type][category],
                            [field]: value, // Update the nested field value
                        },
                    },
                },
            };
    
            console.log('Updated investments after double nested update:', updated_investments);
            return updated_investments;
        });
    };
    

    const handle_investment_update = (index, field, value) => {
        set_investments((prev) => {
            const updated_investments = [...prev];

            // direct update for top-level fields
            updated_investments[index] = {
                ...updated_investments[index],
                [field]: value,
            };

            console.log("Updated Investment:", updated_investments[index]);
            return updated_investments;
        });
    };

    return (
        <div>
            <label>Number of Investments:</label>
            <input 
                type="number" 
                value={investments.length} 
                onChange={handle_investment_count_change} 
            />

            {investments.map((investment, index) => (
                <div key={index}>
                    <h3>Investment {index + 1}</h3>
                    
                    {/* name and description */}
                    <input 
                        type="text" 
                        placeholder="Investment Name" 
                        value={investment.investment_type.name} 
                        onChange={(e) => handle_single_nested_update(index, 'name', e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="Investment Description" 
                        value={investment.investment_type.description} 
                        onChange={(e) => handle_single_nested_update(index, 'description', e.target.value)}
                    />

                    {/* expected annual return */}
                    <div>
                        <label>Expected Annual Return:</label>
                        <select 
                            value={investment.investment_type.expected_return.return_type} 
                            onChange={(e) => handle_single_nested_update(index, 'expected_return', { return_type: e.target.value }, 'expected_return')}
                        >
                            <option value="fixed_value">Fixed Value</option>
                            <option value="fixed_percentage">Fixed Percentage</option>
                            <option value="normal_value">Fixed Value (Normal Distribution)</option>
                            <option value="normal_percentage">Percentage (Normal Distribution)</option>
                            <option value="gbm">Geometric Brownian Motion (GBM)</option>
                        </select>

                        {/* fixed Value (default) */}
                        {investment.investment_type.expected_return.return_type === 'fixed_value' && (
                            <input
                                type="number"
                                placeholder="Fixed Return Value"
                                value={investment.investment_type.expected_return.fixed_value}
                                onChange={(e) => handle_single_nested_update(index, 'fixed_value', e.target.value,'expected_return')}
                            />
                        )}

                        {/* fixed percentage */}
                        {investment.investment_type.expected_return.return_type === 'fixed_percentage' && (
                            <div>
                                <input
                                    type="number"
                                    placeholder="Return Percentage"
                                    value={investment.investment_type.expected_return.fixed_percentage}
                                    onChange={(e) => handle_single_nested_update(index, 'fixed_percentage', e.target.value,'expected_return')} 
                                />
                                <span>%</span>
                            </div>
                        )}


                        {/* normal distribution (fixed value) */}
                        {investment.investment_type.expected_return.return_type === 'normal_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean"
                                    value={investment.investment_type.expected_return.normal_value.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'mean', e.target.value,'expected_return')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={investment.investment_type.expected_return.normal_value.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'sd', e.target.value,'expected_return')}
                                />
                            </>
                        )}

                        {/* normal distribution (percentage) */}
                        {investment.investment_type.expected_return.return_type === 'normal_percentage' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean (%)"
                                    value={investment.investment_type.expected_return.normal_percentage.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_percentage', 'mean', e.target.value,'expected_return')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={investment.investment_type.expected_return.normal_percentage.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_percentage', 'sd', e.target.value,'expected_return')}
                                />
                                <span>%</span>
                            </>
                        )}

                        {/* GBM */}
                        {investment.investment_type.expected_return.return_type === 'gbm' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Drift (μ)"
                                    value={investment.investment_type.expected_return.gbm.mu}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'mu', e.target.value,'expected_return')}
                                />
                                <input
                                    type="number"
                                    placeholder="Volatility (σ)"
                                    value={investment.investment_type.expected_return.gbm.sigma}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'sigma', e.target.value,'expected_return')}
                                />
                                <input
                                    type="number"
                                    placeholder="Elapsed Time (Years)"
                                    value={investment.investment_type.expected_return.gbm.elapsed_time}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'elapsed_time', e.target.value,'expected_return')}
                                />
                                <span>Years</span>
                            </>
                        )}
                    </div>

                    {/* expected annual income */}
                    <div>
                        <label>Expected Annual Income:</label>
                        <select 
                            value={investment.investment_type.expected_income.return_type} 
                            onChange={(e) => handle_single_nested_update(index, 'expected_income', { return_type: e.target.value }, 'expected_income')}
                        >
                            <option value="fixed_value">Fixed Value</option>
                            <option value="fixed_percentage">Fixed Percentage</option>
                            <option value="normal_value">Fixed Value (Normal Distribution)</option>
                            <option value="normal_percentage">Percentage (Normal Distribution)</option>
                            <option value="gbm">Geometric Brownian Motion (GBM)</option>
                        </select>

                        {/* fixed Value (default) */}
                        {investment.investment_type.expected_income.return_type === 'fixed_value' && (
                            <input
                                type="number"
                                placeholder="Fixed Income Value"
                                value={investment.investment_type.expected_income.fixed_value}
                                onChange={(e) => handle_single_nested_update(index, 'fixed_value', e.target.value,'expected_income')}
                            />
                        )}

                        {/* fixed percentage */}
                        {investment.investment_type.expected_income.return_type === 'fixed_percentage' && (
                            <div>
                                <input
                                    type="number"
                                    placeholder="Income Percentage"
                                    value={investment.investment_type.expected_income.fixed_percentage}
                                    onChange={(e) => handle_single_nested_update(index, 'fixed_percentage', e.target.value,'expected_income')} 
                                />
                                <span>%</span>
                            </div>
                        )}

                        {/* normal distribution (fixed income) */}
                        {investment.investment_type.expected_income.return_type === 'normal_value' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean"
                                    value={investment.investment_type.expected_income.normal_value.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'mean', e.target.value,'expected_income')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={investment.investment_type.expected_income.normal_value.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_value', 'sd', e.target.value,'expected_income')}
                                />
                            </>
                        )}

                        {/* normal distribution (percentage) */}
                        {investment.investment_type.expected_income.return_type === 'normal_percentage' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Mean (%)"
                                    value={investment.investment_type.expected_income.normal_percentage.mean}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_percentage', 'mean', e.target.value,'expected_income')}
                                />
                                <input
                                    type="number"
                                    placeholder="Standard Deviation"
                                    value={investment.investment_type.expected_income.normal_percentage.sd}
                                    onChange={(e) => handle_double_nested_update(index, 'normal_percentage', 'sd', e.target.value,'expected_income')}
                                />
                                <span>%</span>
                            </>
                        )}

                        {/* GBM */}
                        {investment.investment_type.expected_income.return_type === 'gbm' && (
                            <>
                                <input
                                    type="number"
                                    placeholder="Drift (μ)"
                                    value={investment.investment_type.expected_income.gbm.mu}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'mu', e.target.value,'expected_income')}
                                />
                                <input
                                    type="number"
                                    placeholder="Volatility (σ)"
                                    value={investment.investment_type.expected_income.gbm.sigma}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'sigma', e.target.value,'expected_income')}
                                />
                                <input
                                    type="number"
                                    placeholder="Elapsed Time (Years)"
                                    value={investment.investment_type.expected_income.gbm.elapsed_time}
                                    onChange={(e) => handle_double_nested_update(index, 'gbm', 'elapsed_time', e.target.value,'expected_income')}
                                />
                                <span>Years</span>
                            </>
                        )}
                    </div>


                    {/* expense ratio */}
                    <div>
                        <label>Expense Ratio (%):</label>
                        <input
                            type="number"
                            placeholder="Expense Ratio"
                            value={investment.investment_type.expense_ratio}
                            onChange={(e) => handle_single_nested_update(index, 'expense_ratio', e.target.value)}
                        />
                    </div>

                    {/* value in dollars */}
                    <input 
                        type="number" 
                        placeholder="Value in dollars" 
                        value={investment.value} 
                        onChange={(e) => handle_investment_update(index, 'value', e.target.value)}
                    />


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
                                    onChange={(e) => handle_investment_update(index, "tax_status", e.target.value)}

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
                                    onChange={(e) => handle_investment_update(index, "tax_status", e.target.value)}

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
                                    onChange={(e) => handle_investment_update(index, "tax_status", e.target.value)}

                                />
                                After-Tax
                            </label>
                        </div>
                    </div>


                    {/* taxability section */}
                    <div>
                        <label>Taxability:</label>
                        <ul>
                            <li>
                                <label>
                                    <input
                                        type="radio"
                                        name={`taxability_${index}`}
                                        value="taxable"
                                        checked={investment.investment_type.taxability === "taxable"}
                                        onChange={(e) => handle_single_nested_update(index, "taxability", e.target.value)}
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
                                        onChange={(e) => handle_single_nested_update(index, "taxability", e.target.value)}
                                    />
                                    Tax-Exempt
                                </label>
                            </li>
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default Investment_form;
