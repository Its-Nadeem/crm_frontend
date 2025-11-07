import mongoose from 'mongoose';

const billingHistorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'completed'
    },
    date: { type: Date, default: Date.now },
    billingCycle: { 
        type: String, 
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    description: { type: String },
    invoiceUrl: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String }
}, {
    timestamps: true
});

// Create indexes for better query performance
billingHistorySchema.index({ organizationId: 1, date: -1 });
billingHistorySchema.index({ status: 1 });

const BillingHistory = mongoose.model('BillingHistory', billingHistorySchema);

export default BillingHistory;


