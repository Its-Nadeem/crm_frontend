import mongoose from 'mongoose';

const customDomainSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    required: true
  },
  sslCertificate: {
    type: String, // Path to SSL certificate file
    default: null
  },
  sslKey: {
    type: String, // Path to SSL key file
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customDomainSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
customDomainSchema.index({ organizationId: 1 });
customDomainSchema.index({ domain: 1 });
customDomainSchema.index({ isVerified: 1 });

const CustomDomain = mongoose.model('CustomDomain', customDomainSchema);

export default CustomDomain;