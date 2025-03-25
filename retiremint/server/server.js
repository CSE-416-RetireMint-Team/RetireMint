const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


// initialize app
const app = express();
const port = 8000;

// middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://accounts.google.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// connect to MongoDB database 
mongoose.connect('mongodb://localhost:27017/retiremint')
  .then(async () => {
    console.log('MongoDB connected.');
    // Seed default tax data if needed
    await seedDefaultTaxData();
    await IncomeTax();
    await StandardDeduction();
    await CapitalGain();
    // Create 'logs' directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));


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
const User = require('./src/Schemas/Users');
const SharedUser=require('./src/Schemas/SharedUser');
const Report = require('./src/Schemas/Report'); // Add Report schema
const IncomeTax = require('./src/FederalTaxes/incomeTax');
const StandardDeduction = require('./src/FederalTaxes/standardDeduction');
const CapitalGain = require('./src/FederalTaxes/capitalGain');
const {OAuth2Client} = require('google-auth-library');
const userRoutes = require('./src/Routes/User'); 
const simulationRoutes = require('./src/Routes/Simulation'); // Add simulation routes
const TaxData = require('./src/Schemas/TaxData');

app.use('/user', userRoutes);
app.use('/simulation', simulationRoutes); // Add simulation routes

// Test route to verify MongoDB connection and User model
app.get('/api/test-db', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    let dbStatus;
    
    switch (dbState) {
      case 0:
        dbStatus = 'Disconnected';
        break;
      case 1:
        dbStatus = 'Connected';
        break;
      case 2:
        dbStatus = 'Connecting';
        break;
      case 3:
        dbStatus = 'Disconnecting';
        break;
      default:
        dbStatus = 'Unknown';
    }
    
    // Test User model
    const userCount = await User.countDocuments();
    
    return res.status(200).json({
      status: 'success',
      message: 'Database connection test successful',
      dbStatus,
      userCollection: {
        count: userCount,
        modelExists: !!User
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

app.post('/login',async function(req,res){
    console.log('Login request received:', req.body);
    const CLIENT_ID = req.body.clientId;
    const token = req.body.credential;
    
    if (!token || !CLIENT_ID) {
        console.error('Missing token or client ID');
        return res.status(400).json({ error: 'Missing token or client ID' });
    }
    
    const client = new OAuth2Client();

    try {
        console.log('Verifying token with Google...');
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
    
        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];
        const picture = payload['picture'];
    
        console.log(`User authenticated: ${email} (${googleId})`);
        
        let user = await User.findOne({ googleId });

        let isFirstLogin = false;
        if (!user) {
            isFirstLogin = true;
            console.log(`Creating new user: ${email}`);
            user = new User({
                googleId,
                email,
                name,
                picture,
            });
            await user.save();
            console.log('New user created with ID:', user._id);
        } else {
            console.log(`Existing user logged in: ${email}`);
            // Update user info in case it changed
            user.name = name;
            user.picture = picture;
            await user.save();
            console.log('User data updated, ID:', user._id);
        }
        
        // Send response
        const responseData = { 
            userId: user._id.toString(),
            isFirstTime: isFirstLogin,
            name: user.name,
            email: user.email
        };
        
        console.log('Sending login response:', responseData);
        return res.status(200).json(responseData);
    } catch (err) {
        console.error('Google authentication failed:', err);
        return res.status(401).json({ error: 'Authentication failed', details: err.message });
    }
});

// route to receive a scenario from frontend
app.post('/scenario', async (req, res) => {
    console.log('Scenario received!');
  
    const { 
        scenario_name, 
        scenario_type, 
        birth_year, 
        spouse_birth_year,
        life_expectancy, 
        spouse_life_expectancy,
        investments,
        events, 
        inflation_assumption, 
        spending_strategies,
        expense_withdrawal_strategies,
        rmd_strategies,
        roth_conversion_strategies,
        roth_optimizer_enable,
        roth_optimizer_start_year,
        roth_optimizer_end_year,
        financial_goal, 
        state_of_residence,
        shared_users,
        userId  // Add userId to the extracted parameters
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
        userId: userId, // Add userId to the new scenario
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
    
    try {
        await new_scenario.save();
        console.log('Scenario saved successfully with ID:', new_scenario._id);
        
        // Return the scenario ID to the client
        res.status(201).json({
            success: true,
            message: 'Scenario created successfully',
            scenarioId: new_scenario._id
        });
    } catch (error) {
        console.error('Error saving scenario:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save scenario',
            details: error.message
        });
    }
});

// Function to seed default tax data if none exists
async function seedDefaultTaxData() {
  try {
    // Check if tax data already exists
    const existingTaxData = await TaxData.findOne();
    
    if (!existingTaxData) {
      console.log('No tax data found. Creating default tax data...');
      
      const currentYear = new Date().getFullYear();
      
      // Create default tax data for the current year
      const defaultTaxData = new TaxData({
        taxYear: currentYear,
        federal: {
          brackets: [
            { min: 0, max: 10275, rate: 0.10 },
            { min: 10275, max: 41775, rate: 0.12 },
            { min: 41775, max: 89075, rate: 0.22 },
            { min: 89075, max: 170050, rate: 0.24 },
            { min: 170050, max: 215950, rate: 0.32 },
            { min: 215950, max: 539900, rate: 0.35 },
            { min: 539900, max: Number.MAX_VALUE, rate: 0.37 }
          ],
          standardDeductions: {
            single: 12950,
            married: 25900
          },
          capitalGains: {
            thresholds: [40400, 445850],
            rates: [0, 0.15, 0.20]
          },
          socialSecurity: [
            { min: 0, max: 25000, taxablePercentage: 0 },
            { min: 25000, max: 34000, taxablePercentage: 0.5 },
            { min: 34000, max: Number.MAX_VALUE, taxablePercentage: 0.85 }
          ]
        },
        state: new Map([
          ["NY", {
            brackets: [
              { min: 0, max: 8500, rate: 0.04 },
              { min: 8500, max: 11700, rate: 0.045 },
              { min: 11700, max: 13900, rate: 0.0525 },
              { min: 13900, max: 80650, rate: 0.055 },
              { min: 80650, max: 215400, rate: 0.0633 },
              { min: 215400, max: 1077550, rate: 0.0685 },
              { min: 1077550, max: Number.MAX_VALUE, rate: 0.0882 }
            ],
            standardDeduction: 8000
          }],
          ["CA", {
            brackets: [
              { min: 0, max: 9325, rate: 0.01 },
              { min: 9325, max: 22107, rate: 0.02 },
              { min: 22107, max: 34892, rate: 0.04 },
              { min: 34892, max: 48435, rate: 0.06 },
              { min: 48435, max: 61214, rate: 0.08 },
              { min: 61214, max: 312686, rate: 0.093 },
              { min: 312686, max: 375221, rate: 0.103 },
              { min: 375221, max: 625369, rate: 0.113 },
              { min: 625369, max: Number.MAX_VALUE, rate: 0.123 }
            ],
            standardDeduction: 4803
          }],
          ["TX", {
            brackets: [
              { min: 0, max: Number.MAX_VALUE, rate: 0 }
            ],
            standardDeduction: 0
          }]
        ]),
        rmdTable: [
          { 72: 25.6, 73: 24.7, 74: 23.8, 75: 22.9, 76: 22.0, 77: 21.2, 78: 20.3, 79: 19.5, 80: 18.7 },
          { 81: 17.9, 82: 17.1, 83: 16.3, 84: 15.5, 85: 14.8, 86: 14.1, 87: 13.4, 88: 12.7, 89: 12.0, 90: 11.4 },
          { 91: 10.8, 92: 10.2, 93: 9.6, 94: 9.1, 95: 8.6, 96: 8.1, 97: 7.6, 98: 7.1, 99: 6.7, 100: 6.3 }
        ]
      });
      
      await defaultTaxData.save();
      console.log('Default tax data created successfully!');
    } else {
      console.log('Tax data already exists, no need to seed.');
    }
  } catch (error) {
    console.error('Error seeding default tax data:', error);
  }
}

