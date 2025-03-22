const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const RebalanceSchema = new Schema({
    
    allocations: { 
        type: Schema.Types.ObjectId, 
        ref: 'Allocation', 
        required: true
    }

    
    
});

module.exports = mongoose.model('Rebalance', RebalanceSchema );
