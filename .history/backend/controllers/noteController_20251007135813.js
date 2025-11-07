
import Note from '../models/Note.js';

// @desc    Create a new note
// @route   POST /api/notes
// @access  Protected
const createNote = async (req, res) => {
    try {
        const { content, leadId } = req.body;

        if (!content || !leadId) {
            return res.status(400).json({
                success: false,
                message: 'Content and leadId are required'
            });
        }

        const note = new Note({
            content,
            leadId,
            authorId: req.user.id,
            organizationId: req.user.organizationId
        });

        const savedNote = await note.save();

        res.status(201).json({
            success: true,
            data: savedNote
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({
            success: false,



