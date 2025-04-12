const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const InvestSchema = new Schema({
    
    allocations: { 
        type: Schema.Types.ObjectId, 
        ref: 'Allocation', 
        required: true
    },
    modifyMaximumCash: {
        type: Boolean,
        default: false
    },
    newMaximumCash: {
        type: Number
    },
    investmentStrategy: {
        taxStatusAllocation: {
            type: Object,
            default: {}
        },
        preTaxAllocation: {
            type: Object,
            default: {}
        },
        afterTaxAllocation: {
            type: Object,
            default: {}
        },
        nonRetirementAllocation: {
            type: Object,
            default: {}
        },
        taxExemptAllocation: {
            type: Object,
            default: {}
        }
    }
});

module.exports = mongoose.model('Invest', InvestSchema );
