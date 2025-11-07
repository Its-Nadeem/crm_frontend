import express from 'express';
import axios from 'axios';
import FacebookIntegration from '../models/FacebookIntegration.js';
import FacebookService from '../services/facebookService.js';
import facebookWebhookController from '../controllers/facebookWebhookController.js';

const facebookService = new FacebookService();

// Track ongoing OAuth processes to prevent double processing
const ongoingOAuthProcesses = new Set();

// Clean up stuck processes every 5 minutes
setInterval(() => {
    const count = ongoingOAuthProcesses.size;
    ongoingOAuthProcesses.clear();
    if (count > 0) {
        console.log(`Cleared ${count} stuck OAuth processes`);
    }
}, 5 * 60 * 1000);

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

// Helper function to get user info with multiple fallback methods
async function getUserInfoWithFallback(facebookService, longLivedToken, pages) {
    console.log('🔄 Attempting to get user info with fallback methods...');

    // Method 1: Try to get user info using the long-lived token
    try {
        const userInfo = await facebookService.getUserInfo(longLivedToken);
        console.log('✅ Successfully got user info with long-lived token');
        return userInfo;
    } catch (error) {
        console.log('❌ Long-lived token user info failed:', error.response?.data?.error?.message || error.message);
    }

    // Method 2: If we have pages, try to get user info using page access tokens
    if (pages && pages.length > 0) {
        for (const page of pages) {
            try {
                console.log(`🔄 Trying to get user info using page token for page: ${page.pageName}`);
                const userInfo = await facebookService.getUserInfo(page.pageAccessToken);
                console.log('✅ Successfully got user info with page access token');
                return userInfo;
            } catch (error) {
                console.log(`❌ Page token user info failed for ${page.pageName}:`, error.response?.data?.error?.message || error.message);
            }
        }
    }

    // Method 3: Try to get user info by querying the user directly using pages endpoint
    // The pages endpoint might return some user context
    try {
        console.log('🔄 Trying alternative method to get user context...');
        const params = {
            access_token: longLivedToken,
            fields: 'id,name'
        };

        // Try to get info about the user who owns the token
        const response = await axios.get(`https://graph.facebook.com/v18.0/me`, { params });
        if (response.data && response.data.id && response.data.name) {
            console.log('✅ Got user info via alternative API call');
            return {
                userId: response.data.id,
                name: response.data.name,
                email: null,
                firstName: null,
                lastName: null
            };
        }
    } catch (error) {
        console.log('❌ Alternative user info method failed:', error.response?.data?.error?.message || error.message);
    }

    // Final fallback: Use page information but indicate it's not the real user
    console.log('⚠️ All user info methods failed, using page-based fallback');
    const fallbackName = pages.length > 0
        ? `${pages[0].pageName} (Page Owner - Name Unavailable)`
        : 'Facebook User (Name Unavailable)';

    return {
        userId: pages[0]?.pageId || 'unknown',
        name: fallbackName,
        email: null,
        firstName: null,
        lastName: null
    };
}

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

        // Check if this OAuth process is already being handled (prevent double processing)
        const processKey = `${tenantId}-${code}`;
        if (ongoingOAuthProcesses.has(processKey)) {
            console.log('OAuth process already ongoing, ignoring duplicate request');
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
                                    message: 'Facebook integration already in progress',
                                    accountName: 'Facebook Account',
                                    pages: []
                                }
                            }, '*');
                            console.log('PostMessage sent for ongoing OAuth process');
                        } catch (error) {
                            console.error('Error sending postMessage for ongoing process:', error);
                        }

                        setTimeout(() => {
                            try {
                                window.close();
                                console.log('Popup closed for ongoing OAuth process');
                            } catch (error) {
                                console.error('Error closing popup for ongoing process:', error);
                            }
                        }, 1500);
                    </script>
                    <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                        <h3 style="color: #28a745;">Processing...</h3>
                        <p>Your Facebook integration is being processed.</p>
                        <p>This window will close automatically in a moment...</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Mark this OAuth process as ongoing
        ongoingOAuthProcesses.add(processKey);

        // Check if this code has already been processed (prevent double processing)
        const existingIntegration = await FacebookIntegration.findOne({ tenantId });
        if (existingIntegration && existingIntegration.lastAuthCode === code) {
            console.log('Authorization code already processed, updating account info anyway');
            // Update account information even for already processed codes
            try {
                const shortLivedToken = await facebookService.exchangeCodeForToken(code);
                const longLivedToken = await facebookService.getLongLivedToken(shortLivedToken);
                const userInfo = await facebookService.getUserInfo(longLivedToken);

                existingIntegration.accountName = userInfo.name;
                existingIntegration.accountEmail = userInfo.email;
                existingIntegration.firstName = userInfo.firstName;
                existingIntegration.lastName = userInfo.lastName;
                await existingIntegration.save();

                console.log('Updated existing integration with fresh account information');
            } catch (updateError) {
                console.error('Error updating existing integration:', updateError);
            }

            // Remove from ongoing processes
            ongoingOAuthProcesses.delete(processKey);

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

        // Exchange code for short-lived token
        const shortLivedToken = await facebookService.exchangeCodeForToken(code);

        // Get long-lived token
        const longLivedToken = await facebookService.getLongLivedToken(shortLivedToken);

        // Fetch user information and pages
        let userInfo, pages;
        try {
            [userInfo, pages] = await Promise.all([
                facebookService.getUserInfo(longLivedToken),
                facebookService.getUserPages(longLivedToken)
            ]);
            console.log('✅ Successfully fetched user info and pages');
        } catch (error) {
            console.error('❌ Error fetching user data from Facebook:', error.response?.data || error.message);

            // Try to get pages first
            try {
                pages = await facebookService.getUserPages(longLivedToken);
                console.log('✅ Successfully fetched pages as fallback');
            } catch (pagesError) {
                console.error('❌ Failed to fetch pages too:', pagesError.response?.data || pagesError.message);
                throw new Error('Unable to fetch Facebook data. Please check your permissions and try again.');
            }

            // Try multiple methods to get user information
            userInfo = await getUserInfoWithFallback(facebookService, longLivedToken, pages);
        }

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

        // Remove from ongoing processes
        ongoingOAuthProcesses.delete(processKey);

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
        // Remove from ongoing processes on error
        ongoingOAuthProcesses.delete(processKey);
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
            accountName: integration.accountName,
            accountEmail: integration.accountEmail,
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


