const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const InvestSchema = new Schema({
    
    allocations: { 
        type: Schema.Types.ObjectId, 
        ref: 'Allocation', 
        required: true
    },
    maximum_cash :{
        type: Number,
        required: true
    }

    
    
});

module.exports = mongoose.model('Invest', InvestSchema );
