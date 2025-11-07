import mongoose from 'mongoose';

const facebookPageSchema = new mongoose.Schema({
    pageId: { type: String, required: true },
    pageName: { type: String, required: true },
    pageAccessToken: { type: String, required: true },
    instagramBusinessAccount: { type: String },
    subscribed: { type: Boolean, default: false },
    subscribedAt: { type: Date }
}, { _id: false });

const facebookFormSchema = new mongoose.Schema({
    formId: { type: String, required: true },
    formName: { type: String, required: true },
    pageId: { type: String, required: true },
    fieldMapping: {
        type: Map,
        of: String,
        default: new Map()
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const facebookIntegrationSchema = new mongoose.Schema({
    tenantId: { type: String, required: true, index: true },
    fbUserId: { type: String, required: true },
    accountName: { type: String, default: 'Facebook Account' },
    accountEmail: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    longLivedToken: { type: String, required: true },
    pages: [facebookPageSchema],
    forms: [facebookFormSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness per tenant
facebookIntegrationSchema.index({ tenantId: 1, fbUserId: 1 }, { unique: true });

// Method to find integration by page ID (for webhook lookup)
facebookIntegrationSchema.statics.findByPageId = async function(pageId) {
    return this.findOne({
        'pages.pageId': pageId
    });
};

// Method to get page access token by page ID
facebookIntegrationSchema.methods.getPageAccessToken = function(pageId) {
    const page = this.pages.find(p => p.pageId === pageId);
    return page ? page.pageAccessToken : null;
};

// Method to check if page is subscribed
facebookIntegrationSchema.methods.isPageSubscribed = function(pageId) {
    const page = this.pages.find(p => p.pageId === pageId);
    return page ? page.subscribed : false;
};

const FacebookIntegration = mongoose.model('FacebookIntegration', facebookIntegrationSchema);

export default FacebookIntegration;


