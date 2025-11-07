import express from 'express';
import FacebookIntegration from '../models/FacebookIntegration.js';
import FacebookService from '../services/facebookService.js';
import facebookWebhookController from '../controllers/facebookWebhookController.js';

const facebookService = new FacebookService();

const router = express.Router();

/**
 * OAuth Flow Routes
 */

// Start OAuth flow - redirect to Facebook
router.get('/auth/start', async (req, res) => {
  // Use dynamic callback URL based on request origin (for Cloudflare Tunnel compatibility)
  const requestOrigin = req.get('origin') || req.get('referer')?.split('/').slice(0, 3).join('/');
  // If request is from localhost (development), use production URL instead
  const isLocalhost = requestOrigin && requestOrigin.includes('localhost');
  const origin = isLocalhost ? process.env.CLIENT_URL : (requestOrigin || process.env.CLIENT_URL || 'https://crm.clienn.com');
  const callback = `${origin.replace(/\/$/, '')}/api/fb/auth/callback`;
  facebookService.redirectUri = callback;
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

// Deauthorize callback - handles when users deauthorize the app
router.post('/deauthorize', async (req, res) => {
    try {
        const { entry } = req.body;

        if (entry && entry.length > 0) {
            for (const change of entry) {
                if (change.changes && change.changes.length > 0) {
                    for (const changeItem of change.changes) {
                        if (changeItem.field === 'deauthorize') {
                            console.log('User deauthorized app:', changeItem.value);

                            // Here you would typically:
                            // 1. Find the integration for this user
                            // 2. Clear their tokens
                            // 3. Unsubscribe from webhooks
                            // 4. Log the deauthorization

                            // For now, just log it
                            console.log('Facebook app deauthorized by user:', {
                                userId: changeItem.value,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        }

        // Facebook expects a 200 OK response
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling deauthorize callback:', error);
        res.status(200).send('OK'); // Still return OK to prevent retries
    }
});

// OAuth callback - exchange code for tokens and fetch pages
router.get('/auth/callback', async (req, res) => {
    try {
        const { code, state: tenantId, error: oauthError } = req.query;

        if (oauthError) {
            return res.send(`
                <html>
                <body>
                    <script>
                        window.close();
                    </script>
                    <p>OAuth Error: ${oauthError}. This window will close automatically.</p>
                </body>
                </html>
            `);
        }

        if (!code || !tenantId) {
            return res.send(`
                <html>
                <body>
                    <script>
                        window.close();
                    </script>
                    <p>Error: Missing code or tenantId. This window will close automatically.</p>
                </body>
                </html>
            `);
        }

        // Check if this code has already been processed (prevent double processing)
        const existingIntegration = await FacebookIntegration.findOne({ tenantId });
        if (existingIntegration && existingIntegration.lastAuthCode === code) {
            console.log('Authorization code already processed, returning success');
            return res.send(`
                <html>
                <head>
                    <title>Facebook Integration Complete</title>
                </head>
                <body>
                    <script>
                        try {
                            window.opener.postMessage({
                                type: 'FACEBOOK_AUTH_SUCCESS',
                                data: {
                                    success: true,
                                    message: 'Facebook integration completed successfully',
                                    accountName: '${existingIntegration.accountName}',
                                    pages: ${JSON.stringify(existingIntegration.pages.map(p => ({
                                        pageId: p.pageId,
                                        pageName: p.pageName,
                                        subscribed: p.subscribed
                                    })))}
                                }
                            }, '*');
                            console.log('PostMessage sent for already processed auth code');
                        } catch (error) {
                            console.error('Error sending postMessage for already processed code:', error);
                        }

                        setTimeout(() => {
                            try {
                                window.close();
                                console.log('Popup closed for already processed auth code');
                            } catch (error) {
                                console.error('Error closing popup for already processed code:', error);
                            }
                        }, 1500);
                    </script>
                    <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                        <h3 style="color: #28a745;">Facebook Integration Already Complete!</h3>
                        <p>Welcome back, ${existingIntegration.accountName}!</p>
                        <p>Your Facebook integration was already set up successfully.</p>
                        <p>This window will close automatically in a moment...</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Check if integration exists but with different auth code (new OAuth attempt)
        if (existingIntegration) {
            console.log('Updating existing integration with new auth code');
        }

        // Exchange code for short-lived token
        const shortLivedToken = await facebookService.exchangeCodeForToken(code);

        // Get long-lived token
        const longLivedToken = await facebookService.getLongLivedToken(shortLivedToken);

        // Fetch user information
        const userInfo = await facebookService.getUserInfo(longLivedToken);

        // Fetch user pages
        const pages = await facebookService.getUserPages(longLivedToken);

        // Save or update integration
        let integration = existingIntegration;

        if (integration) {
            // Update existing integration
            integration.accountName = userInfo.name;
            integration.accountEmail = userInfo.email;
            integration.firstName = userInfo.firstName;
            integration.lastName = userInfo.lastName;
            integration.longLivedToken = longLivedToken;
            integration.lastAuthCode = code; // Store the auth code to prevent double processing
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
                fbUserId: userInfo.userId,
                accountName: userInfo.name,
                accountEmail: userInfo.email,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                longLivedToken,
                lastAuthCode: code, // Store the auth code to prevent double processing
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

        // Return HTML that closes the popup and notifies the parent window
        res.send(`
            <html>
            <head>
                <title>Facebook Integration Complete</title>
            </head>
            <body>
                <script>
                    try {
                        window.opener.postMessage({
                            type: 'FACEBOOK_AUTH_SUCCESS',
                            data: {
                                success: true,
                                message: 'Facebook integration completed successfully',
                                accountName: '${integration.accountName}',
                                pages: ${JSON.stringify(integration.pages.map(p => ({
                                    pageId: p.pageId,
                                    pageName: p.pageName,
                                    subscribed: p.subscribed
                                })))}
                            }
                        }, '*');
                        console.log('PostMessage sent successfully');
                    } catch (error) {
                        console.error('Error sending postMessage:', error);
                    }

                    // Close popup after a short delay
                    setTimeout(() => {
                        try {
                            window.close();
                            console.log('Popup closed successfully');
                        } catch (error) {
                            console.error('Error closing popup:', error);
                        }
                    }, 1500);
                </script>
                <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                    <h3 style="color: #28a745;">Facebook Integration Successful!</h3>
                    <p>Welcome, ${integration.accountName}!</p>
                    <p>Found ${pages.length} Facebook page(s) connected successfully.</p>
                    <p>This window will close automatically in a moment...</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.send(`
            <html>
            <head>
                <title>Facebook Integration Error</title>
            </head>
            <body>
                <script>
                    try {
                        window.opener.postMessage({
                            type: 'FACEBOOK_AUTH_ERROR',
                            data: {
                                success: false,
                                message: '${error.message.replace(/'/g, "\\'")}'
                            }
                        }, '*');
                        console.log('Error postMessage sent successfully');
                    } catch (postMessageError) {
                        console.error('Error sending error postMessage:', postMessageError);
                    }

                    // Close popup after a delay even if there's an error
                    setTimeout(() => {
                        try {
                            window.close();
                            console.log('Error popup closed successfully');
                        } catch (closeError) {
                            console.error('Error closing error popup:', closeError);
                        }
                    }, 3000);
                </script>
                <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                    <h3 style="color: #dc3545;">Facebook Integration Error</h3>
                    <p>There was an error connecting to Facebook: ${error.message}</p>
                    <p>This window will close automatically in a moment...</p>
                </div>
            </body>
            </html>
        `);
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
        const { formId } = req.params;
        const { pageId, tenantId, fieldMapping } = req.body;

        if (!pageId || !tenantId || !fieldMapping) {
            return res.status(400).json({
                success: false,
                message: 'pageId, tenantId, and fieldMapping are required'
            });
        }

        const integration = await FacebookIntegration.findOne({ tenantId });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found'
            });
        }

        // Find or create form mapping
        let form = integration.forms.find(f => f.formId === formId);

        if (form) {
            form.fieldMapping = fieldMapping;
            form.updatedAt = new Date();
        } else {
            form = {
                formId,
                formName: `Form ${formId}`, // We'll get the actual name later
                pageId,
                fieldMapping,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            integration.forms.push(form);
        }

        await integration.save();

        res.json({
            success: true,
            message: 'Form mapping saved successfully'
        });

    } catch (error) {
        console.error('Error mapping form:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Field Mapping Management Endpoints
 */

// Get all field mappings for a tenant
router.get('/mappings', async (req, res) => {
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

        const mappings = integration.forms.map(form => ({
            formId: form.formId,
            formName: form.formName,
            pageId: form.pageId,
            fieldMapping: form.fieldMapping,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt
        }));

        res.json({
            success: true,
            mappings
        });

    } catch (error) {
        console.error('Error fetching field mappings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update field mapping for a specific form
router.put('/forms/:formId/map', async (req, res) => {
    try {
        const { formId } = req.params;
        const { tenantId, fieldMapping, formName } = req.body;

        if (!tenantId || !fieldMapping) {
            return res.status(400).json({
                success: false,
                message: 'tenantId and fieldMapping are required'
            });
        }

        const integration = await FacebookIntegration.findOne({ tenantId });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found'
            });
        }

        const form = integration.forms.find(f => f.formId === formId);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form mapping not found'
            });
        }

        form.fieldMapping = fieldMapping;
        form.formName = formName || form.formName;
        form.updatedAt = new Date();

        await integration.save();

        res.json({
            success: true,
            message: 'Field mapping updated successfully'
        });

    } catch (error) {
        console.error('Error updating field mapping:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete field mapping for a specific form
router.delete('/forms/:formId/map', async (req, res) => {
    try {
        const { formId } = req.params;
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

        const initialLength = integration.forms.length;
        integration.forms = integration.forms.filter(f => f.formId !== formId);

        if (integration.forms.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Form mapping not found'
            });
        }

        await integration.save();

        res.json({
            success: true,
            message: 'Field mapping deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting field mapping:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get field mapping for a specific form
router.get('/forms/:formId/map', async (req, res) => {
    try {
        const { formId } = req.params;
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

        const form = integration.forms.find(f => f.formId === formId);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form mapping not found'
            });
        }

        res.json({
            success: true,
            mapping: {
                formId: form.formId,
                formName: form.formName,
                pageId: form.pageId,
                fieldMapping: form.fieldMapping,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
            }
        });

    } catch (error) {
        console.error('Error fetching field mapping:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Lead Sync/Backfill
 */

// Manual lead sync
router.post('/sync/backfill', facebookWebhookController.syncLeads);

/**
 * Debug endpoints
 */

// Get recent leads for tenant (debug)
router.get('/debug/leads', async (req, res) => {
    try {
        const { tenantId, limit = 10 } = req.query;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: 'tenantId is required'
            });
        }

        const leads = await Lead.find({ organizationId: tenantId, source: 'Facebook' })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            leads: leads.map(lead => ({
                id: lead._id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                source: lead.source,
                createdAt: lead.createdAt,
                leadId: lead.leadId
            }))
        });

    } catch (error) {
        console.error('Error fetching debug leads:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;


