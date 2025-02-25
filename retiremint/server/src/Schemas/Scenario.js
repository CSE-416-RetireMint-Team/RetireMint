const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const InvestmentSchema = require('./Investments');      
const EventSeriesSchema = require('./EventSeries');     
const SimulationSettingsSchema = require('./SimulationSettings'); 

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
    type: Number, 
    required: true 
    // Could also be expressed as a fixed value or defined via a distribution.
  },
  spouseLifeExpectancy: { 
    type: Number 
  },
  financialGoal: { 
    type: Number, 
    required: true 
  },
  stateOfResidence: { 
    type: String, 
    required: true 
  },
  // a set of investments with their current values.
  investments: [InvestmentSchema],
  //a set of event series.
  eventSeries: [EventSeriesSchema],
  // Simulation Settings & Contribution Limits
  simulationSettings: {
    type: SimulationSettingsSchema,
    required: true
  },
  // Define which other users can access this scenario.
  sharingSettings: {
    readOnly: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readWrite: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  // Reference to the owner of the scenario.
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// an index on the userId to speed up queries for a user's scenarios.
ScenarioSchema.index({ userId: 1 });

module.exports = mongoose.model('Scenario', ScenarioSchema);
