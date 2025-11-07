import mongoose from 'mongoose';

const facebookActivityLogSchema = new mongoose.Schema({
    organizationId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    pageId: { type: String, required: true, index: true },
    formId: { type: String, index: true },
    formName: { type: String },
    campaignId: { type: String, index: true },
    campaignName: { type: String },
    leadId: { type: String, index: true },
    leadData: {
        name: String,
        email: String,
        phone: String
    },
    activityType: {
        type: String,
        enum: [
            'lead_received',
            'lead_processed',
            'lead_synced',
            'sync_started',
            'sync_completed',
            'sync_failed',
            'form_mapping_created',
            'form_mapping_updated',
            'webhook_received',
            'error_occurred'
        ],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending', 'skipped'],
        default: 'pending',
        index: true
    },
    description: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    errorMessage: { type: String },
    metadata: {
        userAgent: String,
        ipAddress: String,
        processingTimeMs: Number,
        retryCount: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient filtering
facebookActivityLogSchema.index({ organizationId: 1, createdAt: -1 });
facebookActivityLogSchema.index({ organizationId: 1, activityType: 1, createdAt: -1 });
facebookActivityLogSchema.index({ organizationId: 1, formId: 1, createdAt: -1 });
facebookActivityLogSchema.index({ organizationId: 1, campaignId: 1, createdAt: -1 });
facebookActivityLogSchema.index({ organizationId: 1, leadId: 1, createdAt: -1 });

// Static method to get activity logs with filtering
facebookActivityLogSchema.statics.getActivityLogs = function(filters = {}, options = {}) {
    const {
        organizationId,
        activityType,
        status,
        formId,
        formName,
        campaignId,
        campaignName,
        leadId,
        startDate,
        endDate
    } = filters;

    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    let query = {};

    // Required filter
    if (organizationId) {
        query.organizationId = organizationId;
    }

    // Optional filters
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;
    if (formId) query.formId = formId;
    if (formName) query.formName = { $regex: formName, $options: 'i' };
    if (campaignId) query.campaignId = campaignId;
    if (campaignName) query.campaignName = { $regex: campaignName, $options: 'i' };
    if (leadId) query.leadId = leadId;

    // Date range filter
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    return this.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
};

// Static method to get activity summary
facebookActivityLogSchema.statics.getActivitySummary = function(organizationId, startDate, endDate) {
    const matchStage = { organizationId };

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$activityType',
                count: { $sum: 1 },
                successCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
                },
                failedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                }
            }
        }
    ]);
};

// Method to update activity status
facebookActivityLogSchema.methods.updateStatus = function(status, errorMessage = null) {
    this.status = status;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();

    if (status === 'failed') {
        this.retryCount = (this.retryCount || 0) + 1;
    }
};

const FacebookActivityLog = mongoose.model('FacebookActivityLog', facebookActivityLogSchema);

export default FacebookActivityLog;


