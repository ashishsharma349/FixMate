const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FinanceSchema = new Schema({
    transactionType: { 
        type: String, 
        enum: ['Income', 'Expense'], 
        required: true 
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true }, // e.g., "Bought 5 LED bulbs"
    
    // Link to a complaint if the expense was for a specific repair
    relatedComplaint: { 
        type: Schema.Types.ObjectId, 
        ref: 'Complain', 
        default: null 
    },
    
    // Link to staff who handled the money/repair
    handledBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'Staff', 
        required: true 
    },
    
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Finance", FinanceSchema);