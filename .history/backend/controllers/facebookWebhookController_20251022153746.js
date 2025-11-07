import axios from 'axios';
import FacebookIntegration from '../models/FacebookIntegration.js';
import facebookService from '../services/facebookService.js';
import Lead from '../models/Lead.js';
import FacebookActivityLog from '../models/FacebookActivityLog.js';

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

            // Handle different Facebook webhook objects
            if (body.object === 'page') {
                await this.handlePageEvents(body, res);
            } else if (body.object === 'user') {
                await this.handleUserEvents(body, res);
            } else if (body.object === 'permissions') {
                await this.handlePermissionsEvents(body, res);
            } else {
                console.log(`Unhandled webhook object type: ${body.object}`);
                res.status(200).send('EVENT_RECEIVED');
            }
        } catch (error) {
            console.error('Error handling webhook event:', error);
            // Still respond with 200 to prevent retries
            res.status(200).send('ERROR_HANDLED');
        }
    }

    /**
     * Handle page-related webhook events
     */
    async handlePageEvents(body, res) {
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
    }

    /**
     * Handle user-related webhook events
     */
    async handleUserEvents(body, res) {
        console.log('👤 Received user webhook event:', JSON.stringify(body, null, 2));
        res.status(200).send('EVENT_RECEIVED');

        // Process user events
        body.entry.forEach(async (entry) => {
            if (entry.changes && entry.changes.length > 0) {
                for (const change of entry.changes) {
                    if (change.field === 'name' || change.field === 'email') {
                        await this.processUserUpdateEvent(entry.uid, change);
                    }
                }
            }
        });
    }

    /**
     * Handle permissions-related webhook events
     */
    async handlePermissionsEvents(body, res) {
        console.log('🔐 Received permissions webhook event:', JSON.stringify(body, null, 2));
        res.status(200).send('EVENT_RECEIVED');

        // Process permission changes
        body.entry.forEach(async (entry) => {
            if (entry.changes && entry.changes.length > 0) {
                for (const change of entry.changes) {
                    if (change.field === 'permissions') {
                        console.log(`Permission change for user ${entry.uid}:`, change.value);
                        // Handle permission revocation if needed
                    }
                }
            }
        });
    }

    /**
     * Process user update events (name, email changes)
     */
    async processUserUpdateEvent(userId, change) {
        try {
            console.log(`Processing user update - User ID: ${userId}, Field: ${change.field}`);

            // Find all integrations that might be affected by this user
            const integrations = await FacebookIntegration.find({ fbUserId: userId });

            if (integrations.length === 0) {
                console.log(`No integrations found for user ID: ${userId}`);
                return;
            }

            // Update user information in all affected integrations
            for (const integration of integrations) {
                try {
                    if (change.field === 'name' && change.value) {
                        integration.accountName = change.value;
                        integration.firstName = change.value.split(' ')[0] || null;
                        integration.lastName = change.value.split(' ').slice(1).join(' ') || null;
                    }

                    // Note: Email changes would require additional API calls to get the new email
                    // as Facebook doesn't send the actual email in webhook events for privacy

                    await integration.save();
                    console.log(`✅ Updated integration ${integration.tenantId} with new user info`);

                } catch (updateError) {
                    console.error(`Error updating integration ${integration.tenantId}:`, updateError);
                }
            }

        } catch (error) {
            console.error('Error processing user update event:', error);
        }
    }

    /**
     * Process lead generation event
     */
    async processLeadGenEvent(webhookEvent) {
        const startTime = Date.now();

        try {
            const leadgenId = webhookEvent.leadgen.id;
            const pageId = webhookEvent.leadgen.page_id;

            console.log(`Processing leadgen event - Lead ID: ${leadgenId}, Page ID: ${pageId}`);

            // Find the integration by page ID
            const integration = await FacebookIntegration.findByPageId(pageId);

            if (!integration) {
                console.error(`No integration found for page ID: ${pageId}`);

                // Log error activity
                await FacebookActivityLog.create({
                    organizationId: 'org-1', // Should be extracted from integration when available
                    accountId: 'unknown',
                    pageId,
                    leadId: leadgenId,
                    activityType: 'error_occurred',
                    status: 'failed',
                    description: 'No Facebook integration found for page',
                    details: { pageId, leadgenId },
                    errorMessage: `No integration found for page ID: ${pageId}`,
                    metadata: {
                        processingTimeMs: Date.now() - startTime,
                        webhookEvent: 'leadgen'
                    }
                });

                return;
            }

            // Check if lead already exists (idempotency)
            const existingLead = await Lead.findOne({ 'rawData.leadId': leadgenId });
            if (existingLead) {
                console.log(`Lead ${leadgenId} already exists, skipping`);

                // Log skipped activity
                await FacebookActivityLog.create({
                    organizationId: integration.tenantId,
                    accountId: integration.accountId || 'unknown',
                    pageId,
                    leadId: leadgenId,
                    activityType: 'lead_processed',
                    status: 'skipped',
                    description: 'Lead already exists in CRM',
                    details: { leadgenId, reason: 'duplicate' },
                    metadata: {
                        processingTimeMs: Date.now() - startTime
                    }
                });

                return;
            }

            // Get page access token
            const pageAccessToken = integration.getPageAccessToken(pageId);
            if (!pageAccessToken) {
                console.error(`No page access token found for page ID: ${pageId}`);

                // Log error activity
                await FacebookActivityLog.create({
                    organizationId: integration.tenantId,
                    accountId: integration.accountId || 'unknown',
                    pageId,
                    leadId: leadgenId,
                    activityType: 'error_occurred',
                    status: 'failed',
                    description: 'Page access token not found',
                    details: { pageId, leadgenId },
                    errorMessage: `No page access token found for page ID: ${pageId}`,
                    metadata: {
                        processingTimeMs: Date.now() - startTime
                    }
                });

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

            // Log successful lead processing
            await FacebookActivityLog.create({
                organizationId: integration.tenantId,
                accountId: integration.accountId || 'unknown',
                pageId,
                formId: form?.formId,
                formName: form?.formName,
                leadId: leadgenId,
                leadData: {
                    name: savedLead.name,
                    email: savedLead.email,
                    phone: savedLead.phone
                },
                activityType: 'lead_received',
                status: 'success',
                description: `Lead received and processed: ${savedLead.name || savedLead.email || 'Unknown'}`,
                details: {
                    leadgenId,
                    pageId,
                    formId: form?.formId,
                    fieldMapping: Object.keys(fieldMapping).length
                },
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    crmLeadId: savedLead._id
                }
            });

            console.log(`✅ Lead saved successfully: ${savedLead.name || savedLead.email} (ID: ${savedLead._id})`);

        } catch (error) {
            console.error('Error processing leadgen event:', error);

            // Log error activity
            await FacebookActivityLog.create({
                organizationId: 'org-1', // Should be extracted from integration when available
                accountId: 'unknown',
                pageId: webhookEvent.leadgen?.page_id || 'unknown',
                leadId: webhookEvent.leadgen?.id || 'unknown',
                activityType: 'error_occurred',
                status: 'failed',
                description: 'Error processing lead generation event',
                details: { leadgenId: webhookEvent.leadgen?.id, pageId: webhookEvent.leadgen?.page_id },
                errorMessage: error.message,
                metadata: {
                    processingTimeMs: Date.now() - startTime,
                    error: error.stack
                }
            });
        }
    }
