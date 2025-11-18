import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    handleGoogleAdsWebhook,
    handleWebsiteTrackingWebhook,
    getWebhookStatus
} from '../controllers/webhookSyncController.js';

const router = express.Router();

// Google Ads webhook (no auth required for incoming webhooks)
router.post('/google-ads', handleGoogleAdsWebhook);

// Website tracking webhook (no auth required for incoming webhooks)
router.post('/website-tracking', handleWebsiteTrackingWebhook);

// Get webhook status (requires auth)
router.get('/:integrationType/status', protect, getWebhookStatus);

export default router;


