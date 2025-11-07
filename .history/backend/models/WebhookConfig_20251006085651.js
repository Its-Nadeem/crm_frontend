import mongoose from 'mongoose';

const webhookConfigSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
    organizationId: { type: String, required: true, index: true },
});

const WebhookConfig = mongoose.model('WebhookConfig', webhookConfigSchema);

export default WebhookConfig;



