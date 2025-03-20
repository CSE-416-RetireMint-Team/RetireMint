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
    type: Schema.Types.ObjectId,
    ref: 'StartYear',
    required: true 
    // could be a fixed value, sampled, or defined relative to another event.
  },
  duration: { 
    type: Schema.Types.ObjectId,
    ref: 'Duration',
    required: true 
    // could also come from a fixed value or a distribution.
  },
  type: { 
    type: String, 
    enum: ['income', 'expense', 'invest', 'rebalance'], 
    required: true 
  },
  income: {
    type: Schema.Types.ObjectId,
    ref: 'StartYear',
  },
  expense: {
    type: Schema.Types.ObjectId,
    ref: 'StartYear',
  },
  invest: {
    type: Schema.Types.ObjectId,
    ref: 'StartYear',
  },
  rebalance: {
    type: Schema.Types.ObjectId,
    ref: 'StartYear',
  }

});

module.exports = mongoose.model('Event', EventSeriesSchema);
