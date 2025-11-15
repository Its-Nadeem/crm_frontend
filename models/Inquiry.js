import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['Contact Form', 'Chatbot'] },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    message: { type: String },
    status: { type: String, required: true, default: 'New' },
}, { timestamps: true });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

export default Inquiry;



