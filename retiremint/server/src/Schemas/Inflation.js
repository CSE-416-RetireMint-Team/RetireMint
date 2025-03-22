const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema defines different methods to input inflation
const InflationSchema = new Schema({
    method: {
        type: String,
        enum: ['fix_percentage', 'normal_percentage', 'uniform_percentage'], // allowed methods
        required: true
    },
    fix_percentage: {
        type: Number
    },
    normal_percentage: {
        mean: { type: Number },
        sd: { type: Number }
    },
    uniform_percentage: {
        lower_bound: { type: Number },
        upper_bound: { type: Number }
    },
    computed_value: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('Inflation', InflationSchema);
