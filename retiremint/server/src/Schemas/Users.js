const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  hashedPassword: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Keeps track of scenario shares with others
  sharingPermissions: [{ 
    scenarioId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Scenario', 
      required: true 
    },
    permission: { 
      type: String, 
      enum: ['read-only', 'read-write'], 
      required: true 
    }
  }]
});

// a secondary index on the email field for fast lookups.
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
