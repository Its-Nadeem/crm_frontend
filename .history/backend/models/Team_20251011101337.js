import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    leadId: { type: Number, required: true },
    memberIds: [{ type: Number }],
    organizationId: { type: String, required: true, index: true },
});

const Team = mongoose.model('Team', teamSchema);

export default Team;



