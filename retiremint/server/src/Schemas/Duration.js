const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DurationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixed_value', 'normal_value', 'uniform_value'], // allowed methods
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
    computed_value: { //this is where the actual value will be store 
        type: Number  
    }
    
});

module.exports = mongoose.model('Duration', DurationSchema);
