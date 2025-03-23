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
  .then(async () => {
    console.log('Connected to MongoDB');
    await IncomeTax();
    await StandardDeduction();
    await CapitalGain();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });


// scenario model
const Scenario = require('./src/Schemas/Scenario');
const LifeExpectancy = require('./src/Schemas/LifeExpectancy');
const Investment = require('./src/Schemas/Investments');
const InvestmentType = require('./src/Schemas/InvestmentType');
const ExpectedReturn = require('./src/Schemas/ExpectedReturnOrIncome');
const ExpectedIncome = require('./src/Schemas/ExpectedReturnOrIncome');
const Inflation = require('./src/Schemas/Inflation');
const SimulationSettings = require('./src/Schemas/SimulationSettings');
const Event=require('./src/Schemas/EventSeries');
const StartYear=require('./src/Schemas/StartYear');
const Duration=require('./src/Schemas/Duration');
const Income=require('./src/Schemas/Income');
const Expense=require('./src/Schemas/Expense');
const Invest=require('./src/Schemas/Invest');
const Rebalance=require('./src/Schemas/Rebalance');
const ExpectedAnnualChange = require('./src/Schemas/ExpectedAnnualChange');
const Allocation=require('./src/Schemas/Allocation');

const SharedUser=require('./src/Schemas/SharedUser');
const IncomeTax = require('./src/TaxScraping/incomeTax');
const StandardDeduction = require('./src/TaxScraping/standardDeduction');
const CapitalGain = require('./src/TaxScraping/capitalGain');

