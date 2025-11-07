import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true, unique: true },
  isEnabled: { type: Boolean, default: true },
  subscriptionPlanId: { type: String, required: true },
  subscriptionExpiresAt: { type: Date, required: true },
  logoUrl: { type: String },
  themeColor: { type: String },
  hasBlogAccess: { type: Boolean, default: false },
  manuallyAssignedFeatures: [{type: String}]
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;



