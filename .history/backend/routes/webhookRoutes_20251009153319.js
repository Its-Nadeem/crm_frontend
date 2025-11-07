import express from 'express';
import {
    createWebhook,
    getWebhooks,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    receiveWebhook,
    getApiKeys,
    regenerateApiKey
} from '../controllers/webhookController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes except receiveWebhook require authentication
router.use(protect);

// Webhook management routes
router.route('/')
    .get(getWebhooks)
    .post(createWebhook);

router.route('/:id')
    .put(updateWebhook)
    .delete(deleteWebhook);

router.post('/:id/test', testWebhook);
router.post('/:id/regenerate-key', regenerateApiKey);

// API keys route
router.get('/api-keys', getApiKeys);

// Public webhook receive endpoint (for external integrations)
router.post('/receive', receiveWebhook);

export default router;


