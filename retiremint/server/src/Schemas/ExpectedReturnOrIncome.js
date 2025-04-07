const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema is used for both expected annual return and expected annual income as they share the same type of inputs

const ExpectedReturnOrIncomeSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedValue', 'fixedPercentage', 'normalValue', 'normalPercentage'], // allowed methods
        required: true
    },
    fixedValue: {
        type: Number,
    },
    fixedPercentage: {
        type: Number,
    },
    normalValue: {
        mean: { type: Number },
        sd: { type: Number }
    },
    normalPercentage: {
        mean: { type: Number },
        sd: { type: Number }
    },
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
});

module.exports = mongoose.model('ExpectedReturnOrIncome', ExpectedReturnOrIncomeSchema);
