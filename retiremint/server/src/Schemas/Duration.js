const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DurationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedValue', 'normalValue', 'uniformValue'], // allowed methods
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
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('Duration', DurationSchema);
