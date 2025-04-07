const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StartYearSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedValue', 'normalValue', 'uniformValue','sameYearAsAnotherEvent','yearAfterAnotherEventEnd'], // allowed methods
        required: true
    },
    fixedValue: {
        type: Number
    },
    normalValue: {
        mean: { type: Number },
        sd: { type: Number }
    },
    uniformValue: {
        lowerBound: { type: Number },
        upperBound: { type: Number }
    },
    sameYearAsAnotherEvent: { 
        type: String 
    },
    yearAfterAnotherEventEnd: { 
        type: String 
    },
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('StartYear', StartYearSchema);
