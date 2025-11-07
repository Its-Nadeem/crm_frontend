import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isEnabled: { type: Boolean, default: true },
    trigger: {
        type: { type: String, required: true },
        hours: Number,
        toStage: String,
        score: Number,
    },
    conditions: [{
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed,
        logic: String,
    }],
    action: {
        type: { type: String, required: true },
        userId: Number,
        teamId: String,
        tag: String,
        url: String,
        title: String,
        dueDays: Number,
    },
    organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

export default AutomationRule;



