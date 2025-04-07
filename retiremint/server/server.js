const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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
    const clientId = req.body.clientId;
    const token = req.body.credential;
    
    if (!token || !clientId) {
        console.error('Missing token or client ID');
        return res.status(400).json({ error: 'Missing token or client ID' });
    }
    
    const client = new OAuth2Client();

    try {
        console.log('Verifying token with Google...');
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
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
        scenarioIdEdit, // Only utilized if editing existing scenario. If new, an ID will be assigned to it.
        scenarioName, 
        scenarioType, 
        birthYear, 
        spouseBirthYear,
        lifeExpectancy, 
        spouseLifeExpectancy,
        investments,
        events, 
        inflationAssumption, 
        spendingStrategies,
        expenseWithdrawalStrategies,
        rmdStrategies,
        rothConversionStrategies,
        rothOptimizerEnable,
        rothOptimizerStartYear,
        rothOptimizerEndYear,
        financialGoal, 
        stateOfResidence,
        sharedUsers,
        userId  // Add userId to the extracted parameters
    } = req.body; // extracting data from frontend

    // open existing scenario if an edit is being attempted
    let existingScenario;
    if (scenarioIdEdit) {
        try {
            existingScenario = await Scenario.findById(scenarioIdEdit);
            if (!existingScenario) {
                return (res.status(404).json({ error : 'Scenario to be edited not Found'}))
            }
        }
        catch (error) {
            res.status(500).json({ error: 'Error fetching scenario' });
        }
    }
    // Delete Investments/Events and any items from other schemas inside that are to be replaced. (Reasoning: The new version may have more/less Investments or Events than the original, may not be 1:1 update)
    
    if (existingScenario) {
        try {
            let existingInvestment;
            for (i = 0; i < existingScenario.investments.length; i++) {
                existingInvestment = await Investment.findById(existingScenario.investments[i]);
                let existingInvestmentType = await InvestmentType.findById(existingInvestment.investmentType);
                await ExpectedReturn.findByIdAndDelete(existingInvestmentType.expectedAnnualReturn);
                await ExpectedIncome.findByIdAndDelete(existingInvestmentType.expectedAnnualIncome);
                await InvestmentType.findByIdAndDelete(existingInvestment.investmentType);
                await Investment.findByIdAndDelete(existingScenario.investments[i]);
            }
            let existingEvent;
            for (i = 0; i < existingScenario.events.length; i++) {
                existingEvent = await Event.findById(existingScenario.events[i]);
                await StartYear.findByIdAndDelete(existingEvent.startYear);
                await Duration.findByIdAndDelete(existingEvent.duration);
                let income = await Income.findById(existingEvent.income);
                if (income) {
                    await ExpectedAnnualChange.findByIdAndDelete(income.expectedAnnualChange);
                    await Income.findByIdAndDelete(existingEvent.income);
                }
                let expense = await Expense.findById(existingEvent.expense);
                if (expense) {
                    await ExpectedAnnualChange.findByIdAndDelete(expense.expectedAnnualChange);
                    await Expense.findByIdAndDelete(existingEvent.expense);
                }
                await Invest.findByIdAndDelete(existingEvent.invest);
                await Rebalance.findByIdAndDelete(existingEvent.rebalance);
                await Event.findByIdAndDelete(existingScenario.events[i]);
            }
        }
        catch (error) {
            res.status(500).json({ error: 'Error deleting items from other schemas' });
        }
    }
    


    // extract values from lifeExpectancy list
    const [lifeExpectancyMethod, fixedValue, normalDistribution] = lifeExpectancy;

    // create and save user life expectancy
    // If this is a new scenario, save instead of updating.
    let userLifeExpectancy;
    if (!existingScenario) {
        userLifeExpectancy = new LifeExpectancy({
            lifeExpectancyMethod,
            fixedValue,
            normalDistribution
        });
        await userLifeExpectancy.save();
    }
    else {
        try {
            userLifeExpectancy = await LifeExpectancy.findByIdAndUpdate(existingScenario.lifeExpectancy, {lifeExpectancyMethod: lifeExpectancyMethod , fixedValue: fixedValue, normalDistribution: normalDistribution}, {new: true});
        }
        catch (error) {
            res.status(500).json({ error: 'Error updating User Life Expectancy' });
        }
    }    
    // now check for spouse 
    let spousalLifeExpectancy = null;
    // check if spouse life expectancy exists and extract values
    if (scenarioType === 'married' && spouseLifeExpectancy !== null) {
        const [spouseLifeExpectancyMethod, spouseFixedValue, spouseNormalDistribution] = spouseLifeExpectancy;

        spousalLifeExpectancy = new LifeExpectancy({
            lifeExpectancyMethod: spouseLifeExpectancyMethod,
            fixedValue: spouseFixedValue,
            normalDistribution: spouseNormalDistribution
        });
        // If this is a new scenario, save instead of updating.
        if (!existingScenario) {
            await spouseLifeExpectancy.save();
        }   
        else {
            try {
                await LifeExpectancy.findByIdAndUpdate(existingScenario.spouseLifeExpectancy, userLifeExpectancy, {new: true});
            }
            catch (error) {
                res.status(500).json({ error: 'Error updating Spouse Life Expectancy' });
            }
        } 
    }

    // process investments from bottom-up

    
    const investmentIds = await Promise.all(investments.map(async inv => {
        
        // step 1: Create Expected Return
        const expectedReturnInstance = new ExpectedReturn({
            method: inv.investmentType.expectedReturn.returnType,
            fixedValue: inv.investmentType.expectedReturn.returnType === 'fixedValue' 
                ? inv.investmentType.expectedReturn.fixedValue 
                : null,
            fixedPercentage: inv.investmentType.expectedReturn.returnType === 'fixedPercentage' 
                ? inv.investmentType.expectedReturn.fixedPercentage 
                : null,
            normalValue: inv.investmentType.expectedReturn.returnType === 'normalValue' 
                ? inv.investmentType.expectedReturn.normalValue 
                : null,
            normalPercentage: inv.investmentType.expectedReturn.returnType === 'normalPercentage' 
                ? inv.investmentType.expectedReturn.normalPercentage 
                : null,
        });
        let expectedReturn;
        // Whether this is a new scenario or an edit, save as new instead of updating since any original is deleted.
        expectedReturn = await expectedReturnInstance.save();

        // step 2: Create Expected Income
        let expectedIncome = new ExpectedIncome({
            method: inv.investmentType.expectedIncome.returnType,
            fixedValue: inv.investmentType.expectedIncome.returnType === 'fixedValue' 
                ? inv.investmentType.expectedIncome.fixedValue 
                : null,
            fixedPercentage: inv.investmentType.expectedIncome.returnType === 'fixedPercentage' 
                ? inv.investmentType.expectedIncome.fixedPercentage 
                : null,
            normalValue: inv.investmentType.expectedIncome.returnType === 'normalValue' 
                ? inv.investmentType.expectedIncome.normalValue 
                : null,
            normalPercentage: inv.investmentType.expectedIncome.returnType === 'normalPercentage' 
                ? inv.investmentType.expectedIncome.normalPercentage 
                : null,
        })
        expectedIncome.save();

        //step 3: create investmentType
       
        const investmentType = new InvestmentType({
            name: inv.investmentType.name,
            description: inv.investmentType.description,
            expectedAnnualReturn: expectedReturn._id,
            expectedAnnualIncome: expectedIncome._id,
            expenseRatio: inv.investmentType.expenseRatio,
            taxability: inv.investmentType.taxability
        });
        investmentType.save();
    
    
        // step 4 create investment

        const investment = await new Investment({
            investmentType: investmentType._id,
            value: inv.value,
            accountTaxStatus: inv.taxStatus
        }).save();

        return investment._id;
    }));



    //create events
    const eventIds = await Promise.all(events.map(async eve => {

        const startYear = await new StartYear({
            method: eve.startYear.returnType,
            fixedValue: eve.startYear.returnType === 'fixedValue' 
                ? eve.startYear.fixedValue 
                : null,
            normalValue: eve.startYear.returnType === 'normalValue' 
                ? eve.startYear.normalValue 
                : null,
            uniformValue: eve.startYear.returnType === 'uniformValue' 
                ? eve.startYear.uniformValue 
                : null,
            sameYearAsAnotherEvent: eve.startYear.returnType === 'sameYearAsAnotherEvent' 
                ? eve.startYear.sameYearAsAnotherEvent 
                : null,
            yearAfterAnotherEventEnd: eve.startYear.returnType === 'yearAfterAnotherEventEnd' 
                ? eve.startYear.yearAfterAnotherEventEnd 
                : null,
        }).save();


        const durationObj = await new Duration({
            method: eve.duration.returnType,
            fixedValue: eve.duration.returnType === 'fixedValue' 
                ? eve.duration.fixedValue 
                : null,
            normalValue: eve.duration.returnType === 'normalValue' 
                ? eve.duration.normalValue 
                : null,
            uniformValue: eve.duration.returnType === 'uniformValue' 
                ? eve.duration.uniformValue 
                : null,
        }).save();


        // default all objects to null
        let incomeObj = null;
        let expenseObj = null;
        let investObj = null;
        let rebalanceObj = null;

        if(eve.eventType==="income"){
            const expectedAnnualChangeForIncome = await new ExpectedAnnualChange({
                method: eve.income.expectedAnnualChange.returnType,
                fixedValue: eve.income.expectedAnnualChange.returnType === 'fixedValue' 
                    ? eve.income.expectedAnnualChange.fixedValue 
                    : null,
                fixedPercentage: eve.income.expectedAnnualChange.returnType === 'fixedPercentage' 
                    ? eve.income.expectedAnnualChange.fixedPercentage 
                    : null,
                normalValue: eve.income.expectedAnnualChange.returnType === 'normalValue' 
                    ? eve.income.expectedAnnualChange.normalValue 
                    : null,
                normalPercentage: eve.income.expectedAnnualChange.returnType === 'normalPercentage' 
                    ? eve.income.expectedAnnualChange.normalPercentage 
                    : null,
                uniformValue: eve.income.expectedAnnualChange.returnType === 'uniformValue' 
                    ? eve.income.expectedAnnualChange.uniformValue 
                    : null,
                uniformPercentage: eve.income.expectedAnnualChange.returnType === 'uniformPercentage' 
                    ? eve.income.expectedAnnualChange.uniformPercentage 
                    : null,
            }).save();
            


            incomeObj = await new Income({
                initialAmount: eve.income.initialAmount,
                expectedAnnualChange: expectedAnnualChangeForIncome.id,
                inflationAdjustment: eve.income.inflationAdjustment,
                marriedPercentage: eve.income.marriedPercentage,
                isSocialSecurity: eve.income.isSocialSecurity
    
            }).save()

        }else if(eve.eventType==="expense"){
            const expectedAnnualChangeForExpense = await new ExpectedAnnualChange({
                method: eve.expense.expectedAnnualChange.returnType,
                fixedValue: eve.expense.expectedAnnualChange.returnType === 'fixedValue' 
                    ? eve.expense.expectedAnnualChange.fixedValue 
                    : null,
                fixedPercentage: eve.expense.expectedAnnualChange.returnType === 'fixedPercentage' 
                    ? eve.expense.expectedAnnualChange.fixedPercentage 
                    : null,
                normalValue: eve.expense.expectedAnnualChange.returnType === 'normalValue' 
                    ? eve.expense.expectedAnnualChange.normalValue 
                    : null,
                normalPercentage: eve.expense.expectedAnnualChange.returnType === 'normalPercentage' 
                    ? eve.expense.expectedAnnualChange.normalPercentage 
                    : null,
                uniformValue: eve.expense.expectedAnnualChange.returnType === 'uniformValue' 
                    ? eve.expense.expectedAnnualChange.uniformValue 
                    : null,
                uniformPercentage: eve.expense.expectedAnnualChange.returnType === 'uniformPercentage' 
                    ? eve.expense.expectedAnnualChange.uniformPercentage 
                    : null,
            }).save();
            

            expenseObj =await  new Expense({
                initialAmount: eve.expense.initialAmount,
                expectedAnnualChange: expectedAnnualChangeForExpense.id,
                inflationAdjustment: eve.expense.inflationAdjustment,
                marriedPercentage: eve.expense.marriedPercentage,
                isDiscretionary: eve.expense.isDiscretionary
    
            }).save()

        }else if(eve.eventType==="invest"){

            const investAllocation = await new Allocation({
                method: eve.invest.returnType,
                fixedAllocation: eve.invest.returnType === 'fixedAllocation' && eve.invest.fixedAllocation
                    ? eve.invest.fixedAllocation.split(';').map(s => s.trim()).filter(s => s)
                    : [],
                glidePath: eve.invest.returnType === 'glidePath' && eve.invest.glidePath
                    ? eve.invest.glidePath.split(';').map(s => s.trim()).filter(s => s)
                    : []
            }).save();
            
    
            investObj =await  new Invest({
                allocations: investAllocation.id,
                maximumCash : eve.invest.maximumCash
    
            }).save()
            
        }else if(eve.eventType==="rebalance"){
            const rebalanceAllocation = await new Allocation({
                method: eve.rebalance.returnType,
                fixedAllocation: eve.rebalance.returnType === 'fixedAllocation' && eve.rebalance.fixedAllocation
                    ? eve.rebalance.fixedAllocation.split(';').map(s => s.trim()).filter(s => s)
                    : [],
                glidePath: eve.rebalance.returnType === 'glidePath' && eve.rebalance.glidePath
                    ? eve.rebalance.glidePath.split(';').map(s => s.trim()).filter(s => s)
                    : []
            }).save();
            
    
            rebalanceObj =await  new Rebalance({
                allocations: rebalanceAllocation.id,
            }).save()
        }       



        const event = await new Event({
            name: eve.name,
            description: eve.description,
            startYear: startYear.id,
            duration: durationObj.id,
            type: eve.eventType,
            income: incomeObj ? incomeObj.id : null,
            expense: expenseObj ? expenseObj.id : null,
            invest: investObj ? investObj.id : null,
            rebalance: rebalanceObj ? rebalanceObj.id : null

        }).save();
        return event._id;
    }));
    
    //create inflation object
    // Create and save Inflation object
    let existingSimulationSettings;
    if (existingScenario) {
        try {
            existingSimulationSettings = await SimulationSettings.findById(existingScenario.simulationSettings);
        }
        catch (error) {
            res.status(500).json({ error: 'Error fetching original simulation settings.' });
        }
    }
    let inflation;
    if (!existingSimulationSettings) {
         inflation = new Inflation({
            method: inflationAssumption.method,
            fixedPercentage: inflationAssumption.fixedPercentage,
            normalPercentage: inflationAssumption.normalPercentage,
            uniformPercentage: inflationAssumption.uniformPercentage
        });
        await inflation.save();
    }
    else {
        inflation = await Inflation.findByIdAndUpdate(existingSimulationSettings.inflation, inflation, {new: true});
    }

    //simulation setting
    let simulationSettings;
    if (!existingSimulationSettings) {
        simulationSettings = new SimulationSettings({
            inflationAssumption: inflation._id,
            spendingStrategies: spendingStrategies,
            expenseWithdrawalStrategies: expenseWithdrawalStrategies,
            rmdStrategies: rmdStrategies,
            rothConversionStrategies: rothConversionStrategies,
            rothOptimizerEnable: rothOptimizerEnable,
            rothOptimizerStartYear: rothOptimizerStartYear,
            rothOptimizerEndYear: rothOptimizerEndYear
        });
        await simulationSettings.save();
    }
    else {
        simulationSettings = await SimulationSettings.findByIdAndUpdate(existingSimulationSettings._id, simulationSettings, {new: true});
    }

    //share setting

    let sharedUsersList = []; // array to store SharedUser objects
    if (sharedUsers && sharedUsers.length > 0) {
        // create and store SharedUser objects
        sharedUsersList = await Promise.all(sharedUsers.map(async user => {
            const sharedUser = new SharedUser(user);
            await sharedUser.save();
            return sharedUser._id; 
        }));
    }
    
    try {
        if (!existingScenario) {
            const newScenario = new Scenario({
                name: scenarioName,
                userId: userId, // Add userId to the new scenario
                scenarioType: scenarioType, 
                birthYear: birthYear,
                spouseBirthYear: spouseBirthYear, 
                lifeExpectancy: userLifeExpectancy, 
                spouseLifeExpectancy: spousalLifeExpectancy ? spousalLifeExpectancy._id : null,
                investments: investmentIds,
                events: eventIds,
                simulationSettings: simulationSettings._id,
                financialGoal: financialGoal,
                stateOfResidence: stateOfResidence,
                sharedUsers: sharedUsersList
            });
            await newScenario.save();
            console.log('Scenario saved successfully with ID:', newScenario._id);    
            // Return the scenario ID to the client
            res.status(201).json({
                success: true,
                message: 'Scenario created successfully',
                scenarioId: newScenario._id
            });
        }
        else {
            await Scenario.findByIdAndUpdate(existingScenario._id, {
                name: scenarioName,
                userId: userId, // Add userId to the new scenario
                scenarioType: scenarioType, 
                birthYear: birthYear,
                spouseBirthYear: spouseBirthYear, 
                lifeExpectancy: userLifeExpectancy, 
                spouseLifeExpectancy: spousalLifeExpectancy ? spousalLifeExpectancy._id : null,
                investments: investmentIds,
                events: eventIds,
                simulationSettings: simulationSettings._id,
                financialGoal: financialGoal,
                stateOfResidence: stateOfResidence,
                sharedUsers: sharedUsersList
            }, {new: true});
            console.log('Scenario updated with ID:', existingScenario._id); 
            // Return the original scenario ID to the client
            res.status(201).json({
                success: true,  
                message: 'Scenario created successfully',
                scenarioId: existingScenario._id
            });   
        }
    } catch (error) {
        console.error('Error saving scenario:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save scenario',
            details: error.message
        });
    }
});

