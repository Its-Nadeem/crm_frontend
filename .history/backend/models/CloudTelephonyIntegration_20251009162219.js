import mongoose from 'mongoose';

const cloudTelephonyIntegrationSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },

    // Provider details
    provider: {
        type: String,
        required: true,
        enum: ['twilio', 'plivo', 'exotel', 'knowlarity', 'custom'],
        index: true
    },

    // API Configuration
    apiKey: { type: String, required: true },
    apiSecret: { type: String, required: true },
    accountSid: { type: String },
    authToken: { type: String },
    baseUrl: { type: String, default: 'https://api.twilio.com' },

    // Phone Numbers
    phoneNumbers: [{
        number: { type: String, required: true },
        friendlyName: { type: String },
        capabilities: {
            sms: { type: Boolean, default: false },
            voice: { type: Boolean, default: false },
            mms: { type: Boolean, default: false }
        },
        isActive: { type: Boolean, default: true },
        addedAt: { type: Date, default: Date.now }
    }],

    // Call Settings
    callSettings: {
        defaultCallerId: { type: String },
        recordingEnabled: { type: Boolean, default: false },
        maxCallDuration: { type: Number, default: 3600 }, // seconds
        ringTimeout: { type: Number, default: 30 }, // seconds
        retryAttempts: { type: Number, default: 3 }
    },

    // SMS Settings
    smsSettings: {
        defaultSenderId: { type: String },
        messageTemplates: [{
            name: { type: String, required: true },
            template: { type: String, required: true },
            variables: [String]
        }]
    },

    // Webhook Configuration
    webhookUrl: { type: String },
    webhookEvents: [{
        type: String,
        enum: ['call.initiated', 'call.ringing', 'call.answered', 'call.completed', 'call.failed', 'sms.sent', 'sms.delivered', 'sms.failed']
    }],

    // Status and Health
    status: {
        type: String,
        enum: ['active', 'inactive', 'error', 'maintenance'],
        default: 'inactive',
        index: true
    },
    lastHealthCheck: { type: Date },
    healthCheckResult: {
        status: { type: String, enum: ['healthy', 'unhealthy'] },
        responseTime: { type: Number },
        errorMessage: { type: String }
    },

    // Usage Statistics
    usageStats: {
        totalCalls: { type: Number, default: 0 },
        totalSMS: { type: Number, default: 0 },
        totalMinutes: { type: Number, default: 0 },
        lastUsed: { type: Date }
    },

    // Error Tracking
    lastError: {
        message: { type: String },
        code: { type: String },
        timestamp: { type: Date }
    },

    // Metadata
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    notes: { type: String },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
cloudTelephonyIntegrationSchema.index({ organizationId: 1, provider: 1 });
cloudTelephonyIntegrationSchema.index({ organizationId: 1, status: 1 });
cloudTelephonyIntegrationSchema.index({ 'phoneNumbers.number': 1 });

// Methods
cloudTelephonyIntegrationSchema.methods.updateUsageStats = function(type, duration = 0) {
    if (type === 'call') {
        this.usageStats.totalCalls += 1;
        this.usageStats.totalMinutes += duration / 60;
    } else if (type === 'sms') {
        this.usageStats.totalSMS += 1;
    }
    this.usageStats.lastUsed = new Date();
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.addPhoneNumber = function(number, friendlyName, capabilities = {}) {
    this.phoneNumbers.push({
        number,
        friendlyName,
        capabilities,
        isActive: true,
        addedAt: new Date()
    });
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.removePhoneNumber = function(number) {
    this.phoneNumbers = this.phoneNumbers.filter(pn => pn.number !== number);
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.updateHealthCheck = function(status, responseTime, errorMessage = null) {
    this.lastHealthCheck = new Date();
    this.healthCheckResult = {
        status,
        responseTime,
        errorMessage
    };
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.setError = function(message, code = null) {
    this.lastError = {
        message,
        code,
        timestamp: new Date()
    };
    this.status = 'error';
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.activate = function() {
    this.status = 'active';
    this.updatedAt = new Date();
};

cloudTelephonyIntegrationSchema.methods.deactivate = function() {
    this.status = 'inactive';
    this.updatedAt = new Date();
};

// Static methods
cloudTelephonyIntegrationSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId }).sort({ createdAt: -1 });
};

cloudTelephonyIntegrationSchema.statics.findActiveByOrganization = function(organizationId) {
    return this.find({ organizationId, status: 'active' }).sort({ createdAt: -1 });
};

cloudTelephonyIntegrationSchema.statics.findByProvider = function(provider) {
    return this.find({ provider, status: 'active' }).sort({ createdAt: -1 });
};

const CloudTelephonyIntegration = mongoose.model('CloudTelephonyIntegration', cloudTelephonyIntegrationSchema);

export default CloudTelephonyIntegration;


