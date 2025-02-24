const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScenarioSchema = new Schema({
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    scenarioType: { 
      type: String, 
      enum: ['individual', 'married'], 
      required: true 
    },
    // Personal Details:
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
    // Embedded subdocuments:
    investments: [InvestmentSchema],
    eventSeries: [EventSeriesSchema],
    simulationSettings: SimulationSettingsSchema,
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  // Create a secondary index on userId for quick retrieval of a user's scenarios.
  ScenarioSchema.index({ userId: 1 });
  
  module.exports = mongoose.model('Scenario', ScenarioSchema);  