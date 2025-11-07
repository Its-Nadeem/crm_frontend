import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
    authorId: { type: Number, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    status: { type: String, required: true, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
    lastReplyAt: { type: Date, default: Date.now },
    replies: [replySchema],
}, { timestamps: true });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;



