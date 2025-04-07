const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpectedAnnualChangeSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedValue', 'fixedPercentage', 'normalValue', 'normalPercentage','uniformValue','uniformPercentage'], // allowed methods
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
    uniformValue: {
        lowerBound: { type: Number },
        upperBound: { type: Number }
    },
    uniformPercentage: {
        lowerBound: { type: Number },
        upperBound: { type: Number }
    },
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
});

module.exports = mongoose.model('ExpectedAnnualChange', ExpectedAnnualChangeSchema);
