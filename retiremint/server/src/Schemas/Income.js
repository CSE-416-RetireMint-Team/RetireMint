const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const IncomeSchema = new Schema({
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
    isSocialSecurity: {
        type: Boolean,
        required: true
    }

    
    
});

module.exports = mongoose.model('Income', IncomeSchema);
