import mongoose from 'mongoose';

const phoneListSchema = new mongoose.Schema({
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        default: 'US',
        uppercase: true
    },
    totalContacts: {
        type: Number,
        default: 0,
        min: 0
    },
    activeContacts: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        source: { type: String, default: 'manual' }, // manual, import, api
        lastImportDate: { type: Date },
        createdBy: { type: String }
    }
}, {
    timestamps: true,
    collection: 'phonelists'
});

// Indexes
phoneListSchema.index({ organizationId: 1, name: 1 });
phoneListSchema.index({ organizationId: 1, isActive: 1 });
phoneListSchema.index({ tags: 1 });

// Instance methods
phoneListSchema.methods.addContact = function(phoneNumber, contactData = {}) {
    // This would be implemented with a separate PhoneContact model
    // For now, just increment counters
    this.totalContacts += 1;
    this.activeContacts += 1;
    return this.save();
};

phoneListSchema.methods.removeContact = function(phoneNumber) {
    if (this.totalContacts > 0) {
        this.totalContacts -= 1;
        this.activeContacts = Math.max(0, this.activeContacts - 1);
    }
    return this.save();
};

// Static methods
phoneListSchema.statics.findActiveByOrganization = function(organizationId) {
    return this.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
};

phoneListSchema.statics.findByTag = function(organizationId, tag) {
    return this.find({
        organizationId,
        isActive: true,
        tags: tag
    });
};

const PhoneList = mongoose.model('PhoneList', phoneListSchema);

export default PhoneList;