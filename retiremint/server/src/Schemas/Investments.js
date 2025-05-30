const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvestmentSchema = new Schema({
    name : {
        type: String,
        required: true
    },
    investmentType: {
        type: Schema.Types.ObjectId,
        ref: 'InvestmentType',
        required: true,
    },
    value: {
        type: Number,
        required: true
    },
    maxAnnualContribution: {
        type: Number,
        required: false,
    },
    accountTaxStatus: {
        type: String,
        enum:['non-retirement', 'pre-tax','after-tax'],
        required: function() {
            // Make accountTaxStatus required only for taxable investment types
            // This will be checked during validation after populating the investmentType
            return false; // We'll handle this in the pre-save middleware
        }
    }
});

// Pre-validate middleware to check if accountTaxStatus is required
InvestmentSchema.pre('validate', async function(next) {
    try {
        // Skip validation if this is a new document without an investmentType yet
        if (!this.investmentType) {
            return next();
        }

        // Only try to populate if investmentType is an ObjectId (not already populated)
        if (this.investmentType && typeof this.investmentType === 'object' && !this.investmentType.taxability) {
            await this.populate('investmentType');
        }
        
        // Check if population was successful
        if (!this.investmentType || !this.investmentType.taxability) {
            return next(); // Skip validation if we can't determine taxability
        }

        // If the investment type is tax-exempt, accountTaxStatus is not required
        if (this.investmentType.taxability === 'tax-exempt') {
            this.accountTaxStatus = undefined; // Clear the accountTaxStatus field
        } else {
            // For taxable investments, accountTaxStatus is required
            if (!this.accountTaxStatus) {
                this.invalidate('accountTaxStatus', 'Tax status is required for taxable investments');
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Investment', InvestmentSchema);