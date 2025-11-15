import mongoose from 'mongoose';

const websiteFormSchema = new mongoose.Schema({
    formId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Draft'],
        default: 'Active'
    },
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    integrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IntegrationSettings',
        required: true
    },
    scriptId: {
        type: String,
        required: true,
        index: true
    },
    // Form configuration
    fields: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'email', 'tel', 'select', 'textarea', 'checkbox', 'radio', 'hidden']
        },
        required: {
            type: Boolean,
            default: false
        },
        label: String,
        placeholder: String,
        options: [String] // For select/radio fields
    }],
    // Tracking settings
    trackClicks: {
        type: Boolean,
        default: true
    },
    trackPageViews: {
        type: Boolean,
        default: true
    },
    autoTrackForms: {
        type: Boolean,
        default: true
    },
    // Performance metrics
    totalSubmissions: {
        type: Number,
        default: 0
    },
    uniqueSubmissions: {
        type: Number,
        default: 0
    },
    conversionRate: {
        type: Number,
        default: 0
    },
    averageCompletionTime: {
        type: Number,
        default: 0 // in seconds
    },
    bounceRate: {
        type: Number,
        default: 0
    },
    // Recent activity
    lastSubmission: {
        type: Date,
        default: null
    },
    recentSubmissions: [{
        id: String,
        timestamp: Date,
        userAgent: String,
        ipAddress: String,
        referrer: String,
        formData: mongoose.Schema.Types.Mixed
    }],
    // Advanced tracking
    customEvents: [{
        name: String,
        count: {
            type: Number,
            default: 0
        },
        lastTriggered: Date
    }],
    // A/B testing
    abTestEnabled: {
        type: Boolean,
        default: false
    },
    abTestVariants: [{
        name: String,
        traffic: {
            type: Number,
            default: 50 // percentage
        },
        conversions: {
            type: Number,
            default: 0
        }
    }],
    // Integration settings
    webhookUrl: String,
    notificationEmails: [String],
    autoAssign: {
        type: Boolean,
        default: false
    },
    assignToUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Lead scoring
    leadScore: {
        type: Number,
        default: 0
    },
    scoringRules: [{
        field: String,
        condition: String,
        value: String,
        score: Number
    }],
    // Validation rules
    validationRules: [{
        field: String,
        rule: String,
        message: String
    }],
    // Spam protection
    captchaEnabled: {
        type: Boolean,
        default: false
    },
    honeypotEnabled: {
        type: Boolean,
        default: true
    },
    rateLimiting: {
        enabled: {
            type: Boolean,
            default: false
        },
        maxSubmissions: {
            type: Number,
            default: 5
        },
        timeWindow: {
            type: Number,
            default: 3600 // seconds
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
websiteFormSchema.index({ organizationId: 1, status: 1 });
websiteFormSchema.index({ scriptId: 1, formId: 1 }, { unique: true });
websiteFormSchema.index({ 'recentSubmissions.timestamp': -1 });
websiteFormSchema.index({ totalSubmissions: -1 });
websiteFormSchema.index({ conversionRate: -1 });

// Virtual for form performance
websiteFormSchema.virtual('performance').get(function() {
    return {
        conversionRate: this.totalSubmissions,
        trend: this.recentSubmissions.length > 1 ?
            (this.recentSubmissions[0].timestamp - this.recentSubmissions[this.recentSubmissions.length - 1].timestamp) / (1000 * 60 * 60 * 24) : 0,
        engagement: this.customEvents.reduce((sum, event) => sum + event.count, 0)
    };
});

// Pre-save middleware to update computed metrics
websiteFormSchema.pre('save', function(next) {
    // Update last activity timestamp
    if (this.recentSubmissions.length > 0) {
        this.lastSubmission = this.recentSubmissions[0].timestamp;
    }

    // Keep only recent submissions (last 100)
    if (this.recentSubmissions.length > 100) {
        this.recentSubmissions = this.recentSubmissions.slice(0, 100);
    }

    next();
});

// Static methods
websiteFormSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId });
};

websiteFormSchema.statics.findByScriptId = function(scriptId) {
    return this.find({ scriptId });
};

websiteFormSchema.statics.findActive = function(organizationId) {
    return this.find({ organizationId, status: 'Active' });
};

websiteFormSchema.statics.getTopPerforming = function(organizationId, limit = 10) {
    return this.find({ organizationId, status: 'Active' })
        .sort({ totalSubmissions: -1, conversionRate: -1 })
        .limit(limit);
};

websiteFormSchema.statics.getWithAnalytics = function(organizationId, startDate, endDate) {
    const matchStage = {
        organizationId,
        status: 'Active'
    };

    if (startDate && endDate) {
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    return this.aggregate([
        { $match: matchStage },
        {
            $project: {
                name: 1,
                url: 1,
                totalSubmissions: 1,
                conversionRate: 1,
                lastSubmission: 1,
                customEvents: 1,
                recentSubmissions: {
                    $filter: {
                        input: '$recentSubmissions',
                        as: 'submission',
                        cond: {
                            $and: [
                                { $gte: ['$$submission.timestamp', startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                                { $lte: ['$$submission.timestamp', endDate || new Date()] }
                            ]
                        }
                    }
                }
            }
        }
    ]);
};

// Instance methods
websiteFormSchema.methods.addSubmission = function(submissionData) {
    this.totalSubmissions += 1;

    // Add to recent submissions
    this.recentSubmissions.unshift({
        id: submissionData.id,
        timestamp: new Date(),
        userAgent: submissionData.userAgent,
        ipAddress: submissionData.ipAddress,
        referrer: submissionData.referrer,
        formData: submissionData.formData
    });

    // Keep only recent submissions
    if (this.recentSubmissions.length > 100) {
        this.recentSubmissions = this.recentSubmissions.slice(0, 100);
    }

    this.lastSubmission = new Date();
    return this.save();
};

websiteFormSchema.methods.recordCustomEvent = function(eventName) {
    const existingEvent = this.customEvents.find(event => event.name === eventName);

    if (existingEvent) {
        existingEvent.count += 1;
        existingEvent.lastTriggered = new Date();
    } else {
        this.customEvents.push({
            name: eventName,
            count: 1,
            lastTriggered: new Date()
        });
    }

    return this.save();
};

websiteFormSchema.methods.updatePerformanceMetrics = function() {
    // Calculate conversion rate based on page views vs submissions
    // This would need page view data from another collection
    // For now, we'll use a simple calculation
    this.conversionRate = this.totalSubmissions;

    return this.save();
};

const WebsiteForm = mongoose.model('WebsiteForm', websiteFormSchema);

export default WebsiteForm;


