const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ExpenseSchema = new Schema({
    initialAmount :{
        type : Number,
        required: true
    },
    expectedAnnualChange :{
        type: Schema.Types.ObjectId,
        ref: 'ExpectedAnnualChange',
        required: true 
    },
    inflationAdjustment: {
        type: Boolean,
        required: true
    },
    marriedPercentage: {
        type: Number
    },
    isDiscretionary: {
        type: Boolean
    }

    
    
});

module.exports = mongoose.model('Expense', ExpenseSchema);
