import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    content: { type: String, required: true },
    leadId: { type: String, required: true, index: true },
    authorId: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);

export default Note;


