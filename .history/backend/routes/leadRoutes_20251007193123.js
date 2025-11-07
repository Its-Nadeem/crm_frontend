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

            console.log('GET lead request:', {
                leadId: req.params.id,
                userId: req.user?.id,
                userOrg: req.user?.organizationId
            });

            // Try to find lead by string ID first, then by MongoDB ObjectId
            let lead = await Lead.findOne({
                $or: [
                    { id: req.params.id },
                    { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }
                ].filter(Boolean),
                organizationId: req.user.organizationId
            });

            if (!lead) {
                console.log('Lead not found:', req.params.id);
                return res.status(404).json({ success: false, message: 'Lead not found' });
            }

            console.log('Found lead:', {
                leadId: lead.id,
                leadMongoId: lead._id,
                leadOrg: lead.organizationId
            });

            // Populate assigned user information
            const populatedLead = await Lead.findOne({ id: lead.id }).populate('assignedToId', 'name email');

            console.log('Returning populated lead:', populatedLead.id);
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



