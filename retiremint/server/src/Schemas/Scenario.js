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
  lifeExpectancy: { 
    type: Schema.Types.ObjectId, 
    ref: 'LifeExpectancy', 
    required: true 
  },
  spouseLifeExpectancy: { 
    type: Schema.Types.ObjectId, 
    ref: 'LifeExpectancy' 
  },
  investments: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Investment', 
    required: true 
  }]
  
  
});

// an index on the userId to speed up queries for a user's scenarios.
ScenarioSchema.index({ userId: 1 });

module.exports = mongoose.model('Scenario', ScenarioSchema);
