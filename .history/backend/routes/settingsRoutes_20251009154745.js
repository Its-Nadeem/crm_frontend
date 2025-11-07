import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getSettings,
    createOrUpdateStage, deleteStage,
    createOrUpdateCustomField, deleteCustomField,
    createOrUpdateTeam, deleteTeam,
    createOrUpdateUser, deleteUser,
    createOrUpdateLeadScoreRule, deleteLeadScoreRule,
    createOrUpdateWebhook, deleteWebhook,
    getOrganizationApiKey, generateOrganizationApiKey, regenerateOrganizationApiKey, revokeOrganizationApiKey,
    getMetaSettings, updateMetaSettings
} from '../controllers/settingsController.js';

const router = express.Router();

// A generic endpoint to get all settings for an org could be useful
router.route('/').get(protect, getSettings);

// Stages
router.route('/stages').post(protect, createOrUpdateStage);
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
router.route('/score-rules').post(protect, createOrUpdateLeadScoreRule);
router.route('/score-rules/:id').put(protect, createOrUpdateLeadScoreRule).delete(protect, deleteLeadScoreRule);

// Webhooks
router.route('/webhooks').post(protect, createOrUpdateWebhook);
router.route('/webhooks/:id').put(protect, createOrUpdateWebhook).delete(protect, deleteWebhook);


export default router;



