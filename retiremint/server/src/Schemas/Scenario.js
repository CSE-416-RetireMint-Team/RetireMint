const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ScenarioSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: String,
    required: true,
    index: true
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
  }],

  events: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  }],

  simulationSettings: {
    type: Schema.Types.ObjectId, 
    ref: 'SimulationSettings', 
    required: true 
  },


  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // skip user and sharingSettings for now

  financialGoal: { 
    type: Number, 
    required: true 
  },
  stateOfResidence: { 
    type: String, 
    enum: [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ],
    required: true
  },

  // shared users array
  sharedUsers: [{
    userId: {
    type: Schema.Types.ObjectId,
    ref: 'SharedUser'
    },
    email: {
      type: String,
      ref: 'Email'
    },
    permissions : {
      type: String,
      enum: ['view', 'edit'],
      ref: 'Permissions'
    }
  }],

  report: { 
    type: Schema.Types.ObjectId, 
    ref: 'Report'
  } 
});

// an index on the userId to speed up queries for a user's scenarios.
ScenarioSchema.index({ userId: 1 });

module.exports = mongoose.model('Scenario', ScenarioSchema);
