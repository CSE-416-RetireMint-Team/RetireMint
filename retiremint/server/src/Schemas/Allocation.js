const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AllocationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedAllocation', 'glidePath'], // allowed methods
        required: true
    },
    fixedAllocation: [{ 
        type: String
    
    }],
    glidePath: [{ 
        type: String
    
    }]


    
});

module.exports = mongoose.model('Allocation', AllocationSchema);
