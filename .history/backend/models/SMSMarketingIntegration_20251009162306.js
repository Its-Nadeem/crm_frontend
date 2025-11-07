import mongoose from 'mongoose';

const smsMarketingIntegrationSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },

    // Provider details
    provider: {
        type: String,
        required: true,
        enum: ['twilio', 'aws-sns', 'msg91', 'textlocal', 'nexmo', 'custom'],
        index: true
    },

    // API Configuration
    apiKey: { type: String, required: true },
    apiSecret: { type: String, required: true },
    accountSid: { type: String },
    authToken: { type: String },
    senderId: { type: String },

    // SMS Configuration
    smsSettings: {
        defaultSenderId: { type: String },
        messageTemplates: [{
            name: { type: String, required: true },
            template: { type: String, required: true },
            variables: [String],
            category: { type: String, enum: ['promotional', 'transactional'], default: 'transactional' }
        }],
        unicodeSupport: { type: Boolean, default: true },
        maxMessageLength: { type: Number, default: 160 }
    },

    // Phone Number Pools
    phoneNumberPools: [{
        poolName: { type: String, required: true },
        numbers: [{
            number: { type: String, required: true },
            country: { type: String, required: true },
            capabilities: {
                sms: { type: Boolean, default: true },
                voice: { type: Boolean, default: false },
                mms: { type: Boolean, default: false }
            },
            isActive: { type: Boolean, default: true },
            addedAt: { type: Date, default: Date.now }
        }],
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],

    // Campaign Settings
    campaignDefaults: {
        trackDelivery: { type: Boolean, default: true },
        trackClicks: { type: Boolean, default: true },
        shortUrlEnabled: { type: Boolean, default: false },
        unsubscribeText: { type: String, default: 'Reply STOP to unsubscribe' }
    },

    // Webhook Configuration
    webhookUrl: { type: String },
    webhookEvents: [{
        type: String,
        enum: ['sms.sent', 'sms.delivered', 'sms.failed', 'sms.bounced', 'sms.opted_out']
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
        totalSMS: { type: Number, default: 0 },
        totalCampaigns: { type: Number, default: 0 },
        totalDelivered: { type: Number, default: 0 },
        totalFailed: { type: Number, default: 0 },
        lastUsed: { type: Date }
    },

    // Rate Limiting
    rateLimit: {
        smsPerMinute: { type: Number, default: 100 },
        smsPerHour: { type: Number, default: 1000 },
        smsPerDay: { type: Number, default: 10000 }
    },

    // DND (Do Not Disturb) Settings
    dndSettings: {
        respectDND: { type: Boolean, default: true },
        dndHours: {
            start: { type: String, default: '22:00' }, // 10 PM
            end: { type: String, default: '08:00' }    // 8 AM
        },
        allowedCategories: [{
            type: String,
            enum: ['transactional', 'service', 'emergency']
        }]
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
smsMarketingIntegrationSchema.index({ organizationId: 1, provider: 1 });
smsMarketingIntegrationSchema.index({ organizationId: 1, status: 1 });
smsMarketingIntegrationSchema.index({ 'phoneNumberPools.numbers.number': 1 });

// Methods
smsMarketingIntegrationSchema.methods.updateUsageStats = function(smsCount = 1, delivered = 0, failed = 0) {
    this.usageStats.totalSMS += smsCount;
    this.usageStats.totalDelivered += delivered;
    this.usageStats.totalFailed += failed;
    this.usageStats.lastUsed = new Date();
    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.addPhoneNumberToPool = function(poolName, number, country, capabilities = {}) {
    let pool = this.phoneNumberPools.find(p => p.poolName === poolName && p.isActive);

    if (!pool) {
        pool = {
            poolName,
            numbers: [],
            isActive: true,
            createdAt: new Date()
        };
        this.phoneNumberPools.push(pool);
    }

    pool.numbers.push({
        number,
        country,
        capabilities: { sms: true, ...capabilities },
        isActive: true,
        addedAt: new Date()
    });

    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.addSMSTemplate = function(name, template, variables = [], category = 'transactional') {
    this.smsSettings.messageTemplates.push({
        name,
        template,
        variables,
        category
    });
    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.updateHealthCheck = function(status, responseTime, errorMessage = null) {
    this.lastHealthCheck = new Date();
    this.healthCheckResult = {
        status,
        responseTime,
        errorMessage
    };
    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.setError = function(message, code = null) {
    this.lastError = {
        message,
        code,
        timestamp: new Date()
    };
    this.status = 'error';
    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.activate = function() {
    this.status = 'active';
    this.updatedAt = new Date();
};

smsMarketingIntegrationSchema.methods.deactivate = function() {
    this.status = 'inactive';
    this.updatedAt = new Date();
};

// Static methods
smsMarketingIntegrationSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId }).sort({ createdAt: -1 });
};

smsMarketingIntegrationSchema.statics.findActiveByOrganization = function(organizationId) {
    return this.find({ organizationId, status: 'active' }).sort({ createdAt: -1 });
};

smsMarketingIntegrationSchema.statics.findByProvider = function(provider) {
    return this.find({ provider, status: 'active' }).sort({ createdAt: -1 });
};

const SMSMarketingIntegration = mongoose.model('SMSMarketingIntegration', smsMarketingIntegrationSchema);

export default SMSMarketingIntegration;


