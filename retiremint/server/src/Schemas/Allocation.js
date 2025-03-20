const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AllocationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixed_allocation', 'glide_path'], // allowed methods
        required: true
    },
    fixed_allocation: [{ 
        type: String
    
    }],
    glide_path: [{ 
        type: String
    
    }]


    
});

module.exports = mongoose.model('Allocation', AllocationSchema);
