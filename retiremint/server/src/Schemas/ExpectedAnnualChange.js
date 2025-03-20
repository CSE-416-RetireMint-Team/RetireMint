const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpectedAnnualChangeSchema = new Schema({
    method: {
        type: String,
        enum: ['fixed_value', 'fixed_percentage', 'normal_value', 'normal_percentage','uniform_value','uniform_percentage'], // allowed methods
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
    uniform_value: {
        lower_bound: { type: Number },
        upper_bound: { type: Number }
    },
    uniform_percentage: {
        lower_bound: { type: Number },
        upper_bound: { type: Number }
    },
    computed_value: { //this is where the actual value will be store 
        type: Number  
    }
});

module.exports = mongoose.model('ExpectedAnnualChange', ExpectedAnnualChangeSchema);
