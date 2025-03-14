const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScenarioSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  scenarioType: { 
    type: String, 
    enum: ['individual', 'married'], 
    required: true 
  },
  birthYear: { 
    type: Number, 
    required: true 
  },
  spouseBirthYear: { 
    type: Number 
  },
  life_expectancy: { //life expectancy can be either a fixed value or sampled from a normal distribution
    life_expectancy_method: {  
      type: String, 
      enum: ['fixed_value', 'normal_distribution'], 
      required: true 
    },
    fixed_value: { 
      type: Number 
    },
    normal_distribution: { //for normal distribution we need both mean and sd
      mean: { type: Number },
      standard_deviation: { type: Number }
    },
    // later, use this field to assign actual value during simulations
    computed_life_expectancy: { 
      type: Number 
    }

  },
  spouse_life_expectancy: {
    life_expectancy_method: { 
      type: String, 
      enum: ['fixed_value', 'normal_distribution'] 
    },
    fixed_value: { 
      type: Number 
    },
    normal_distribution: {
      mean: { type: Number },
      standard_deviation: { type: Number }
    },
    computed_life_expectancy: { 
      type: Number 
    }
  }
});

// an index on the userId to speed up queries for a user's scenarios.
ScenarioSchema.index({ userId: 1 });

module.exports = mongoose.model('Scenario', ScenarioSchema);
