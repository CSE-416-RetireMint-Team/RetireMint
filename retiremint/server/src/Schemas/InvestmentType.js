const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvestmentTypeSchema = new Schema({
  name: { 
    type: String, required: true 
  },
  description: { 
    type: String 
  },
  expectedAnnualReturn: {
    type: Schema.Types.Mixed,
    required: true
    // The stored object should follow one of the formats:
    // For fixed: { method: "fixed", value: 0.07 }
    // For normal: { method: "normal", value: 0.07, parameters: { std: 0.02 } }
    // For GBM: { method: "GBM", value: 0.07, parameters: { volatility: 0.2 } }
  },  
  expenseRatio: { 
    type: Number, required: true 
  },
  expectedAnnualIncome: {
    type: Schema.Types.Mixed,
    required: true
    // The stored object should follow one of these formats:
    // For fixed: { method: "fixed", value: 0.02 }
    // For normal: { method: "normal", value: 0.02, parameters: { std: 0.005 } }
  },  
  taxability: {
    type: String,
    enum: ['taxable', 'tax-exempt'],
    required: true
  }
});

module.exports = mongoose.model('InvestmentType', InvestmentTypeSchema);
