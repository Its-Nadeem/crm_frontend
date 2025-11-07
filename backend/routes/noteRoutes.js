import express from 'express';
import { createNote, getNotesByLead, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/notes
// @desc    Create a new note
router.post('/', createNote);

// @route   GET /api/notes/:leadId
// @desc    Get notes for a lead
router.get('/:leadId', getNotesByLead);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
router.delete('/:id', deleteNote);

export default router;


