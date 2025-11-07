import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    actorId: {
        type: Number,
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    targetId: {
        type: String,
        index: true
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    organizationId: {
        type: String,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Add compound indexes for common queries
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;