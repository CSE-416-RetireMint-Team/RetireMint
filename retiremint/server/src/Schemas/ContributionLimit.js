const mongoose = require('mongoose');

const IRAContributionLimitSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  standardLimit: {
    type: Number,
    required: true
  },
  catchUpAmount: {
    type: Number,
    required: true
  },
  catchUpStartsAtAge: {
    type: Number,
    required: true,
    default: 50
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('IRAContributionLimit', IRAContributionLimitSchema);
