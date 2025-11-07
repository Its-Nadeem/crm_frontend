import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads } from '../controllers/leadController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/')
    .get(protect, getLeads)
    .post(protect, createLead);

router.route('/:id')
    .put(protect, updateLead)
    .delete(protect, deleteLead);

// Bulk operations
router.route('/bulk')
    .put(protect, bulkUpdateLeads)
    .delete(protect, bulkDeleteLeads);

export default router;



