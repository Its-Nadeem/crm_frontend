import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'number', 'date', 'dropdown'] },
    options: [String],
    isMappable: { type: Boolean, default: true },
    isRequired: { type: Boolean, default: false },
    organizationId: { type: String, required: true, index: true },
    category: { type: String, default: 'general', enum: ['general', 'personal', 'business', 'integration', 'system'] },
    description: { type: String },
    validation: {
        minLength: { type: Number },
        maxLength: { type: Number },
        pattern: { type: String },
        customMessage: { type: String }
    },
    usage: {
        inImports: { type: Boolean, default: false },
        inFacebook: { type: Boolean, default: false },
        inGoogle: { type: Boolean, default: false },
        inWebsite: { type: Boolean, default: false },
        inAPI: { type: Boolean, default: false }
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
    updatedBy: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for getting field usage summary
customFieldSchema.virtual('usageSummary').get(function() {
    const usage = this.usage || {};
    return {
        total: Object.values(usage).filter(Boolean).length,
        integrations: Object.entries(usage)
            .filter(([key, value]) => value === true)
            .map(([key]) => key.replace('in', '').toUpperCase())
    };
});

// Index for better query performance
customFieldSchema.index({ organizationId: 1, isMappable: 1, isActive: 1 });
customFieldSchema.index({ organizationId: 1, category: 1 });

// Static method to get mappable fields for integrations
customFieldSchema.statics.getMappableFields = function(organizationId, integrationType = null) {
    const query = {
        organizationId,
        isMappable: true,
        isActive: true
    };

    if (integrationType) {
        const usageField = `usage.in${integrationType}`;
        query[usageField] = true;
    }

    return this.find(query).sort({ displayOrder: 1, createdAt: 1 });
};

// Static method to get fields for lead display
customFieldSchema.statics.getLeadDisplayFields = function(organizationId) {
    return this.find({
        organizationId,
        isMappable: true,
        isActive: true,
        'usage.inImports': true
    }).sort({ displayOrder: 1, createdAt: 1 });
};

const CustomField = mongoose.model('CustomField', customFieldSchema);

export default CustomField;



