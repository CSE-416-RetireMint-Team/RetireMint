const mongoose = require('mongoose');

const taxBracketSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true
  },
  up_to: {
    type: Number,
    required: false, // use null for no upper limit
  }
});

const stateTaxSchema = new mongoose.Schema({
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
      type: [taxBracketSchema],
      default: []
    },
    married: {
      type: [taxBracketSchema],
      default: []
    }
  }
});

module.exports = mongoose.model('StateTax', stateTaxSchema);
