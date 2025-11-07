import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['text', 'number', 'date', 'dropdown'] },
    options: [String],
    isMappable: { type: Boolean, default: false },
    isRequired: { type: Boolean, default: false },
    organizationId: { type: String, required: true, index: true },
});

const CustomField = mongoose.model('CustomField', customFieldSchema);

export default CustomField;



