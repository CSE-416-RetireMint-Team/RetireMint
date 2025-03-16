const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// initialize app
const app = express();
const port = 8000;

// middleware
app.use(cors());
app.use(express.json());

// connect to MongoDB database 
mongoose.connect('mongodb://127.0.0.1:27017/retiremint')
  .then(() => console.log('Connected to MongoDB')) 
  .catch(err => console.error('MongoDB connection error:', err));

// scenario model
const Scenario = require('./src/Schemas/Scenario');
const LifeExpectancy = require('./src/Schemas/LifeExpectancy');
const Investment = require('./src/Schemas/Investments');
const InvestmentType = require('./src/Schemas/InvestmentType');
const ExpectedReturn = require('./src/Schemas/ExpectedReturnOrIncome');
const ExpectedIncome = require('./src/Schemas/ExpectedReturnOrIncome');


// route to receive a scenario from frontend
app.post('/scenario', async (req, res) => {
  
    const { scenario_name, scenario_type, birth_year, spouse_birth_year,life_expectancy, spouse_life_expectancy,
        investments 
    } = req.body; // extracting data from frontend

    // extract values from life_expectancy list
    const [life_expectancy_method, fixed_value, normal_distribution] = life_expectancy;

    // create and save user life expectancy
    const user_life_expectancy = new LifeExpectancy({
        life_expectancy_method,
        fixed_value,
        normal_distribution
    });

    await user_life_expectancy.save();
    
    // now check for spouse 

    let spousal_life_expectancy = null;

    // check if spouse life expectancy exists and extract values
    if (scenario_type === 'married' && spouse_life_expectancy !== null) {
        const [spouse_life_expectancy_method, spouse_fixed_value, spouse_normal_distribution] = spouse_life_expectancy;

        spousal_life_expectancy = new LifeExpectancy({
            life_expectancy_method: spouse_life_expectancy_method,
            fixed_value: spouse_fixed_value,
            normal_distribution: spouse_normal_distribution
        });

        await spousal_life_expectancy.save();
    }

    // process investments from bottom-up
    
    const investment_ids = await Promise.all(investments.map(async inv => {
        
        // step 1: create Expected Return
        const expected_return = await new ExpectedReturn({
            method: inv.investment_type.expected_return.return_type,
            fixed_value: inv.investment_type.expected_return.fixed_value,
            fixed_percentage: inv.investment_type.expected_return.fixed_percentage,
            normal_value: inv.investment_type.expected_return.normal_value,
            normal_percentage: inv.investment_type.expected_return.normal_percentage,
            gbm: inv.investment_type.expected_return.gbm
        }).save();

        // step 2: create Expected Income
        const expected_income = await new ExpectedIncome({
            method: inv.investment_type.expected_income.return_type,
            fixed_value: inv.investment_type.expected_income.fixed_value,
            fixed_percentage: inv.investment_type.expected_income.fixed_percentage,
            normal_value: inv.investment_type.expected_income.normal_value,
            normal_percentage: inv.investment_type.expected_income.normal_percentage,
            gbm: inv.investment_type.expected_income.gbm
        }).save();

        //step 3: create investment_type
       
        const investment_type = await new InvestmentType({
            name: inv.investment_type.name,
            description: inv.investment_type.description,
            expectedAnnualReturn: expected_return._id,
            expectedAnnualIncome: expected_income._id,
            expenseRatio: inv.investment_type.expense_ratio,
            taxability: inv.investment_type.taxability
        }).save();
    
    
        // step 4 create investment

        const investment = await new Investment({
            investmentType: investment_type._id,
            value: inv.value,
            accountTaxStatus: inv.tax_status
        }).save();

        return investment._id;
        
    
        
    }));
    



    const new_scenario = new Scenario({
        name: scenario_name,
        scenarioType: scenario_type,
        birthYear: birth_year,
        spouseBirthYear: spouse_birth_year, 
        lifeExpectancy: user_life_expectancy ? user_life_expectancy._id : null, 
        spouseLifeExpectancy: spousal_life_expectancy ? spousal_life_expectancy._id : null,
        investments: investment_ids

    });
    await new_scenario.save();
  
  
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