// route to receive a scenario from frontend
app.post('/scenario', async (req, res) => {
  
    const { scenario_name, scenario_type, birth_year, spouse_birth_year,life_expectancy, spouse_life_expectancy,
        investments ,events, inflation_assumption, spending_strategies,expense_withdrawal_strategies,rmd_strategies,roth_conversion_strategies,
        roth_optimizer_enable,roth_optimizer_start_year,roth_optimizer_end_year,financial_goal, state_of_residence,shared_users
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
        

        // step 1: Create Expected Return
        const expected_return = await new ExpectedReturn({
            method: inv.investment_type.expected_return.return_type,
            fixed_value: inv.investment_type.expected_return.return_type === 'fixed_value' 
                ? inv.investment_type.expected_return.fixed_value 
                : null,
            fixed_percentage: inv.investment_type.expected_return.return_type === 'fixed_percentage' 
                ? inv.investment_type.expected_return.fixed_percentage 
                : null,
            normal_value: inv.investment_type.expected_return.return_type === 'normal_value' 
                ? inv.investment_type.expected_return.normal_value 
                : null,
            normal_percentage: inv.investment_type.expected_return.return_type === 'normal_percentage' 
                ? inv.investment_type.expected_return.normal_percentage 
                : null,
        }).save();


        // step 2: Create Expected Income
        const expected_income = await new ExpectedIncome({
            method: inv.investment_type.expected_income.return_type,
            fixed_value: inv.investment_type.expected_income.return_type === 'fixed_value' 
                ? inv.investment_type.expected_income.fixed_value 
                : null,
            fixed_percentage: inv.investment_type.expected_income.return_type === 'fixed_percentage' 
                ? inv.investment_type.expected_income.fixed_percentage 
                : null,
            normal_value: inv.investment_type.expected_income.return_type === 'normal_value' 
                ? inv.investment_type.expected_income.normal_value 
                : null,
            normal_percentage: inv.investment_type.expected_income.return_type === 'normal_percentage' 
                ? inv.investment_type.expected_income.normal_percentage 
                : null,
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



    //create events
    const event_ids = await Promise.all(events.map(async eve => {

        const start_year = await new StartYear({
            method: eve.start_year.return_type,
            fixed_value: eve.start_year.return_type === 'fixed_value' 
                ? eve.start_year.fixed_value 
                : null,
            normal_value: eve.start_year.return_type === 'normal_value' 
                ? eve.start_year.normal_value 
                : null,
            uniform_value: eve.start_year.return_type === 'uniform_value' 
                ? eve.start_year.uniform_value 
                : null,
            same_year_as_another_event: eve.start_year.return_type === 'same_year_as_another_event' 
                ? eve.start_year.same_year_as_another_event 
                : null,
            year_after_another_event_end: eve.start_year.return_type === 'year_after_another_event_end' 
                ? eve.start_year.year_after_another_event_end 
                : null,
        }).save();


        const duration_obj = await new Duration({
            method: eve.duration.return_type,
            fixed_value: eve.duration.return_type === 'fixed_value' 
                ? eve.duration.fixed_value 
                : null,
            normal_value: eve.duration.return_type === 'normal_value' 
                ? eve.duration.normal_value 
                : null,
            uniform_value: eve.duration.return_type === 'uniform_value' 
                ? eve.duration.uniform_value 
                : null,
        }).save();


        // default all objects to null
        let income_obj = null;
        let expense_obj = null;
        let invest_obj = null;
        let rebalance_obj = null;

        if(eve.event_type==="income"){
            const expected_annual_change_for_income = await new ExpectedAnnualChange({
                method: eve.income.expected_annual_change.return_type,
                fixed_value: eve.income.expected_annual_change.return_type === 'fixed_value' 
                    ? eve.income.expected_annual_change.fixed_value 
                    : null,
                fixed_percentage: eve.income.expected_annual_change.return_type === 'fixed_percentage' 
                    ? eve.income.expected_annual_change.fixed_percentage 
                    : null,
                normal_value: eve.income.expected_annual_change.return_type === 'normal_value' 
                    ? eve.income.expected_annual_change.normal_value 
                    : null,
                normal_percentage: eve.income.expected_annual_change.return_type === 'normal_percentage' 
                    ? eve.income.expected_annual_change.normal_percentage 
                    : null,
                uniform_value: eve.income.expected_annual_change.return_type === 'uniform_value' 
                    ? eve.income.expected_annual_change.uniform_value 
                    : null,
                uniform_percentage: eve.income.expected_annual_change.return_type === 'uniform_percentage' 
                    ? eve.income.expected_annual_change.uniform_percentage 
                    : null,
            }).save();
            


            income_obj = await new Income({
                initial_amount: eve.income.initial_amount,
                expected_annual_change: expected_annual_change_for_income.id,
                inflation_adjustment: eve.income.inflation_adjustment,
                married_percentage: eve.income.married_percentage,
                is_social_security: eve.income.is_social_security
    
            }).save()

        }else if(eve.event_type==="expense"){
            const expected_annual_change_for_expense = await new ExpectedAnnualChange({
                method: eve.expense.expected_annual_change.return_type,
                fixed_value: eve.expense.expected_annual_change.return_type === 'fixed_value' 
                    ? eve.expense.expected_annual_change.fixed_value 
                    : null,
                fixed_percentage: eve.expense.expected_annual_change.return_type === 'fixed_percentage' 
                    ? eve.expense.expected_annual_change.fixed_percentage 
                    : null,
                normal_value: eve.expense.expected_annual_change.return_type === 'normal_value' 
                    ? eve.expense.expected_annual_change.normal_value 
                    : null,
                normal_percentage: eve.expense.expected_annual_change.return_type === 'normal_percentage' 
                    ? eve.expense.expected_annual_change.normal_percentage 
                    : null,
                uniform_value: eve.expense.expected_annual_change.return_type === 'uniform_value' 
                    ? eve.expense.expected_annual_change.uniform_value 
                    : null,
                uniform_percentage: eve.expense.expected_annual_change.return_type === 'uniform_percentage' 
                    ? eve.expense.expected_annual_change.uniform_percentage 
                    : null,
            }).save();
            

            expense_obj =await  new Expense({
                initial_amount: eve.expense.initial_amount,
                expected_annual_change: expected_annual_change_for_expense.id,
                inflation_adjustment: eve.expense.inflation_adjustment,
                married_percentage: eve.expense.married_percentage,
                is_discretionary: eve.expense.is_discretionary
    
            }).save()

        }else if(eve.event_type==="invest"){

            const invest_allocation = await new Allocation({
                method: eve.invest.return_type,
                fixed_allocation: eve.invest.return_type === 'fixed_allocation' && eve.invest.fixed_allocation
                    ? eve.invest.fixed_allocation.split(';').map(s => s.trim()).filter(s => s)
                    : [],
                glide_path: eve.invest.return_type === 'glide_path' && eve.invest.glide_path
                    ? eve.invest.glide_path.split(';').map(s => s.trim()).filter(s => s)
                    : []
            }).save();
            
    
            invest_obj =await  new Invest({
                allocations: invest_allocation.id,
                maximum_cash : eve.invest.maximum_cash
    
            }).save()
            
        }else if(eve.event_type==="rebalance"){
            const rebalance_allocation = await new Allocation({
                method: eve.rebalance.return_type,
                fixed_allocation: eve.rebalance.return_type === 'fixed_allocation' && eve.rebalance.fixed_allocation
                    ? eve.rebalance.fixed_allocation.split(';').map(s => s.trim()).filter(s => s)
                    : [],
                glide_path: eve.rebalance.return_type === 'glide_path' && eve.rebalance.glide_path
                    ? eve.rebalance.glide_path.split(';').map(s => s.trim()).filter(s => s)
                    : []
            }).save();
            
    
            rebalance_obj =await  new Rebalance({
                allocations: rebalance_allocation.id,
            }).save()
        }       



        const event = await new Event({
            name: eve.name,
            description: eve.description,
            startYear: start_year.id,
            duration: duration_obj.id,
            type: eve.event_type,
            income: income_obj ? income_obj.id : null,
            expense: expense_obj ? expense_obj.id : null,
            invest: invest_obj ? invest_obj.id : null,
            rebalance: rebalance_obj ? rebalance_obj.id : null

        }).save();
        return event._id;
    }));
    
    //create inflation object
    // Create and save Inflation object
    const inflation = new Inflation({
        method: inflation_assumption.method,
        fixed_percentage: inflation_assumption.fixed_percentage,
        normal_percentage: inflation_assumption.normal_percentage,
        uniform_percentage: inflation_assumption.uniform_percentage
    });

    await inflation.save();

    //simulation setting
    const simulation_settings = new SimulationSettings({
        inflationAssumption: inflation._id,
        spendingStrategies: spending_strategies,
        expenseWithdrawalStrategies: expense_withdrawal_strategies,
        rmdStrategies: rmd_strategies,
        rothConversionStrategies: roth_conversion_strategies,
        rothOptimizerEnable: roth_optimizer_enable,
        rothOptimizerStartYear: roth_optimizer_start_year,
        rothOptimizerEndYear: roth_optimizer_end_year
    });
    
    await simulation_settings.save();

    //share setting

    let shared_users_list = []; // array to store SharedUser objects

    if (shared_users && shared_users.length > 0) {
        // create and store SharedUser objects
        shared_users_list = await Promise.all(shared_users.map(async user => {
            const shared_user = new SharedUser(user);
            await shared_user.save();
            return shared_user._id; 
        }));
    }



    const new_scenario = new Scenario({
        name: scenario_name,
        scenarioType: scenario_type,
        birthYear: birth_year,
        spouseBirthYear: spouse_birth_year, 
        lifeExpectancy: user_life_expectancy, 
        spouseLifeExpectancy: spousal_life_expectancy ? spousal_life_expectancy._id : null,
        investments: investment_ids,
        events: event_ids,
        simulationSettings: simulation_settings._id,
        financialGoal: financial_goal,
        stateOfResidence: state_of_residence,
        sharedUsers: shared_users_list

    });
    await new_scenario.save();
  
  
});

// // start server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
