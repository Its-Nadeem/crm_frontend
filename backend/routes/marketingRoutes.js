import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    createOrUpdateTemplate, deleteTemplate, getTemplates, getTemplate,
    createOrUpdateCampaign, deleteCampaign, getCampaigns, getCampaign, sendCampaign,
} from '../controllers/marketingController.js';

const router = express.Router();

// Templates (generic for all types)
router.route('/templates/:type').get(protect, getTemplates).post(protect, createOrUpdateTemplate);
router.route('/templates/:type/:id').get(protect, getTemplate).put(protect, createOrUpdateTemplate).delete(protect, deleteTemplate);

// Scripts (generic for all types - alias for templates)
router.route('/scripts/:type').get(protect, getTemplates).post(protect, createOrUpdateTemplate);
router.route('/scripts/:type/:id').get(protect, getTemplate).put(protect, createOrUpdateTemplate).delete(protect, deleteTemplate);

// Campaigns (generic for all types)
router.route('/campaigns/:type').get(protect, getCampaigns).post(protect, createOrUpdateCampaign);
router.route('/campaigns/:type/:id').get(protect, getCampaign).put(protect, createOrUpdateCampaign).delete(protect, deleteCampaign);
router.route('/campaigns/:type/:id/send').post(protect, sendCampaign);

export default router;



