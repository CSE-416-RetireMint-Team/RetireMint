const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SimulationSettingsSchema = new Schema({
    inflationAssumption: { 
      type: Schema.Types.Mixed, 
      required: true 
      // This could be a fixed percentage or an object defining a distribution.
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
    strategies: {
      spendingStrategy: { 
        type: Schema.Types.Mixed 
        // Could be an ordered list, a set of rules, or another structure.
      },
      expenseWithdrawalStrategy: { 
        type: Schema.Types.Mixed 
      },
      RMDStrategy: { 
        type: Schema.Types.Mixed 
      },
      RothConversionStrategy: { 
        type: Schema.Types.Mixed 
      }
    },
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
      ordering: { 
        type: [String] 
        // An array indicating the order in which investments are considered for conversion.
      }
    }
  });
  
  module.exports = mongoose.model('SimulationSettings', SimulationSettingsSchema);