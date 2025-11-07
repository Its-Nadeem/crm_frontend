import Note from '../models/Note.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';

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

         // Get the lead to find its owner
         const lead = await Lead.findOne({ id: leadId, organizationId: req.user.organizationId });

         if (!lead) {
             return res.status(404).json({
                 success: false,
                 message: 'Lead not found'
             });
         }

         // Get users to find the lead owner's name
         const users = await User.find({ organizationId: req.user.organizationId });
         const leadOwner = users.find(u => u.id === lead.assignedToId);
         const leadOwnerName = leadOwner ? leadOwner.name : 'Unassigned';

         // Create note with attribution to lead owner
         const note = new Note({
             content: `${leadOwnerName}: ${content}`, // Prefix with owner name
             leadId,
             authorId: req.user.id || req.user._id, // Keep actual author for audit
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
             message: 'Server Error'
         });
     }
 };

// @desc    Get notes for a lead
// @route   GET /api/notes/:leadId
// @access  Protected
const getNotesByLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        const notes = await Note.find({
            leadId,
            organizationId: req.user.organizationId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: notes
        });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Protected
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        await Note.deleteOne({ _id: req.params.id });

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

export { createNote, getNotesByLead, deleteNote };


