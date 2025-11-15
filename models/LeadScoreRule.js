import mongoose from 'mongoose';

const leadScoreRuleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: String },
    points: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
});

// Ensure the id field is always included in JSON responses
leadScoreRuleSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        // Ensure id field is included
        if (doc.id) {
            ret.id = doc.id;
        }
        return ret;
    }
});

// Add a virtual for backward compatibility
leadScoreRuleSchema.virtual('ruleId').get(function() {
    return this.id;
});

const LeadScoreRule = mongoose.model('LeadScoreRule', leadScoreRuleSchema);

export default LeadScoreRule;



