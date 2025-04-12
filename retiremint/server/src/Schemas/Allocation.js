const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const AllocationSchema = new Schema({
    method: {
        type: String,
        enum: ['fixedAllocation', 'glidePath'], // allowed methods
        required: false,
        default: 'fixedAllocation',
        validate: {
            validator: function(v) {
                // Only validate if a value is provided (not empty string)
                return v === '' || ['fixedAllocation', 'glidePath'].includes(v);
            },
            message: props => `${props.value} is not a valid enum value for path 'method'`
        }
    },
    fixedAllocation: [{ 
        type: String
    
    }],
    glidePath: [{ 
        type: String
    
    }]


    
});

module.exports = mongoose.model('Allocation', AllocationSchema);