/**
 * Manual lead sync/backfill endpoint
 */
async syncLeads(req, res) {
    const syncStartTime = Date.now();

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
            // Log error activity
            await FacebookActivityLog.create({
                organizationId: tenantId,
                accountId: 'unknown',
                pageId,
                formId,
                activityType: 'sync_failed',
                status: 'failed',
                description: 'Facebook integration not found for tenant',
                details: { formId, pageId, tenantId },
                errorMessage: 'Facebook integration not found for tenant',
                metadata: {
                    processingTimeMs: Date.now() - syncStartTime
                }
            });

            return res.status(404).json({
                success: false,
                message: 'Facebook integration not found for tenant'
            });
        }

        // Get page access token
        const pageAccessToken = integration.getPageAccessToken(pageId);
        if (!pageAccessToken) {
            // Log error activity
            await FacebookActivityLog.create({
                organizationId: tenantId,
                accountId: integration.accountId || 'unknown',
                pageId,
                formId,
                activityType: 'sync_failed',
                status: 'failed',
                description: 'Page access token not found',
                details: { formId, pageId },
                errorMessage: 'Page access token not found',
                metadata: {
                    processingTimeMs: Date.now() - syncStartTime
                }
            });

            return res.status(404).json({
                success: false,
                message: 'Page access token not found'
            });
        }

        // Log sync started
        await FacebookActivityLog.create({
            organizationId: tenantId,
            accountId: integration.accountId || 'unknown',
            pageId,
            formId,
            activityType: 'sync_started',
            status: 'pending',
            description: `Lead sync started for form: ${formId}`,
            details: { formId, pageId, since, until },
            metadata: {
                processingTimeMs: Date.now() - syncStartTime
            }
        });

        // Fetch leads from Facebook
        const leads = await facebookService.fetchLeadsFromFacebook(formId, pageAccessToken, since, until);

        if (!leads || leads.length === 0) {
            // Log sync completed with no leads
            await FacebookActivityLog.create({
                organizationId: tenantId,
                accountId: integration.accountId || 'unknown',
                pageId,
                formId,
                activityType: 'sync_completed',
                status: 'success',
                description: 'Sync completed - No leads found',
                details: { formId, pageId, leadsProcessed: 0 },
                metadata: {
                    processingTimeMs: Date.now() - syncStartTime
                }
            });

            return res.json({
                success: true,
                message: 'No leads found for the specified form and date range',
                results: []
            });
        }

        // Process and save leads
        const results = [];
        for (const leadData of leads) {
            try {
                // Check if lead already exists
                const existingLead = await Lead.findOne({ 'rawData.leadId': leadData.id });
                if (existingLead) {
                    results.push({ leadId: leadData.id, status: 'skipped', reason: 'already exists' });

                    // Log skipped lead
                    await FacebookActivityLog.create({
                        organizationId: tenantId,
                        accountId: integration.accountId || 'unknown',
                        pageId,
                        formId,
                        leadId: leadData.id,
                        activityType: 'lead_synced',
                        status: 'skipped',
                        description: `Lead skipped during sync - already exists: ${leadData.id}`,
                        details: { formId, pageId, reason: 'duplicate' },
                        metadata: {
                            processingTimeMs: Date.now() - syncStartTime
                        }
                    });

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

                // Log successful lead sync
                await FacebookActivityLog.create({
                    organizationId: tenantId,
                    accountId: integration.accountId || 'unknown',
                    pageId,
                    formId,
                    formName: form?.formName,
                    leadId: leadData.id,
                    leadData: {
                        name: savedLead.name,
                        email: savedLead.email,
                        phone: savedLead.phone
                    },
                    activityType: 'lead_synced',
                    status: 'success',
                    description: `Lead synced successfully: ${savedLead.name || savedLead.email || 'Unknown'}`,
                    details: {
                        formId,
                        pageId,
                        fieldMapping: Object.keys(fieldMapping).length,
                        syncType: 'manual'
                    },
                    metadata: {
                        processingTimeMs: Date.now() - syncStartTime,
                        crmLeadId: savedLead._id
                    }
                });

                results.push({ leadId: leadData.id, status: 'saved', crmId: savedLead._id });

            } catch (error) {
                results.push({ leadId: leadData.id, status: 'error', error: error.message });

                // Log error activity
                await FacebookActivityLog.create({
                    organizationId: tenantId,
                    accountId: integration.accountId || 'unknown',
                    pageId,
                    formId,
                    leadId: leadData.id,
                    activityType: 'sync_failed',
                    status: 'failed',
                    description: `Lead sync failed: ${leadData.id}`,
                    details: { formId, pageId },
                    errorMessage: error.message,
                    metadata: {
                        processingTimeMs: Date.now() - syncStartTime
                    }
                });
            }
        }

        // Log sync completion
        const successCount = results.filter(r => r.status === 'saved').length;
        const skipCount = results.filter(r => r.status === 'skipped').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        await FacebookActivityLog.create({
            organizationId: tenantId,
            accountId: integration.accountId || 'unknown',
            pageId,
            formId,
            activityType: 'sync_completed',
            status: errorCount === 0 ? 'success' : 'failed',
            description: `Manual sync completed: ${successCount} saved, ${skipCount} skipped, ${errorCount} errors`,
            details: {
                formId,
                pageId,
                totalLeads: leads.length,
                successCount,
                skipCount,
                errorCount,
                since,
                until
            },
            metadata: {
                processingTimeMs: Date.now() - syncStartTime
            }
        });

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

}

export default new FacebookWebhookController();


