const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema is used for both expected annual return and expected annual income as they share the same type of inputs

const ExpectedReturnOrIncomeSchema = new Schema({
    method: {
        type: String,
        enum: ['fixed_value', 'fixed_percentage', 'normal_value', 'normal_percentage', 'gbm'], // allowed methods
        required: true
    },
    fixed_value: {
        type: Number,
    },
    fixed_percentage: {
        type: Number,
    },
    normal_value: {
        mean: { type: Number },
        sd: { type: Number }
    },
    normal_percentage: {
        mean: { type: Number },
        sd: { type: Number }
    },
    gbm: {
        mu: { type: Number },
        sigma: { type: Number },
        elapsed_time: { type: Number }
    }
});

module.exports = mongoose.model('ExpectedReturnOrIncome', ExpectedReturnOrIncomeSchema);
