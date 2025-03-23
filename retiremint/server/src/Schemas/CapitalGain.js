const mongoose = require('mongoose');

const CapitalGainSchema = new mongoose.Schema({
  year: Number,
  filingStatus: String,
  longTermCapitalGains: [
    {
      rate: String,
      threshold: String
    }
  ]
});

module.exports = mongoose.model('CapitalGain', CapitalGainSchema);
