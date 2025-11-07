import mongoose from 'mongoose';

const smsIntegrationSchema = new mongoose.Schema({
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    provider: {
        type: String,
        required: true,
        enum: ['twilio', 'msg91', 'textlocal', 'aws-sns', 'nexmo'],
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    isConnected: {
        type: Boolean,
        default: false
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    credentials: {
        // Twilio
        accountSid: { type: String, sparse: true },
        authToken: { type: String, sparse: true },
        fromNumber: { type: String, sparse: true },

        // MSG91
        apiKey: { type: String, sparse: true },
        senderId: { type: String, sparse: true },

        // TextLocal
        apiKey: { type: String, sparse: true },

        // AWS SNS
        accessKeyId: { type: String, sparse: true },
        secretAccessKey: { type: String, sparse: true },
        region: { type: String, sparse: true },

        // Nexmo (Vonage)
        apiKey: { type: String, sparse: true },
        apiSecret: { type: String, sparse: true }
    },
    settings: {
        dailyLimit: { type: Number, default: 1000 },
        rateLimit: { type: Number, default: 10 }, // messages per minute
        defaultSenderId: { type: String },
        deliveryReceipts: { type: Boolean, default: true },
        unicodeSupport: { type: Boolean, default: true }
    },
    usage: {
        messagesSentToday: { type: Number, default: 0 },
        messagesSentThisMonth: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now },
        totalCreditsUsed: { type: Number, default: 0 }
    },
    metadata: {
        lastTested: { type: Date },
        testResult: { type: String },
        version: { type: String, default: '1.0' }
    }
}, {
    timestamps: true,
    collection: 'smsintegrations'
});

// Indexes for performance
smsIntegrationSchema.index({ organizationId: 1, provider: 1 });
smsIntegrationSchema.index({ 'usage.lastResetDate': 1 });

// Instance methods
smsIntegrationSchema.methods.canSendMessage = function() {
    return this.isConnected && this.isEnabled && this.usage.messagesSentToday < this.settings.dailyLimit;
};

smsIntegrationSchema.methods.incrementUsage = function() {
    this.usage.messagesSentToday += 1;
    this.usage.messagesSentThisMonth += 1;
    this.usage.totalCreditsUsed += 1;
    return this.save();
};

smsIntegrationSchema.methods.resetDailyUsage = function() {
    this.usage.messagesSentToday = 0;
    this.usage.lastResetDate = new Date();
    return this.save();
};

// Static methods
smsIntegrationSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId, isEnabled: true });
};

smsIntegrationSchema.statics.findActiveByProvider = function(organizationId, provider) {
    return this.findOne({
        organizationId,
        provider,
        isConnected: true,
        isEnabled: true
    });
};

const SMSIntegration = mongoose.model('SMSIntegration', smsIntegrationSchema);

export default SMSIntegration;