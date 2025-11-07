import Lead from '../models/Lead.js';
import User from '../models/User.js';

// @desc    Create a new note (stored directly in lead activities)
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

          // Get the lead
          const lead = await Lead.findOne({ id: leadId, organizationId: req.user.organizationId });

          if (!lead) {
              return res.status(404).json({
                  success: false,
                  message: 'Lead not found'
              });
          }

          // Get the current user's name
          const currentUser = await User.findOne({ id: req.user.id, organizationId: req.user.organizationId });
          const noteAuthorName = currentUser ? currentUser.name : 'Unknown User';

          // Create note activity directly in the lead
          const noteActivity = {
              type: 'NOTE',
              content: `${noteAuthorName}: Note: <i class="whitespace-pre-wrap">"${content}"</i>`,
              timestamp: new Date(),
              authorId: req.user.id
          };

          // Add the note activity to the lead
          lead.activities = lead.activities || [];
          lead.activities.unshift(noteActivity); // Add to beginning of activities array

          // Save the updated lead
          await lead.save();

          console.log('Note added to lead activities successfully:', {
              leadId: lead.id,
              authorId: req.user.id,
              contentLength: content.length
          });

          res.status(201).json({
              success: true,
              data: {
                  id: `note_${Date.now()}`, // Generate a simple ID for frontend compatibility
                  content: content,
                  leadId: leadId,
                  authorId: req.user.id,
                  createdAt: noteActivity.timestamp
              }
          });
      } catch (error) {
          console.error('Error creating note:', error);
          res.status(500).json({
              success: false,
              message: 'Server Error'
          });
      }
  };

// @desc    Get notes for a lead (from lead activities)
// @route   GET /api/notes/:leadId
// @access  Protected
const getNotesByLead = async (req, res) => {
    try {
        const { leadId } = req.params;

        // Get the lead and extract note activities
        const lead = await Lead.findOne({
            id: leadId,
            organizationId: req.user.organizationId
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Filter activities to get only notes
        const notes = (lead.activities || [])
            .filter(activity => activity.type === 'NOTE')
            .map(activity => ({
                id: activity._id || `note_${activity.timestamp.getTime()}`,
                content: activity.content.replace(/^[^:]+: Note: <i class="whitespace-pre-wrap">"(.+)"<\/i>$/, '$1'), // Extract original content
                leadId: leadId,
                authorId: activity.authorId,
                createdAt: activity.timestamp
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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


