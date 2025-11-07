import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    leadId: { type: Number, required: true },
    memberIds: [{ type: Number }],
    organizationId: { type: String, required: true, index: true },
});

// Pre-save hook to generate ID if not provided
teamSchema.pre('save', function(next) {
    if (this.isNew && !this.id) {
        this.id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

const Team = mongoose.model('Team', teamSchema);

export default Team;



