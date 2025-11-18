import mongoose from 'mongoose';

const webhookDeliveryLogSchema = new mongoose.Schema({
    webhookId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebhookConfig', required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    event: { type: String, required: true },
    deliveryId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    headers: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    statusCode: { type: Number },
    responseBody: { type: String },
    errorMessage: { type: String },
    responseTimeMs: { type: Number },
    attemptNumber: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 5 },
    nextRetryAt: { type: Date },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient querying
webhookDeliveryLogSchema.index({ webhookId: 1, createdAt: -1 });
webhookDeliveryLogSchema.index({ organizationId: 1, createdAt: -1 });
webhookDeliveryLogSchema.index({ status: 1, nextRetryAt: 1 });

// Method to mark as completed
webhookDeliveryLogSchema.methods.markCompleted = function(status, statusCode, responseBody, responseTimeMs, errorMessage) {
    this.status = status;
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.responseTimeMs = responseTimeMs;
    this.errorMessage = errorMessage;
    this.completedAt = new Date();

    if (status === 'failed' && this.attemptNumber < this.maxAttempts) {
        // Calculate next retry time with exponential backoff
        const backoffMinutes = Math.pow(2, this.attemptNumber - 1) * 1; // 1m, 2m, 4m, 8m, 16m
        this.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
        this.status = 'pending';
    }
};

// Method to mark as success
webhookDeliveryLogSchema.methods.markSuccess = function(statusCode, responseBody, responseTimeMs) {
    this.markCompleted('success', statusCode, responseBody, responseTimeMs);
};

// Method to mark as failed
webhookDeliveryLogSchema.methods.markFailed = function(statusCode, errorMessage, responseTimeMs) {
    this.markCompleted('failed', statusCode, null, responseTimeMs, errorMessage);
    return this.save();
};

// Method to increment attempt number
webhookDeliveryLogSchema.methods.incrementAttempt = function() {
    this.attemptNumber += 1;
};

// Static method to get recent logs for a webhook
webhookDeliveryLogSchema.statics.getRecentLogs = function(webhookId, limit = 50) {
    console.log('Getting recent logs for webhookId:', webhookId);
    return this.find({ webhookId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .then(logs => {
            console.log('Found logs:', logs.length);
            return logs;
        });
};

// Static method to get failed deliveries ready for retry
webhookDeliveryLogSchema.statics.getPendingRetries = function() {
    return this.find({
        status: 'pending',
        nextRetryAt: { $lte: new Date() }
    }).sort({ nextRetryAt: 1 });
};

const WebhookDeliveryLog = mongoose.model('WebhookDeliveryLog', webhookDeliveryLogSchema);

export default WebhookDeliveryLog;


