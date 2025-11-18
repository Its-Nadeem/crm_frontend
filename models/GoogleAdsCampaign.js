import mongoose from 'mongoose';

const googleAdsCampaignSchema = new mongoose.Schema({
    campaignId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ENABLED', 'PAUSED', 'REMOVED'],
        default: 'ENABLED'
    },
    budget: {
        type: Number,
        default: 0
    },
    targetCpa: {
        type: Number,
        default: null
    },
    impressions: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    conversions: {
        type: Number,
        default: 0
    },
    cost: {
        type: Number,
        default: 0
    },
    customerId: {
        type: String,
        required: true,
        index: true
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
    // Additional campaign details
    campaignType: {
        type: String,
        default: 'SEARCH'
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    biddingStrategy: {
        type: String,
        default: 'MANUAL_CPC'
    },
    // Performance metrics
    ctr: {
        type: Number,
        default: 0
    },
    averageCpc: {
        type: Number,
        default: 0
    },
    conversionRate: {
        type: Number,
        default: 0
    },
    costPerConversion: {
        type: Number,
        default: 0
    },
    // Sync information
    lastSynced: {
        type: Date,
        default: Date.now
    },
    syncStatus: {
        type: String,
        enum: ['success', 'error', 'pending'],
        default: 'pending'
    },
    syncError: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
googleAdsCampaignSchema.index({ organizationId: 1, customerId: 1 });
googleAdsCampaignSchema.index({ integrationId: 1, campaignId: 1 }, { unique: true });
googleAdsCampaignSchema.index({ status: 1, lastSynced: -1 });

// Virtual for performance metrics
googleAdsCampaignSchema.virtual('performance').get(function() {
    return {
        ctr: this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0,
        averageCpc: this.clicks > 0 ? this.cost / this.clicks : 0,
        conversionRate: this.clicks > 0 ? (this.conversions / this.clicks) * 100 : 0,
        costPerConversion: this.conversions > 0 ? this.cost / this.conversions : 0,
        roi: this.conversions > 0 ? (this.conversions * 100) / this.cost : 0
    };
});

// Pre-save middleware to calculate computed metrics
googleAdsCampaignSchema.pre('save', function(next) {
    if (this.impressions > 0) {
        this.ctr = (this.clicks / this.impressions) * 100;
    }
    if (this.clicks > 0) {
        this.averageCpc = this.cost / this.clicks;
    }
    if (this.clicks > 0) {
        this.conversionRate = (this.conversions / this.clicks) * 100;
    }
    if (this.conversions > 0) {
        this.costPerConversion = this.cost / this.conversions;
    }

    next();
});

// Static method to get campaigns by organization
googleAdsCampaignSchema.statics.findByOrganization = function(organizationId) {
    return this.find({ organizationId });
};

// Static method to get campaigns by customer ID
googleAdsCampaignSchema.statics.findByCustomerId = function(customerId, organizationId) {
    return this.find({ customerId, organizationId });
};

// Static method to get active campaigns
googleAdsCampaignSchema.statics.findActive = function(organizationId) {
    return this.find({ organizationId, status: 'ENABLED' });
};

// Static method to get campaigns with performance data
googleAdsCampaignSchema.statics.getWithPerformance = function(organizationId, limit = 50) {
    return this.find({ organizationId })
        .sort({ conversions: -1, clicks: -1 })
        .limit(limit);
};

const GoogleAdsCampaign = mongoose.model('GoogleAdsCampaign', googleAdsCampaignSchema);

export default GoogleAdsCampaign;


