const mongoose = require('mongoose');

const standardDeductionSchema = new mongoose.Schema({
  year: Number,
  filingStatus: String,
  standardDeduction: Number
});

module.exports = mongoose.model('StandardDeduction', standardDeductionSchema);
