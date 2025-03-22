const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ExpenseSchema = new Schema({
    initial_amount :{
        type : Number,
        required: true
    },
    expected_annual_change :{
        type: Schema.Types.ObjectId,
        ref: 'ExpectedAnnualChange',
        required: true 
    },
    inflation_adjustment: {
        type: Boolean,
        required: true
    },
    married_percentage: {
        type: Number
    },
    is_discretionary: {
        type: Boolean
    }

    
    
});

module.exports = mongoose.model('Expense', ExpenseSchema);
