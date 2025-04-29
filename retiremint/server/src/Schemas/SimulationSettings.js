const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SimulationSettingsSchema = new Schema({
    inflationAssumption: { 
      type: Schema.Types.ObjectId, 
      ref: 'Inflation', 
      required: true 
    },
    contributionLimits: {
      afterTax: {  
        type: Number, 
        //required: true //the homework document reduce limit to only afterTax, the number should be scrape from IRS
      }
    },

    expenseWithdrawalStrategies: {
      type: [String],
      default: []
    },

    spendingStrategy: {
      type: [String],
      default: []
    },

    rmdStrategies: {
      type: [String],
      default: []
    },

    rothConversionStrategies: {
      type: [String],
      default: []
    },

    // roth optimizer settings
    rothOptimizerEnable: {
      type: Boolean,
      default: false
    },
    rothOptimizerStartYear: {
      type: Number,
    },
    rothOptimizerEndYear: {
      type: Number,
    }
  });
  
  module.exports = mongoose.model('SimulationSettings', SimulationSettingsSchema);