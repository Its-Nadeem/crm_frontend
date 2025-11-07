
import express from 'express';
import FacebookIntegration from '../models/FacebookIntegration.js';
import facebookService from '../services/facebookService.js';
import facebookWebhookController from '../controllers/facebookWebhookController.js';

const router = express.Router();

/**
 * OAuth Flow Routes
 */

// Start OAuth flow - redirect to Facebook
router.get('/auth/start', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: 'tenantId is required'
            });
        }

        const authUrl = facebookService.getAuthUrl(tenantId);
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('Error starting Facebook auth:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// OAuth callback - exchange code for tokens and fetch pages
router.get('/auth/callback', async (req, res) => {
    try {
        const { code, state: tenantId, error: oauthError } = req.query;

        if (oauthError) {
            return res.status(400).json({
                success: false,
                message: `OAuth error: ${oauthError}`
            });
        }

        if (!code || !tenantId) {
            return res.status(400).json({
                success: false,
                message: 'Missing code or tenantId'
            });
        }

        // Exchange code for short-lived token
        const shortLivedToken = await facebookService.exchangeCodeForToken(code);

        // Get long-lived token
        const longLivedToken = await facebookService.getLongLivedToken(shortLivedToken);

        // Fetch user pages
        const pages = await facebookService.getUserPages(longLivedToken);

        // Save or update integration
        let integration = await FacebookIntegration.findOne({ tenantId });

        if (integration) {
            // Update existing integration
            integration.longLivedToken = longLivedToken;
            integration.pages = pages.map(page => ({
                pageId: page.pageId,
                pageName: page.pageName,
                pageAccessToken: page.pageAccessToken,
                instagramBusinessAccount: page.instagramBusinessAccount,
                subscribed: false
            }));
            integration.updatedAt = new Date();
        } else {
            // Create new integration
            integration = new FacebookIntegration({
                tenantId,
                fbUserId: pages[0]?.pageId || 'unknown', // We'll get this from pages later
                longLivedToken,
                pages: pages.map(page => ({
                    pageId: page.pageId,
                    pageName: page.pageName,
                    pageAccessToken: page.pageAccessToken,
                    instagramBusinessAccount: page.instagramBusinessAccount,
                    subscribed: false
                }))
            });
        }

        await integration.save();

        res.json({
            success: true,
            message: 'Facebook integration completed successfully',
            pages: integration.pages.map(p => ({
                pageId: p.pageId,
                pageName: p.pageName,
                subscribed: p.subscribed
            }))
        });

    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Pages Management
 */

// Get pages for tenant
router.get('/pages', async (req, res) => {
    try {
        const { tenantId } = req.query;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: 'tenantId is required'
            });
        }

        const integration = await FacebookIntegration.findOne({ tenantId });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found'
            });
        }

        res.json({
            success: true,
            pages: integration.pages.map(p => ({
                pageId: p.pageId,
                pageName: p.pageName,
                subscribed: p.subscribed,
                subscribedAt: p.subscribedAt
            }))
        });

    } catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Subscribe page to webhook
router.post('/pages/:pageId/subscribe', async (req, res) => {
    try {
        const { pageId } = req.params;
        const { tenantId } = req.body;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: 'tenantId is required'
            });
        }

        const integration = await FacebookIntegration.findOne({ tenantId });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found'
            });
        }

        const pageAccessToken = integration.getPageAccessToken(pageId);
        if (!pageAccessToken) {
            return res.status(404).json({
                success: false,
                message: 'Page access token not found'
            });
        }

        // Subscribe to webhook
        await facebookService.subscribePageToWebhook(pageId, pageAccessToken);

        // Update subscription status
        const page = integration.pages.find(p => p.pageId === pageId);
        if (page) {
            page.subscribed = true;
            page.subscribedAt = new Date();
            await integration.save();
        }

        res.json({
            success: true,
            message: 'Page subscribed to webhook successfully'
        });

    } catch (error) {
        console.error('Error subscribing page:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Forms Management
 */

// Get lead gen forms for a page
router.get('/forms', async (req, res) => {
    try {
        const { pageId, tenantId } = req.query;

        if (!pageId || !tenantId) {
            return res.status(400).json({
                success: false,
                message: 'pageId and tenantId are required'
            });
        }

        const integration = await FacebookIntegration.findOne({ tenantId });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found'
            });
        }

        const pageAccessToken = integration.getPageAccessToken(pageId);
        if (!pageAccessToken) {
            return res.status(404).json({
                success: false,
                message: 'Page access token not found'
            });
        }

        const forms = await facebookService.getLeadGenForms(pageId, pageAccessToken);

        res.json({
            success: true,
            forms
        });

    } catch (error) {
        console.error('Error fetching forms:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Map form fields to CRM fields
router.post('/forms/:formId/map', async (req, res) => {
    try {



