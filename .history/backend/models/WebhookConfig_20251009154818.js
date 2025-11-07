import mongoose from 'mongoose';
import crypto from 'crypto';

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

// Method to trigger webhook
webhookConfigSchema.methods.trigger = async function(event, data) {
    if (!this.isEnabled || !this.events.includes(event)) {
        return { success: false, reason: 'Webhook disabled or event not subscribed' };
    }

    try {
        const payload = {
            event,
            timestamp: new Date().toISOString(),
            organizationId: this.organizationId,
            data
        };

        const response = await fetch(this.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'X-Event': event,
                'X-Timestamp': payload.timestamp,
                'X-Signature': this.generateSignature(payload),
                ...Object.fromEntries(this.headers)
            },
            body: JSON.stringify(payload)
        });

        // Update trigger stats
        this.lastTriggered = new Date();
        this.triggerCount += 1;
        await this.save();

        return {
            success: response.ok,
            status: response.status,
            response: await response.text()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
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



