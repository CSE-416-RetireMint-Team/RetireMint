const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema defines different methods to input inflation
const InflationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedPercentage', 'normalPercentage', 'uniformPercentage'], // allowed methods
        required: true
    },
    fixedPercentage: {
        type: Number
    },
    normalPercentage: {
        mean: { type: Number },
        sd: { type: Number }
    },
    uniformPercentage: {
        lowerBound: { type: Number },
        upperBound: { type: Number }
    },
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('Inflation', InflationSchema);
