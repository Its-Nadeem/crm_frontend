import express from 'express';
import { createCall, getCallsByLead, deleteCall } from '../controllers/callController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/calls
// @desc    Create a new call log
router.post('/', createCall);

// @route   GET /api/calls/:leadId
// @desc    Get call logs for a lead
router.get('/:leadId', getCallsByLead);

// @route   DELETE /api/calls/:id
// @desc    Delete a call log
router.delete('/:id', deleteCall);

export default router;


