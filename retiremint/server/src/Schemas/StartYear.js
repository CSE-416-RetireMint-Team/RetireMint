const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StartYearSchema = new Schema({
    method: {
        type: String,
        enum: ['fixed_value', 'normal_value', 'uniform_value','same_year_as_another_event','year_after_another_event_end'], // allowed methods
        required: true
    },
    fixed_value: {
        type: Number
    },
    normal_value: {
        mean: { type: Number },
        sd: { type: Number }
    },
    uniform_value: {
        lower_bound: { type: Number },
        upper_bound: { type: Number }
    },
    same_year_as_another_event: { 
        type: String 
    },
    year_after_another_event_end: { 
        type: String 
    },
    computed_value: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('StartYear', StartYearSchema);
