const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SimulationSettingsSchema = new Schema({
    inflationAssumption: { 
      type: Schema.Types.Mixed, 
      required: true 
      // either a fixed percentage or an object defining a distribution.
    },
    contributionLimits: {
      preTax: { 
        type: Number, 
        required: true 
      },
      afterTax: { 
        type: Number, 
        required: true 
      }
    },
    // Stragies handle simulation rules
    strategies: {
      // An ordered list specifying which discretionary expenses should be paid first.
      spendingStrategy: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Event', 
        required: true 
      },      
      // An ordered list that specifies the sequence in which investments are liquidated if additional cash is needed.
      expenseWithdrawalStrategy: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Investment', 
        required: true 
      },      
      // An ordering on investments in pre-tax retirement accounts for required minimum distributions.
      RMDStrategy: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Investment', 
        required: true 
      },
      // An ordering on investments in pre-tax retirement accounts for in-kind transfers to after-tax accounts.
      RothConversionStrategy: { 
        type: [Schema.Types.ObjectId], 
        ref: 'Investment', 
        required: true 
      }      
    },
    // When enabled, for each year between startYear and endYear, the optimizer generates a withdrawal
    // to raise income up to the upper limit of the current tax bracket.
    rothConversionOptimizer: {
      enabled: { 
        type: Boolean, 
        default: false 
      },
      startYear: { 
        type: Number 
      },
      endYear: { 
        type: Number 
      },
      // field to include any additional parameters for the optimizer.
      parameters:{
        type: Schema.Types.Mixed
      }
    }
  });
  
  module.exports = mongoose.model('SimulationSettings', SimulationSettingsSchema);