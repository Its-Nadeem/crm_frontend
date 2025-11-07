import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, cleanAllProblematicActivities } from '../controllers/leadController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/')
    .get(protect, getLeads)
    .post(protect, createLead);

router.route('/:id')
    .get(protect, async (req, res) => {
        try {
            const Lead = (await import('../models/Lead.js')).default;
            const User = (await import('../models/User.js')).default;

            // Try to find lead by string ID first, then by MongoDB ObjectId
            let lead = await Lead.findOne({ id: req.params.id });

            // If not found by string ID, try MongoDB ObjectId
            if (!lead) {
                if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                    lead = await Lead.findById(req.params.id);
                }
            }

            if (!lead) {
                return res.status(404).json({ success: false, message: 'Lead not found' });
            }

            // Check if user has access to this lead's organization
            if (lead.organizationId.toString() !== req.user.organizationId.toString()) {
                return res.status(404).json({ success: false, message: 'Lead not found or not authorized' });
            }

            // Populate assigned user information
            const populatedLead = await Lead.findOne({ id: lead.id }).populate('assignedToId', 'name email');

            res.json({ success: true, data: populatedLead });
        } catch (error) {
            console.error('Error fetching lead:', error);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    })
    .put(protect, updateLead)
    .delete(protect, deleteLead);

// Bulk operations
router.route('/bulk')
    .put(protect, bulkUpdateLeads)
    .delete(protect, bulkDeleteLeads);

// Clean activities
router.post('/clean-activities', protect, cleanAllProblematicActivities);

export default router;



