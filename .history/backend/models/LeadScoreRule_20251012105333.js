import mongoose from 'mongoose';

const leadScoreRuleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: String },
    points: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
});

const LeadScoreRule = mongoose.model('LeadScoreRule', leadScoreRuleSchema);

export default LeadScoreRule;



