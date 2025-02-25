const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for a tax bracket (used for both federal and state brackets)
const TaxBracketSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  rate: { type: Number, required: true }
}, { _id: false });

// Sub-schema for social security taxable brackets
const SocialSecurityBracketSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  taxablePercentage: { type: Number, required: true }
}, { _id: false });

// Federal Tax Data sub-schema
const FederalTaxSchema = new Schema({
  // Federal income tax brackets
  brackets: { 
    type: [TaxBracketSchema], 
    required: true 
  },
  // Standard deductions for the two filing statuses supported
  standardDeductions: {
    single: { type: Number, required: true },
    married: { type: Number, required: true }
  },
  // Capital gains tax thresholds and corresponding rates; assumes all gains are long-term.
  capitalGains: {
    thresholds: { type: [Number], required: true },
    rates: { type: [Number], required: true }
  },
  // Social security: combined income brackets and the taxable percentage for each bracket.
  socialSecurity: { 
    type: [SocialSecurityBracketSchema], 
    required: true 
  }
}, { _id: false });

// State Tax Data sub-schema: each state's tax data is stored as an object.
const StateTaxSchema = new Schema({
  brackets: { 
    type: [TaxBracketSchema], 
    required: true 
  },
  standardDeduction: { 
    type: Number, 
    required: true 
  }
}, { _id: false });

const TaxDataSchema = new Schema({
  taxYear: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  federal: { 
    type: FederalTaxSchema, 
    required: true 
  },
  state: { 
    type: Map,
    of: StateTaxSchema,
    required: true 
  },
  // RMD table data as an array. Each element can map an age to a distribution factor.
  rmdTable: { 
    type: [Schema.Types.Mixed] 
  }
});

module.exports = mongoose.model('TaxData', TaxDataSchema);
