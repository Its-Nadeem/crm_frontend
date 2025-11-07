import mongoose from 'mongoose';
import crypto from 'crypto';
import WebhookDeliveryLog from './WebhookDeliveryLog.js';

const webhookConfigSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    apiKey: { type: String, unique: true, sparse: true },
    secret: { type: String },
    events: [{
        type: String,
        enum: ['lead.created', 'lead.updated', 'lead.deleted', 'lead.stage_changed', 'lead.assigned', 'lead.received']
    }],
    headers: { type: Map, of: String, default: new Map() },
    isEnabled: { type: Boolean, default: true },
    organizationId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastTriggered: { type: Date },
    triggerCount: { type: Number, default: 0 }
});

// Generate API key and secret before saving
webhookConfigSchema.pre('save', function(next) {
    if (this.isNew && !this.apiKey) {
        this.apiKey = `wk_${crypto.randomBytes(32).toString('hex')}`;
        this.secret = crypto.randomBytes(64).toString('hex');
    }
    this.updatedAt = new Date();
    next();
});

// Method to verify webhook signature
webhookConfigSchema.methods.verifySignature = function(payload, signature, timestamp) {
    if (!this.secret) return false;

    const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${timestamp}.${JSON.stringify(payload)}`)
        .digest('hex');

    return signature === expectedSignature;
};

// Method to trigger webhook with delivery logging and retry logic
webhookConfigSchema.methods.trigger = async function(event, data) {
    if (!this.isEnabled || !this.events.includes(event)) {
        return { success: false, reason: 'Webhook disabled or event not subscribed' };
    }

    const deliveryId = `del_${crypto.randomBytes(16).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const payload = {
        event,
        timestamp,
        organizationId: this.organizationId,
        data
    };

    const headers = {
        'Content-Type': 'application/json',
        'X-Org-Id': this.organizationId,
        'X-Event-Type': event,
        'X-Signature': this.generateSignature(payload),
        'X-Delivery-Id': deliveryId,
        'X-Timestamp': timestamp,
        ...Object.fromEntries(this.headers)
    };

    // Create delivery log entry
    const deliveryLog = new WebhookDeliveryLog({
        webhookId: this._id,
        organizationId: this.organizationId,
        event,
        deliveryId,
        url: this.url,
        payload,
        headers,
        status: 'pending'
    });

    const startTime = Date.now();
    try {
        const response = await fetch(this.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const responseTime = Date.now() - startTime;

        const responseBody = await response.text();

        // Update delivery log
        if (response.ok) {
            deliveryLog.markSuccess(response.status, responseBody, responseTime);
        } else {
            deliveryLog.markFailed(response.status, `HTTP ${response.status}: ${responseBody}`, responseTime);
        }

        await deliveryLog.save();

        // Update webhook stats
        this.lastTriggered = new Date();
        this.triggerCount += 1;
        await this.save();

        return {
            success: response.ok,
            status: response.status,
            response: responseBody,
            deliveryId,
            responseTime
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;

        // Update delivery log with error
        deliveryLog.markFailed(0, error.message, responseTime);
        await deliveryLog.save();

        return {
            success: false,
            error: error.message,
            deliveryId,
            responseTime
        };
    }
};

// Method to generate signature for webhook payload
webhookConfigSchema.methods.generateSignature = function(payload) {
    if (!this.secret) return '';

    const timestamp = payload.timestamp;
    const payloadString = JSON.stringify(payload);

    return crypto
        .createHmac('sha256', this.secret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');
};

const WebhookConfig = mongoose.model('WebhookConfig', webhookConfigSchema);

export default WebhookConfig;



