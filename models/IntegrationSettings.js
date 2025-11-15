import mongoose from 'mongoose';

const integrationSettingsSchema = new mongoose.Schema({
    source: { type: String, required: true },
    isConnected: { type: Boolean, default: false },
    fieldMappings: [{
        sourceField: String,
        crmField: String,
    }],
    connectedAccounts: [mongoose.Schema.Types.Mixed],
    connectedWebsites: [mongoose.Schema.Types.Mixed],
    organizationId: { type: String, required: true, index: true },
});

// Create a compound index to ensure one setting type per organization
integrationSettingsSchema.index({ source: 1, organizationId: 1 }, { unique: true });

const IntegrationSettings = mongoose.model('IntegrationSettings', integrationSettingsSchema);

export default IntegrationSettings;



