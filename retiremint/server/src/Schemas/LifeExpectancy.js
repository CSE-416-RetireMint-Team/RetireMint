const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LifeExpectancySchema = new Schema({
    lifeExpectancyMethod: {  
        type: String, 
        enum: ['fixedValue', 'normalDistribution'], 
        required: true 
    },
    fixedValue: { 
        type: Number 
    },
    normalDistribution: { 
        mean: { type: Number },
        standardDeviation: { type: Number }
    },
    computedValue: { //this is where the actual value will be store 
        type: Number  
    }
});

module.exports = mongoose.model('LifeExpectancy', LifeExpectancySchema);