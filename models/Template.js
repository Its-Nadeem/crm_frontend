import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String }, // For Email
  body: { type: String, required: true },
  type: { type: String, required: true, enum: ['Email', 'SMS', 'WhatsApp', 'Call'] },
  organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);

export default Template;



