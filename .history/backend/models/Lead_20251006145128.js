import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    type: String,
    content: String,
    timestamp: Date,
    authorId: Number,
});

const scheduledMessageSchema = new mongoose.Schema({
    type: String,
    content: String,
    scheduledAt: Date,
    status: String,
});

const leadSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  alternatePhone: { type: String },
  city: { type: String },
  course: { type: String },
  company: { type: String },
  source: { type: String, required: true },
  stage: { type: String, required: true },
  followUpStatus: { type: String },
  score: { type: Number, default: 0 },
  tags: [String],
  assignedToId: { type: Number, required: true, index: true },
  dealValue: { type: Number, default: 0 },
  closeDate: { type: Date },
  activities: [activitySchema],
  scheduledMessages: [scheduledMessageSchema],
  campaign: { type: String },
  facebookCampaign: { type: String },
  facebookAdset: { type: String },
  facebookAd: { type: String },
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;



