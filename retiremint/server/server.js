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


// route to receive a scenario from frontend
app.post('/scenario', async (req, res) => {
  
    const { scenario_name, scenario_type, birth_year, spouse_birth_year,life_expectancy, spouse_life_expectancy  } = req.body; // extracting data from frontend

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


    const new_scenario = new Scenario({
        name: scenario_name,
        scenarioType: scenario_type,
        birthYear: birth_year,
        spouseBirthYear: spouse_birth_year, 
        lifeExpectancy: user_life_expectancy ? user_life_expectancy._id : null, // assign the ID if it exists
        spouseLifeExpectancy: spousal_life_expectancy ? spousal_life_expectancy._id : null 

    });
    await new_scenario.save();
  
  
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
