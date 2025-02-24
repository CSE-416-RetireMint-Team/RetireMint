const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSeriesSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  startYear: { 
    type: Number, 
    required: true 
    // could be a fixed value, sampled, or defined relative to another event.
  },
  duration: { 
    type: Number, 
    required: true 
    // could also come from a fixed value or a distribution.
  },
  type: { 
    type: String, 
    enum: ['income', 'expense', 'invest', 'rebalance'], 
    required: true 
  },
  // Fields for Income/Expense types:
  initialAmount: { 
    type: Number 
  },
  expectedAnnualChange: { 
    type: Schema.Types.Mixed 
    // can hold either a fixed value or parameters defining a distribution.
  },
  inflationAdjusted: { 
    type: Boolean 
  },
  // For married scenarios:
  userPercentage: { 
    type: Number 
  },
  spousePercentage: { 
    type: Number 
  },
  // fields specific to Income events:
  isSocialSecurity: {
    type: Boolean,
    // Only applicable if type === 'income'
  },
  isWages: {
    type: Boolean,
    // Only applicable if type === 'income'
  },
  // field specific to Expense events:
  isDiscretionary: {
    type: Boolean,
    // Only applicable if type === 'expense'
  },
  // Fields for Invest/Rebalance types:
  assetAllocation: { 
    type: Schema.Types.Mixed 
    // Can be a fixed set of percentages or a glide path structure.
  },
  maximumCash: { 
    type: Number 
    // Maximum cash to be held in the pre-defined cash investment.
  }
});

module.exports = mongoose.model('Event', EventSeriesSchema);
