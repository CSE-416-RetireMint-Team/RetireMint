const mongoose = require('mongoose');

const incomeTaxSchema = new mongoose.Schema({
    year: Number,
    filingStatus: String,
    brackets: [
      {
        rate: String,
        minIncome: String,
        maxIncome: String,
      }
    ]
  });

module.exports = mongoose.model('IncomeTax', incomeTaxSchema);
