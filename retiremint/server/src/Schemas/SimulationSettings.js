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

    expenseWithdrawalStrategies: [ //use the same strategy for both discretionary and non-discretionary expenses,
      //the difference is implemented in the simulation logic
      {
        type: String
      }
    ],

    rmdStrategies: [
      {
        type: String
      }
    ],

    rothConversionStrategies: [
      {
        type: String
      }
    ],

    // roth optimizer settings
    rothOptimizerEnable: {
      type: Boolean,
    },
    rothOptimizerStartYear: {
      type: Number,
      
    },
    rothOptimizerEndYear: {
      type: Number,
    }
  });
  
  module.exports = mongoose.model('SimulationSettings', SimulationSettingsSchema);