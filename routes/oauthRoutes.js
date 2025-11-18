import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    handleGoogleAdsCallback,
    initiateGoogleAdsOAuth,
    refreshGoogleAdsToken,
    getGoogleAdsOAuthStatus
} from '../controllers/oauthController.js';

const router = express.Router();

// Google Ads OAuth routes
router.get('/google-ads/callback', handleGoogleAdsCallback);
router.get('/google-ads/:integrationId/initiate', protect, initiateGoogleAdsOAuth);
router.post('/google-ads/:integrationId/refresh', protect, refreshGoogleAdsToken);
router.get('/google-ads/:integrationId/status', protect, getGoogleAdsOAuthStatus);

export default router;


