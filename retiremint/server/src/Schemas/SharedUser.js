const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SharedUserSchema = new Schema({
    permissions: {
        type: String,
        enum: ['read_only', 'read_write'], 
        required: true
    },
    email: {
        type: String,
        required: true
    }


    
});

module.exports = mongoose.model('SharedUser', SharedUserSchema);