const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RebalanceSchema = new Schema({
    // Add the allocations field back
    allocations: { 
        type: Schema.Types.ObjectId, 
        ref: 'Allocation', 
        required: true
    },

    // Add the rebalanceStrategy field mirroring Invest schema
    rebalanceStrategy: {
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
    },
    // Add final rebalance strategy for glide path
    finalRebalanceStrategy: {
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
    // You might also need returnType, executionType, and modify flags here 
    // depending on how SimulationEngine expects the data. Add them if necessary.
    // returnType: { type: String, default: 'fixedAllocation' },
    // executionType: { type: String, default: 'fixedAllocation' },
    // modifyTaxStatusAllocation: { type: Boolean, default: false },
    // modifyPreTaxAllocation: { type: Boolean, default: false },
    // modifyAfterTaxAllocation: { type: Boolean, default: false },
    // modifyNonRetirementAllocation: { type: Boolean, default: false },
    // modifyTaxExemptAllocation: { type: Boolean, default: false }
});

module.exports = mongoose.model('Rebalance', RebalanceSchema );
