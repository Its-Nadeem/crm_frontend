import express from 'express';
import {
    createWebhook,
    getWebhooks,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    testWebhookEnhanced,
    receiveWebhook,
    receiveOrganizationWebhook,
    getApiKeys,
    regenerateApiKey,
    getWebhookLogs,
    retryDelivery,
    getWebhookSecret,
    regenerateWebhookSecret
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

router.post('/:id/test', testWebhookEnhanced);
router.post('/:id/regenerate-key', regenerateApiKey);

// Webhook secret management
router.get('/:id/secret', getWebhookSecret);
router.post('/:id/regenerate-secret', regenerateWebhookSecret);

// Delivery logs and retry routes
router.get('/:id/logs', getWebhookLogs);
router.post('/deliveries/:deliveryId/retry', retryDelivery);

// API keys route
router.get('/api-keys', getApiKeys);

// Public webhook receive endpoints (for external integrations)
router.post('/receive', receiveWebhook);
router.post('/organization/receive', receiveOrganizationWebhook);

export default router;


