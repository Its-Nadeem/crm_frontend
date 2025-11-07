import axios from 'axios';
import FacebookIntegration from '../models/FacebookIntegration.js';
import facebookService from '../services/facebookService.js';
import Lead from '../models/Lead.js';

class FacebookWebhookController {
    /**
     * Handle webhook verification (GET request)
     */
    async verifyWebhook(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            // Check if a token and mode is in the query string of the request
            if (mode && token) {
                // Accept multiple possible verify tokens for development/testing
                const validTokens = [
                    process.env.FB_VERIFY_TOKEN,
                    'fb_webhook_verify_token_2024_Clienn CRMaipower_secure',
                    'test_verify_token_2024'
                ];

                if (mode === 'subscribe' && validTokens.includes(token)) {
                    // Respond with the challenge token from the request
                    console.log('WEBHOOK_VERIFIED for token:', token);
                    res.status(200).send(challenge);
                } else {
                    // Respond with '403 Forbidden' if verify tokens do not match
                    console.log('WEBHOOK_VERIFICATION_FAILED - Mode:', mode, 'Token:', token, 'Expected:', validTokens);
                    res.sendStatus(403);
                }
            } else {
                console.log('WEBHOOK_VERIFICATION_MISSING - Mode:', mode, 'Token:', token);
                res.sendStatus(403);
            }
        } catch (error) {
            console.error('Error verifying webhook:', error);
            res.sendStatus(500);
        }
    }

    /**
     * Handle incoming webhook events (POST request)
     */
    async handleWebhookEvent(req, res) {
        try {
            const body = req.body;

            // Check if this is an event from a Facebook app
            if (body.object === 'page') {
                // Returns a '200 OK' response to all requests
                res.status(200).send('EVENT_RECEIVED');

                // Iterate over each entry - there may be multiple if batched
                body.entry.forEach(async (entry) => {
                    // Get the webhook event
                    const webhookEvent = entry.messaging[0] || entry.changes[0];

                    if (webhookEvent) {
                        // Process leadgen events
                        if (webhookEvent.leadgen) {
                            await this.processLeadGenEvent(webhookEvent);
                        }
                    }
                });
            } else {
                // Return a '404 Not Found' if event is not from a Facebook app
                res.sendStatus(404);
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
            // Still respond with 200 to prevent retries
            res.status(200).send('ERROR_HANDLED');
        }
    }

    /**
     * Process lead generation event
     */
    async processLeadGenEvent(webhookEvent) {
        try {
            const leadgenId = webhookEvent.leadgen.id;
            const pageId = webhookEvent.leadgen.page_id;

            console.log(`Processing leadgen event - Lead ID: ${leadgenId}, Page ID: ${pageId}`);

            // Find the integration by page ID
            const integration = await FacebookIntegration.findByPageId(pageId);

            if (!integration) {
                console.error(`No integration found for page ID: ${pageId}`);
                return;
            }

            // Check if lead already exists (idempotency)
            const existingLead = await Lead.findOne({ 'rawData.leadId': leadgenId });
            if (existingLead) {
                console.log(`Lead ${leadgenId} already exists, skipping`);
                return;
            }

            // Get page access token
            const pageAccessToken = integration.getPageAccessToken(pageId);
            if (!pageAccessToken) {
                console.error(`No page access token found for page ID: ${pageId}`);
                return;
            }

            // Fetch lead details from Facebook
            const leadDetails = await facebookService.getLeadDetails(leadgenId, pageAccessToken);

            // Find form mapping for this page
            const form = integration.forms.find(f => f.pageId === pageId);
            const fieldMapping = form ? form.fieldMapping : {};

            // Normalize lead data for CRM
            const normalizedLead = facebookService.normalizeLeadData(leadDetails, fieldMapping);

            // Add metadata
            normalizedLead.organizationId = integration.tenantId;
            normalizedLead.leadId = leadgenId; // For idempotency check

            // Save to database
            const savedLead = await Lead.create(normalizedLead);
            console.log(`✅ Lead saved successfully: ${savedLead.name || savedLead.email} (ID: ${savedLead._id})`);

        } catch (error) {
            console.error('Error processing leadgen event:', error);
        }
    }

    /**
     * Manual lead sync/backfill endpoint
     */
    async syncLeads(req, res) {
        try {
            const { formId, pageId, tenantId, since, until } = req.body;

            if (!formId || !pageId || !tenantId) {
                return res.status(400).json({
                    success: false,
                    message: 'formId, pageId, and tenantId are required'
                });
            }

            // Find integration
            const integration = await FacebookIntegration.findOne({ tenantId });
            if (!integration) {
                return res.status(404).json({
                    success: false,
                    message: 'Facebook integration not found for tenant'
                });
            }

            // Get page access token
            const pageAccessToken = integration.getPageAccessToken(pageId);
            if (!pageAccessToken) {
                return res.status(404).json({
                    success: false,
                    message: 'Page access token not found'
                });
            }

            // Fetch leads from Facebook
            const leads = await this.fetchLeadsFromFacebook(formId, pageAccessToken, since, until);

            // Process and save leads
            const results = [];
            for (const leadData of leads) {
                try {
                    // Check if lead already exists
                    const existingLead = await Lead.findOne({ 'rawData.leadId': leadData.id });
                    if (existingLead) {
                        results.push({ leadId: leadData.id, status: 'skipped', reason: 'already exists' });
                        continue;
                    }

                    // Find form mapping
                    const form = integration.forms.find(f => f.formId === formId);
                    const fieldMapping = form ? form.fieldMapping : {};

                    // Normalize and save
                    const normalizedLead = facebookService.normalizeLeadData(leadData, fieldMapping);
                    normalizedLead.organizationId = tenantId;
                    normalizedLead.leadId = leadData.id;

                    const savedLead = await Lead.create(normalizedLead);
                    results.push({ leadId: leadData.id, status: 'saved', crmId: savedLead._id });

                } catch (error) {
                    results.push({ leadId: leadData.id, status: 'error', error: error.message });
                }
            }

            res.json({
                success: true,
                message: `Processed ${results.length} leads`,
                results
            });

        } catch (error) {
            console.error('Error in manual lead sync:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Fetch leads from Facebook API
     */
    async fetchLeadsFromFacebook(formId, pageAccessToken, since, until) {
        try {
            const params = {
                access_token: pageAccessToken,
                fields: 'id,created_time,field_data,custom_data'
            };

            if (since) params.since = Math.floor(new Date(since).getTime() / 1000);
            if (until) params.until = Math.floor(new Date(until).getTime() / 1000);

            const response = await axios.get(
                `${facebookService.baseURL}/${formId}/leads`,
                { params }
            );

            if (response.data.error) {
                throw new Error(`Facebook API error: ${response.data.error.message}`);
            }

            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching leads from Facebook:', error.response?.data || error.message);
            throw error;
        }
    }
}

export default new FacebookWebhookController();


