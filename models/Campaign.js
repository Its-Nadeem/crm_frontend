import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  templateId: { type: String }, // Corresponds to Template._id
  scriptId: { type: String }, // Corresponds to Template._id for CallCampaign
  status: { type: String, required: true, enum: ['DRAFT', 'SENT', 'SCHEDULED'] },
  sentAt: { type: Date },
  scheduledAt: { type: Date },
  recipientCount: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 }, // Email
  deliveryRate: { type: Number, default: 0 }, // SMS/WhatsApp
  connectionRate: { type: Number, default: 0 }, // Call
  conditions: [{
    field: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed,
    logic: String
  }],
  type: { type: String, required: true, enum: ['Email', 'SMS', 'WhatsApp', 'Call'] },
  organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;



