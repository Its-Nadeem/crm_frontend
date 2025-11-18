import IntegrationSettings from '../models/IntegrationSettings.js';
import GoogleAdsCampaign from '../models/GoogleAdsCampaign.js';
import WebsiteForm from '../models/WebsiteForm.js';
import googleAdsService from '../services/googleAdsService.js';
import websiteTrackingService from '../services/websiteTrackingService.js';

/**
 * Handle Google Ads webhook for real-time campaign updates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleGoogleAdsWebhook = async (req, res) => {
    try {
        const { organizationId, accountId, campaignId, updateType, data } = req.body;

        if (!organizationId || !accountId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID and Account ID are required'
            });
        }

        // Find the integration
        const integration = await IntegrationSettings.findOne({
            source: 'Google Ads',
            organizationId: organizationId,
            isConnected: true
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found or not connected'
            });
        }

        // Verify the account is connected
        const account = integration.connectedAccounts.find(acc => acc.id === accountId);
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads account not found'
            });
        }

        let result = null;

        switch (updateType) {
            case 'campaign_update':
                result = await syncGoogleAdsCampaign(integration, account, campaignId, data);
                break;
            case 'conversion_update':
                result = await syncGoogleAdsConversions(integration, account, data);
                break;
            case 'account_update':
                result = await syncGoogleAdsAccount(integration, account, data);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid update type'
                });
        }

        res.json({
            success: true,
            message: 'Google Ads webhook processed successfully',
            data: result
        });

    } catch (error) {
        console.error('Error processing Google Ads webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process Google Ads webhook',
            error: error.message
        });
    }
};

/**
 * Handle Website tracking webhook for real-time form and analytics updates
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleWebsiteTrackingWebhook = async (req, res) => {
    try {
        const { organizationId, scriptId, eventType, data } = req.body;

        if (!organizationId || !scriptId || !eventType) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID, Script ID, and Event Type are required'
            });
        }

        // Find the integration
        const integration = await IntegrationSettings.findOne({
            source: 'Website',
            organizationId: organizationId,
            isConnected: true
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found or not connected'
            });
        }

        // Verify script ID matches
        const expectedScriptId = websiteTrackingService.generateScriptId(organizationId);
        if (scriptId !== expectedScriptId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid script ID'
            });
        }

        let result = null;

        switch (eventType) {
            case 'form_submission':
                result = await processWebsiteFormSubmission(integration, data);
                break;
            case 'page_view':
                result = await processWebsitePageView(integration, data);
                break;
            case 'custom_event':
                result = await processWebsiteCustomEvent(integration, data);
                break;
            case 'form_detected':
                result = await processWebsiteFormDetection(integration, data);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid event type'
                });
        }

        res.json({
            success: true,
            message: 'Website tracking webhook processed successfully',
            data: result
        });

    } catch (error) {
        console.error('Error processing website tracking webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process website tracking webhook',
            error: error.message
        });
    }
};

/**
 * Sync Google Ads campaign data
 * @param {Object} integration - Integration settings
 * @param {Object} account - Connected account
 * @param {string} campaignId - Campaign ID to sync
 * @param {Object} data - Campaign data
 * @returns {Object} Sync result
 */
const syncGoogleAdsCampaign = async (integration, account, campaignId, data) => {
    try {
        // Check if token needs refresh
        if (account.expiresAt && new Date() >= account.expiresAt) {
            const newTokens = await googleAdsService.refreshAccessToken(
                account.refreshToken,
                integration.additionalSettings.clientId,
                integration.additionalSettings.clientSecret
            );

            account.accessToken = newTokens.access_token;
            account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);
            await integration.save();
        }

        // Get fresh campaign data from Google Ads API
        const campaigns = await googleAdsService.getCampaigns(account.id, account.accessToken);
        const campaign = campaigns.find(c => c.id === campaignId);

        if (campaign) {
            // Update or create campaign in database
            const updatedCampaign = await GoogleAdsCampaign.findOneAndUpdate(
                {
                    campaignId: campaignId,
                    organizationId: integration.organizationId,
                    integrationId: integration._id
                },
                {
                    name: campaign.name,
                    status: campaign.status,
                    budget: campaign.budget,
                    targetCpa: campaign.targetCpa,
                    impressions: campaign.impressions,
                    clicks: campaign.clicks,
                    conversions: campaign.conversions,
                    cost: campaign.cost,
                    lastSynced: new Date(),
                    syncStatus: 'success'
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );

            return {
                campaignId: campaignId,
                action: 'updated',
                data: updatedCampaign
            };
        }

        return {
            campaignId: campaignId,
            action: 'not_found',
            message: 'Campaign not found in Google Ads account'
        };

    } catch (error) {
        console.error('Error syncing Google Ads campaign:', error);

        // Update sync status to error
        await GoogleAdsCampaign.findOneAndUpdate(
            {
                campaignId: campaignId,
                organizationId: integration.organizationId
            },
            {
                syncStatus: 'error',
                syncError: error.message,
                lastSynced: new Date()
            }
        );

        throw error;
    }
};

