import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getSettings,
    createOrUpdateStage, deleteStage,
    createOrUpdateCustomField, deleteCustomField,
    createOrUpdateTeam, deleteTeam,
    createOrUpdateUser, deleteUser,
    createOrUpdateLeadScoreRule, deleteLeadScoreRule,
    createOrUpdateWebhook, deleteWebhook, getWebhooks,
    getOrganizationApiKey, generateOrganizationApiKey, regenerateOrganizationApiKey, revokeOrganizationApiKey,
    getMetaSettings, updateMetaSettings
} from '../controllers/settingsController.js';

const router = express.Router();

// A generic endpoint to get all settings for an org could be useful
router.route('/').get(protect, getSettings);

// Stages
router.route('/stages').get(protect, async (req, res) => {
    try {
        const { ensureDefaultStages } = await import('../controllers/settingsController.js');
        const Stage = (await import('../models/Stage.js')).default;

        // Ensure default stages exist for this organization
        await ensureDefaultStages(req.user.organizationId);

        // Fetch all stages for the organization
        const stages = await Stage.find({ organizationId: req.user.organizationId }).sort({ name: 1 });
        console.log('DEBUG: GET /settings/stages - Found stages:', stages.length, stages.map(s => ({ id: s.id, name: s.name })));
        res.json({ success: true, data: stages });
    } catch (error) {
        console.error('DEBUG: GET /settings/stages - Error:', error);
        res.status(500).json({ success: false, message: 'Error fetching stages', error: error.message });
    }
}).post(protect, createOrUpdateStage);
router.route('/stages/:id').put(protect, createOrUpdateStage).delete(protect, deleteStage);

// Custom Fields
router.route('/custom-fields').post(protect, createOrUpdateCustomField);
router.route('/custom-fields/:id').put(protect, createOrUpdateCustomField).delete(protect, deleteCustomField);

// Teams
router.route('/teams').post(protect, createOrUpdateTeam);
router.route('/teams/:id').put(protect, createOrUpdateTeam).delete(protect, deleteTeam);

// Users
router.route('/users').post(protect, createOrUpdateUser);
router.route('/users/:id').put(protect, createOrUpdateUser).delete(protect, deleteUser);

// Lead Score Rules
router.route('/score-rules').get(protect, getLeadScoreRules).post(protect, createOrUpdateLeadScoreRule);
router.route('/score-rules/:id').put(protect, createOrUpdateLeadScoreRule).delete(protect, deleteLeadScoreRule);

// Webhooks
router.route('/webhooks').get(protect, getWebhooks).post(protect, createOrUpdateWebhook);
router.route('/webhooks/:id').put(protect, createOrUpdateWebhook).delete(protect, deleteWebhook);

// Organization API Key Management
router.route('/api-key').get(protect, getOrganizationApiKey);
router.route('/api-key/generate').post(protect, generateOrganizationApiKey);
router.route('/api-key/regenerate').post(protect, regenerateOrganizationApiKey);
router.route('/api-key/revoke').post(protect, revokeOrganizationApiKey);

// Meta Settings
router.route('/meta-settings').get(protect, getMetaSettings).put(protect, updateMetaSettings);


export default router;



