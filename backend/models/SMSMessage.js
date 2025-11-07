import mongoose from 'mongoose';

const smsMessageSchema = new mongoose.Schema({
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    integrationId: {
        type: String,
        required: true,
        index: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    to: {
        type: String,
        required: true,
        index: true
    },
    from: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1600 // Standard SMS limit
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed', 'undelivered'],
        default: 'pending',
        index: true
    },
    provider: {
        type: String,
        required: true,
        enum: ['twilio', 'msg91', 'textlocal', 'aws-sns', 'nexmo']
    },
    providerMessageId: {
        type: String,
        sparse: true
    },
    cost: {
        type: mongoose.Decimal128,
        default: 0
    },
    segments: {
        type: Number,
        default: 1,
        min: 1
    },
    type: {
        type: String,
        enum: ['single', 'bulk', 'marketing', 'transactional'],
        default: 'single'
    },
    listId: {
        type: String,
        sparse: true
    },
    campaignId: {
        type: String,
        sparse: true
    },
    metadata: {
        userAgent: { type: String },
        ipAddress: { type: String },
        source: { type: String, default: 'api' }, // api, webhook, scheduled
        tags: [{ type: String }],
        customData: { type: mongoose.Schema.Types.Mixed }
    },
    delivery: {
        sentAt: { type: Date },
        deliveredAt: { type: Date },
        failedAt: { type: Date },
        errorCode: { type: String },
        errorMessage: { type: String },
        retryCount: { type: Number, default: 0 },
        lastRetryAt: { type: Date }
    },
    analytics: {
        clicked: { type: Boolean, default: false },
        clickedAt: { type: Date },
        linkClicks: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'smsmessages'
});

// Indexes for performance
smsMessageSchema.index({ organizationId: 1, createdAt: -1 });
smsMessageSchema.index({ organizationId: 1, status: 1 });
smsMessageSchema.index({ integrationId: 1, createdAt: -1 });
smsMessageSchema.index({ to: 1, createdAt: -1 });
smsMessageSchema.index({ status: 1, createdAt: -1 });
smsMessageSchema.index({ 'delivery.sentAt': 1 });

// Instance methods
smsMessageSchema.methods.markDelivered = function(deliveredAt = new Date()) {
    this.status = 'delivered';
    this.delivery.deliveredAt = deliveredAt;
    return this.save();
};

smsMessageSchema.methods.markFailed = function(errorCode, errorMessage, failedAt = new Date()) {
    this.status = 'failed';
    this.delivery.failedAt = failedAt;
    this.delivery.errorCode = errorCode;
    this.delivery.errorMessage = errorMessage;
    return this.save();
};

smsMessageSchema.methods.markSent = function(sentAt = new Date()) {
    this.status = 'sent';
    this.delivery.sentAt = sentAt;
    return this.save();
};

smsMessageSchema.methods.retry = function() {
    this.delivery.retryCount += 1;
    this.delivery.lastRetryAt = new Date();
    return this.save();
};

// Static methods
smsMessageSchema.statics.findByOrganization = function(organizationId, limit = 50) {
    return this.find({ organizationId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

smsMessageSchema.statics.findByStatus = function(organizationId, status, limit = 50) {
    return this.find({ organizationId, status })
        .sort({ createdAt: -1 })
        .limit(limit);
};

smsMessageSchema.statics.getDeliveryStats = function(organizationId, startDate, endDate) {
    const match = { organizationId };
    if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
    }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalCost: { $sum: { $toDouble: '$cost' } }
            }
        }
    ]);
};

smsMessageSchema.statics.getMonthlyUsage = function(organizationId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return this.find({
        organizationId,
        createdAt: { $gte: startDate, $lt: endDate }
    }).countDocuments();
};

const SMSMessage = mongoose.model('SMSMessage', smsMessageSchema);

export default SMSMessage;