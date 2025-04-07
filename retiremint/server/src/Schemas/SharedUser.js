const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SharedUserSchema = new Schema({
    permissions: {
        type: String,
        enum: ['readOnly', 'readWrite'], 
        required: true
    },
    email: {
        type: String,
        required: true
    }


    
});

module.exports = mongoose.model('SharedUser', SharedUserSchema);