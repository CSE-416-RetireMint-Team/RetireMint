const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvestmentSchema = new Schema({
    investmentType: {
        type: Schema.Types.ObjectId,
        ref: 'InvestmentType',
        required: true,
    },
    value: {
        type: Number,
        required: true
    },
    accountTaxStatus: {
        type: String,
        enum:['non-retirement', 'pre-tax','after-tax'],
        required: true,
    }
});

module.exports = mongoose.model('Investment', InvestmentSchema);