const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for social security taxable brackets
const SocialSecurityBracketSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  taxablePercentage: { type: Number, required: true }
}, { _id: false });

// Sub-schema for tax brackets (used for state brackets)
const TaxBracketSchema = new Schema({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  rate: { type: Number, required: true }
}, { _id: false });

// Federal Tax Data sub-schema - simplified to only include socialSecurity
const FederalTaxSchema = new Schema({
  // Social security: combined income brackets and the taxable percentage for each bracket.
  socialSecurity: { 
    type: [SocialSecurityBracketSchema], 
    required: false
  }
}, { _id: false });

// State Tax Data sub-schema
const StateTaxSchema = new Schema({
  brackets: { 
    type: [TaxBracketSchema], 
    required: false
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
    required: false
  },
  state: { 
    type: Map,
    of: StateTaxSchema,
    required: false
  },
  // RMD table data
  rmdTable: { 
    type: Schema.Types.Mixed
  }
});

module.exports = mongoose.model('TaxData', TaxDataSchema);
