const mongoose = require('mongoose');

const RMDRowSchema = new mongoose.Schema({
  age: Number,
  distributionPeriod: Number
});

const RMDTableSchema = new mongoose.Schema({
  year: Number,
  tableType: {
    type: String,
    default: 'Table III (Uniform Lifetime Table)'
  },
  rows: [RMDRowSchema]
});

module.exports = mongoose.model('RMDTable', RMDTableSchema);
