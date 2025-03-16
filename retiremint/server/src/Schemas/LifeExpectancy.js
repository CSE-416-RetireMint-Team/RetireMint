const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LifeExpectancySchema = new Schema({
    life_expectancy_method: {  
        type: String, 
        enum: ['fixed_value', 'normal_distribution'], 
        required: true 
    },
    fixed_value: { 
        type: Number 
    },
    normal_distribution: { 
        mean: { type: Number },
        standard_deviation: { type: Number }
    },
    computed_life_expectancy: { //this is where the actual value of life expectancy will be store 
        type: Number  
    }
});

module.exports = mongoose.model('LifeExpectancy', LifeExpectancySchema);