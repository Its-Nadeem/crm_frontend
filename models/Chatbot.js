import mongoose from 'mongoose';

const chatbotSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    isEnabled: { type: Boolean, default: false },
    name: { type: String, default: 'Clienn CRM Assistant' },
    welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
    fallbackMessage: { type: String, default: 'I\'m sorry, I didn\'t understand that. Can you please rephrase?' },
    primaryColor: { type: String, default: '#007bff' },
    position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
    greetingSchedule: {
        enabled: { type: Boolean, default: false },
        message: { type: String, default: 'Hi there! 👋 Need help?' },
        delay: { type: Number, default: 3000 }, // milliseconds
    },
    businessHours: {
        enabled: { type: Boolean, default: false },
        timezone: { type: String, default: 'UTC' },
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
        saturday: { start: String, end: String },
        sunday: { start: String, end: String },
    },
    autoResponses: [{
        keywords: [String],
        response: String,
        isActive: { type: Boolean, default: true },
    }],
    integrations: {
        whatsapp: {
            isEnabled: { type: Boolean, default: false },
            phoneNumber: String,
            apiKey: String,
        },
        facebook: {
            isEnabled: { type: Boolean, default: false },
            pageId: String,
            accessToken: String,
        },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
chatbotSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Chatbot = mongoose.model('Chatbot', chatbotSchema);

export default Chatbot;


