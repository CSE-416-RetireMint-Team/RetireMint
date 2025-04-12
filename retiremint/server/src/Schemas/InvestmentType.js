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
    type: Schema.Types.ObjectId, 
    ref: 'ExpectedReturnOrIncome',
    required: true
  },  
  expenseRatio: { 
    type: Number, required: true 
  },
  taxability: {
    type: String,
    enum: ['taxable', 'tax-exempt'],
    required: true
  }
});

module.exports = mongoose.model('InvestmentType', InvestmentTypeSchema);
