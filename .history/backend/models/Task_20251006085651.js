import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    assignedToId: { type: Number, required: true, index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    createdById: { type: Number, required: true },
    organizationId: { type: String, required: true, index: true },
    batchId: { type: String },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

export default Task;