/**
 * Sync Google Ads conversion data
 * @param {Object} integration - Integration settings
 * @param {Object} account - Connected account
 * @param {Object} data - Conversion data
 * @returns {Object} Sync result
 */
const syncGoogleAdsConversions = async (integration, account, data) => {
    try {
        // Check if token needs refresh
        if (account.expiresAt && new Date() >= account.expiresAt) {
            const newTokens = await googleAdsService.refreshAccessToken(
                account.refreshToken,
                integration.additionalSettings.clientId,
                integration.additionalSettings.clientSecret
            );

            account.accessToken = newTokens.access_token;
            account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);
            await integration.save();
        }

        // Get conversion data from Google Ads API
        const conversionData = await googleAdsService.getConversionData(
            account.id,
            account.accessToken,
            data.campaignIds
        );

        // Update campaigns with new conversion data
        const updatePromises = conversionData.campaigns.map(async (campaignData) => {
            return GoogleAdsCampaign.findOneAndUpdate(
                {
                    campaignId: campaignData.campaign.id,
                    organizationId: integration.organizationId
                },
                {
                    conversions: campaignData.metrics.conversions,
                    cost: campaignData.metrics.costMicros / 1000000,
                    clicks: campaignData.metrics.clicks,
                    impressions: campaignData.metrics.impressions,
                    lastSynced: new Date(),
                    syncStatus: 'success',
                    syncError: null
                },
                { new: true }
            );
        });

        const updatedCampaigns = await Promise.all(updatePromises);

        return {
            accountId: account.id,
            updatedCampaigns: updatedCampaigns.length,
            conversionData: conversionData
        };

    } catch (error) {
        console.error('Error syncing Google Ads conversions:', error);
        throw error;
    }
};

/**
 * Sync Google Ads account data
 * @param {Object} integration - Integration settings
 * @param {Object} account - Connected account
 * @param {Object} data - Account data
 * @returns {Object} Sync result
 */
const syncGoogleAdsAccount = async (integration, account, data) => {
    try {
        // Update account information
        account.name = data.name || account.name;
        account.status = data.status || account.status;
        await integration.save();

        return {
            accountId: account.id,
            action: 'account_updated',
            data: account
        };

    } catch (error) {
        console.error('Error syncing Google Ads account:', error);
        throw error;
    }
};

/**
 * Process website form submission
 * @param {Object} integration - Integration settings
 * @param {Object} data - Form submission data
 * @returns {Object} Processing result
 */
