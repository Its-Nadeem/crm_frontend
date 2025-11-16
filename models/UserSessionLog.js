import mongoose from 'mongoose';

const userSessionLogSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  organizationId: {
    type: String,
    required: true,
    index: true
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  checkpoints: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event: {
      type: String,
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSessionLogSchema.index({ userId: 1, loginTime: -1 });
userSessionLogSchema.index({ organizationId: 1, loginTime: -1 });

export default mongoose.model('UserSessionLog', userSessionLogSchema);