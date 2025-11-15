import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    monthlyPrice: { type: Number, required: true },
    featureTag: { type: String, required: true, unique: true },
}, { timestamps: true });

const Addon = mongoose.model('Addon', addonSchema);

export default Addon;