const processWebsiteFormSubmission = async (integration, data) => {
    try {
        const { formData, metadata } = data;

        // Track the form submission
        const result = await websiteTrackingService.trackFormSubmission(
            formData,
            integration.additionalSettings.scriptId,
            {
                ...metadata,
                organizationId: integration.organizationId
            }
        );

        // Update or create form in database
        if (metadata.formId) {
            await WebsiteForm.findOneAndUpdate(
                {
                    formId: metadata.formId,
                    organizationId: integration.organizationId
                },
                {
                    $inc: { totalSubmissions: 1 },
                    lastSubmission: new Date(),
                    $push: {
                        recentSubmissions: {
                            id: result.leadId,
                            timestamp: new Date(),
                            userAgent: metadata.userAgent,
                            ipAddress: metadata.ipAddress,
                            referrer: metadata.referrer,
                            formData: formData
                        }
                    }
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );
        }

        return {
            formId: metadata.formId,
            leadId: result.leadId,
            action: 'form_submission_processed'
        };

    } catch (error) {
        console.error('Error processing website form submission:', error);
        throw error;
    }
};

/**
 * Process website page view
 * @param {Object} integration - Integration settings
 * @param {Object} data - Page view data
 * @returns {Object} Processing result
 */
const processWebsitePageView = async (integration, data) => {
    try {
        const { pageData, metadata } = data;

        // Track the page view
        const result = await websiteTrackingService.trackPageView(
            integration.additionalSettings.scriptId,
            pageData,
            {
                ...metadata,
                organizationId: integration.organizationId
            }
        );

        return {
            pageViewId: result.pageViewId,
            url: pageData.url,
            action: 'page_view_processed'
        };

    } catch (error) {
        console.error('Error processing website page view:', error);
        throw error;
    }
};

/**
 * Process website custom event
 * @param {Object} integration - Integration settings
 * @param {Object} data - Custom event data
 * @returns {Object} Processing result
 */
const processWebsiteCustomEvent = async (integration, data) => {
    try {
        const { eventName, eventData, metadata } = data;

        // Track the custom event
        const result = await websiteTrackingService.trackCustomEvent(
            integration.additionalSettings.scriptId,
            eventName,
            eventData,
            {
                ...metadata,
                organizationId: integration.organizationId
            }
        );

        // Update form with custom event if formId is provided
        if (metadata.formId) {
            await WebsiteForm.findOneAndUpdate(
                {
                    formId: metadata.formId,
                    organizationId: integration.organizationId
                },
                {
                    $push: {
                        customEvents: {
                            name: eventName,
                            count: 1,
                            lastTriggered: new Date()
                        }
                    }
                }
            );
        }

        return {
            eventId: result.eventId,
            eventName: eventName,
            formId: metadata.formId,
            action: 'custom_event_processed'
        };

    } catch (error) {
        console.error('Error processing website custom event:', error);
        throw error;
    }
};

/**
 * Process website form detection
 * @param {Object} integration - Integration settings
 * @param {Object} data - Form detection data
 * @returns {Object} Processing result
 */
const processWebsiteFormDetection = async (integration, data) => {
    try {
        const { formData, metadata } = data;

        // Create or update form in database
        const form = await WebsiteForm.findOneAndUpdate(
            {
                formId: formData.id,
                organizationId: integration.organizationId
            },
            {
                name: formData.name,
                url: formData.url,
                scriptId: integration.additionalSettings.scriptId,
                integrationId: integration._id,
                fields: formData.fields || []
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return {
            formId: form.formId,
            action: 'form_detected',
            data: form
        };

    } catch (error) {
        console.error('Error processing website form detection:', error);
        throw error;
    }
};

/**
 * Get webhook status for integrations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWebhookStatus = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { integrationType } = req.params;

        const integration = await IntegrationSettings.findOne({
            source: integrationType,
            organizationId: organizationId,
            isConnected: true
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: `${integrationType} integration not found or not connected`
            });
        }

        const status = {
            integrationType: integrationType,
            isConnected: integration.isConnected,
            webhookEnabled: true, // Webhooks are always enabled for real-time sync
            lastSync: null,
            syncCount: 0
        };

        // Get last sync information based on integration type
        if (integrationType === 'Google Ads') {
            const lastCampaign = await GoogleAdsCampaign.findOne(
                { organizationId: organizationId },
                { lastSynced: 1 },
                { sort: { lastSynced: -1 } }
            );
            status.lastSync = lastCampaign?.lastSynced;
            status.syncCount = await GoogleAdsCampaign.countDocuments({ organizationId: organizationId });
        } else if (integrationType === 'Website') {
            const lastForm = await WebsiteForm.findOne(
                { organizationId: organizationId },
                { updatedAt: 1 },
                { sort: { updatedAt: -1 } }
            );
            status.lastSync = lastForm?.updatedAt;
            status.syncCount = await WebsiteForm.countDocuments({ organizationId: organizationId });
        }

        res.json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('Error getting webhook status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get webhook status',
            error: error.message
        });
    }
};


