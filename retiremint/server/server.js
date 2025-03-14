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

// route to receive a scenario from frontend
app.post('/scenario', async (req, res) => {
  
    const { scenario_name, scenario_type, birth_year, spouse_birth_year } = req.body; // extracting scenario name from frontend

    const new_scenario = new Scenario({
        name: scenario_name,
        scenarioType: scenario_type,
        birthYear: birth_year,
        spouseBirthYear: spouse_birth_year, 
    });
    await new_scenario.save();
  
  
});

// start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
