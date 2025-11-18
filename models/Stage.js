import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
});

const Stage = mongoose.model('Stage', stageSchema);

export default Stage;



