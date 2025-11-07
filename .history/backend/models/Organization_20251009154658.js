import mongoose from 'mongoose';
import crypto from 'crypto';

const organizationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  apiKey: { type: String, unique: true, sparse: true },
  apiKeyStatus: { type: String, enum: ['active', 'revoked'], default: 'active' },
  apiKeyLastUsed: { type: Date },
  subscriptionPlanId: { type: String, required: true },
  subscriptionExpiresAt: { type: Date, required: true },
  logoUrl: { type: String },
  themeColor: { type: String },
  hasBlogAccess: { type: Boolean, default: false },
  manuallyAssignedFeatures: [{type: String}],
  // Meta/Facebook settings (placeholder for future)
  metaSettings: {
    pixelId: { type: String },
    accessToken: { type: String },
    testCode: { type: String }
  }
}, { timestamps: true });

// Generate API key for organization
organizationSchema.methods.generateApiKey = function() {
  this.apiKey = `org_${crypto.randomBytes(32).toString('hex')}`;
  this.apiKeyStatus = 'active';
  this.apiKeyLastUsed = new Date();
  return this.apiKey;
};

// Regenerate API key
organizationSchema.methods.regenerateApiKey = function() {
  return this.generateApiKey();
};

// Revoke API key
organizationSchema.methods.revokeApiKey = function() {
  this.apiKeyStatus = 'revoked';
};

// Check if API key is active
organizationSchema.methods.isApiKeyActive = function() {
  return this.apiKeyStatus === 'active' && this.apiKey;
};

// Update last used timestamp
organizationSchema.methods.updateApiKeyLastUsed = function() {
  this.apiKeyLastUsed = new Date();
};

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;