// Returns a list of the Investment and all inner objects for a given Scenario (not just IDs)
app.post('/simulation/scenario/investments', async (req, res) => {
    try {
        const scenarioIdEdit = req.body.scenarioIdEdit;
        const scenario = await Scenario.findById(scenarioIdEdit);
        const investmentIds = scenario.investments;
        const investments = [];
        for (i = 0; i < investmentIds.length; i++) {
            let investment = await Investment.findById(investmentIds[i]);
            let investmentType = await InvestmentType.findById(investment.investmentType);
            investment.investmentType = investmentType;
            let expectedReturn = await ExpectedReturn.findById(investmentType.expectedAnnualReturn);
            investment.investmentType.expectedAnnualReturn = expectedReturn;
            let expectedIncome = await ExpectedIncome.findById(investmentType.expectedAnnualIncome);
            investment.investmentType.expectedAnnualIncome = expectedIncome;
            investments.push(investment);
        }
        res.json({
            success: true,
            message: 'Investment objects successfully found',
            investments: investments
        });
    } catch (error) {
        console.error('Error finding investments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to find investment',
            details: error.message
        });
    }
}) 

// Returns a list of the Events and all inner objects for a given Scenario (not just IDs)
app.post('/simulation/scenario/events', async (req, res) => {
    try {
        const scenarioIdEdit = req.body.scenarioIdEdit;
        const scenario = await Scenario.findById(scenarioIdEdit);
        const eventIds = scenario.events;
        const events = [];
        for (i = 0; i < eventIds.length; i++) {
            let event = await Event.findById(eventIds[i]);
            let startYear = await StartYear.findById(event.startYear);
            event.startYear = startYear;
            let duration = await Duration.findById(event.duration);
            event.duration = duration;
            let income = await Income.findById(event.income);
            event.income = income;
            if (income) {
                let incomeExpectedAnnualChange = await ExpectedAnnualChange.findById(income.expectedAnnualChange);
                event.income.expectedAnnualChange = incomeExpectedAnnualChange;
            }
            let expense = await Expense.findById(event.expense);
            event.expense = expense;
            if (expense) {
                let expenseExpectedAnnualChange = await ExpectedAnnualChange.findById(expense.expectedAnnualChange);
                event.expense.expectedAnnualChange = expenseExpectedAnnualChange;
            }
            let invest = await Invest.findById(event.invest);
            event.invest = invest;
            let rebalance = await Rebalance.findById(event.rebalance);
            event.rebalance = rebalance;
            events.push(event);
        }
        res.json({
            success: true,
            message: 'Investment objects successfully found',
            events: events
        });
    } catch (error) {
        console.error('Error finding investments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to find investment',
            details: error.message
        });
    }
}) 


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

// Serve the YAML file from the server
app.get('/download-state-tax-yaml', (req, res) => {
    
    const filePath = path.join(__dirname, 'src', 'StateTaxes', 'YAML_format.YAML');
    res.download(filePath, 'YAML_format.YAML', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('File download failed');
      }
    });
});


// Uploading files
// Create the destination folder if it doesn't exist
const storageDir = path.join(__dirname, 'src', 'StateTaxes');

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storageDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Upload route
app.post('/upload-state-tax-yaml', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();

    res.status(200).send('File uploaded successfully.');
});