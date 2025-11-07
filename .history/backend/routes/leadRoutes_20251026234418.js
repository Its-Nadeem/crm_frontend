import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, cleanAllProblematicActivities } from '../controllers/leadController.js';
import Lead from '../models/Lead.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/')
    .get(protect, getLeads)
    .post(protect, createLead);

router.route('/:id')
    .get(protect, async (req, res) => {
        try {
            // Emergency rate limiting to prevent infinite loops
            const clientKey = `${req.user?.id || req.ip}-${req.params.id}`;
            const now = Date.now();
            const windowStart = now - 1000; // 1 second window

            // Simple in-memory rate limiting
            if (!global.requestCounts) global.requestCounts = new Map();
            if (!global.requestCounts.has(clientKey)) {
                global.requestCounts.set(clientKey, []);
            }

            const requests = global.requestCounts.get(clientKey);
            // Remove old requests
            while (requests.length > 0 && requests[0] < windowStart) {
                requests.shift();
            }

            // Limit to 5 requests per second per client
            if (requests.length >= 5) {
                console.warn(`Rate limit exceeded for ${clientKey}, requests in last second: ${requests.length}`);
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests. Please slow down.',
                    retryAfter: 1
                });
            }

            requests.push(now);

            const Lead = (await import('../models/Lead.js')).default;

            console.log('GET lead request:', {
                leadId: req.params.id,
                userId: req.user?.id,
                userOrg: req.user?.organizationId,
                requestCount: requests.length
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

            console.log('Returning populated lead:', populatedLead?.id || 'undefined');
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



// Lead activities feed - activities are now stored directly in the lead
router.get('/:id/activities', protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    // Get lead activities (notes are now stored as activities in the lead)
    const lead = await Lead.findOne(
      { id: req.params.id, organizationId: req.user.organizationId },
      { activities: 1, _id: 0 }
    );
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Sort activities by timestamp and limit
    const activities = (lead.activities || [])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('Error fetching lead activities:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;



