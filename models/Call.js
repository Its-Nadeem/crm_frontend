import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
    leadId: { type: String, required: true, index: true },
    outcome: { type: String, required: true },
    notes: { type: String },
    duration: { type: Number }, // in seconds
    callType: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
    authorId: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const Call = mongoose.model('Call', callSchema);

export default Call;


