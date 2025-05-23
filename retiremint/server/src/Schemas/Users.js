const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  picture: String,
  DOB: Date,
  state: String,
  maritalStatus: String,
  stateTaxes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'UserStateTax',
    default: [] 
  }],
  scenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }]
}, {timestamps: true});

module.exports = mongoose.model('User', UserSchema);