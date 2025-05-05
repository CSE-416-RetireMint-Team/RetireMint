const mongoose = require('mongoose');

const taxBracketsSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: false // allow null for no upper limit
  }
});

const userStateTaxSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 2,
    maxlength: 2
  },
  brackets: {
    single: {
      type: [taxBracketsSchema],
      default: []
    },
    married: {
      type: [taxBracketsSchema],
      default: []
    }
  }
});

module.exports = mongoose.model('UserStateTax', userStateTaxSchema);
