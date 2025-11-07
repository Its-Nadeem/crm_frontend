import mongoose from 'mongoose';

const emailMarketingIntegrationSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },

    // Provider details
    provider: {
        type: String,
        required: true,
        enum: ['sendgrid', 'mailgun', 'amazon-ses', 'postmark', 'mailchimp', 'custom'],
        index: true
    },

    // API Configuration
    apiKey: { type: String, required: true },
    apiSecret: { type: String },
    region: { type: String, default: 'us-east-1' }, // for AWS SES
    domain: { type: String }, // for custom SMTP

    // SMTP Configuration (fallback)
    smtpSettings: {
        host: { type: String },
        port: { type: Number, default: 587 },
        username: { type: String },
        password: { type: String },
        encryption: { type: String, enum: ['tls', 'ssl', 'none'], default: 'tls' }
    },

    // Email Configuration
    fromEmail: { type: String, required: true },
    fromName: { type: String, required: true },
    replyToEmail: { type: String },

    // Templates and Lists
    emailTemplates: [{
        templateId: { type: String, required: true },
        name: { type: String, required: true },
        subject: { type: String, required: true },
        category: { type: String },
        variables: [String],
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],

    mailingLists: [{
        listId: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        subscriberCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],

    // Campaign Settings
    campaignDefaults: {
        trackOpens: { type: Boolean, default: true },
        trackClicks: { type: Boolean, default: true },
        unsubscribeUrl: { type: String },
        defaultTemplate: { type: String }
    },

    // Webhook Configuration
    webhookUrl: { type: String },
    webhookEvents: [{
        type: String,
        enum: ['email.delivered', 'email.bounced', 'email.opened', 'email.clicked', 'email.unsubscribed', 'email.spam']
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
        totalEmailsSent: { type: Number, default: 0 },
        totalCampaigns: { type: Number, default: 0 },
        totalSubscribers: { type: Number, default: 0 },
        lastUsed: { type: Date }
    },

    // Rate Limiting
    rateLimit: {
        emailsPerHour: { type: Number, default: 1000 },
        emailsPerDay: { type: Number, default: 10000 }
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
emailMarketingIntegrationSchema.index({ organizationId: 1, provider: 1 });
emailMarketingIntegrationSchema.index({ organizationId: 1, status: 1 });
emailMarketingIntegrationSchema.index({ fromEmail: 1 });

// Methods
emailMarketingIntegrationSchema.methods.updateUsageStats = function(emailsSent = 1, campaigns = 0) {
    this.usageStats.totalEmailsSent += emailsSent;
    this.usageStats.totalCampaigns += campaigns;
    this.usageStats.lastUsed = new Date();
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.addEmailTemplate = function(templateId, name, subject, variables = []) {
    this.emailTemplates.push({
        templateId,
        name,
        subject,
        variables,
        isActive: true,
        createdAt: new Date()
    });
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.addMailingList = function(listId, name, description = '') {
    this.mailingLists.push({
        listId,
        name,
        description,
        subscriberCount: 0,
        isActive: true,
        createdAt: new Date()
    });
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.updateHealthCheck = function(status, responseTime, errorMessage = null) {
    this.lastHealthCheck = new Date();
    this.healthCheckResult = {
        status,
        responseTime,
        errorMessage
    };
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.setError = function(message, code = null) {
    this.lastError = {
        message,
        code,
        timestamp: new Date()
    };
    this.status = 'error';
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.activate = function() {
    this.status = 'active';
    this.updatedAt = new Date();
};

emailMarketingIntegrationSchema.methods.deactivate = function() {
    this.status = 'inactive';
    this.updatedAt = new Date();
};

// Static methods
emailMarketingIntegrationSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId }).sort({ createdAt: -1 });
};

emailMarketingIntegrationSchema.statics.findActiveByOrganization = function(organizationId) {
    return this.find({ organizationId, status: 'active' }).sort({ createdAt: -1 });
};

emailMarketingIntegrationSchema.statics.findByProvider = function(provider) {
    return this.find({ provider, status: 'active' }).sort({ createdAt: -1 });
};

const EmailMarketingIntegration = mongoose.model('EmailMarketingIntegration', emailMarketingIntegrationSchema);


export default EmailMarketingIntegration;



