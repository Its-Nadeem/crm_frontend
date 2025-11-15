import IntegrationSettings from '../models/IntegrationSettings.js';
import googleAdsService from '../services/googleAdsService.js';
import { google } from 'googleapis';

/**
 * Get Google Ads integrations for an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGoogleAdsIntegrations = async (req, res) => {
    try {
        const { organizationId } = req.user;

        const integrations = await IntegrationSettings.find({
            source: 'Google Ads',
            organizationId: organizationId
        });

        res.json({
            success: true,
            data: integrations
        });
    } catch (error) {
        console.error('Error getting Google Ads integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Ads integrations',
            error: error.message
        });
    }
};

/**
 * Get a specific Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Google Ads',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error getting Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Create a new Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { name, clientId, clientSecret, redirectUri } = req.body;

        // Check if integration already exists
        const existingIntegration = await IntegrationSettings.findOne({
            source: 'Google Ads',
            organizationId: organizationId
        });

        if (existingIntegration) {
            return res.status(400).json({
                success: false,
                message: 'Google Ads integration already exists for this organization'
            });
        }

        // Generate OAuth URL for Google Ads
        const authUrl = googleAdsService.getAuthUrl(clientId, redirectUri);

        // Create integration settings
        const integration = new IntegrationSettings({
            source: 'Google Ads',
            isConnected: false,
            connectedAccounts: [],
            connectedWebsites: [],
            organizationId: organizationId,
            fieldMappings: [],
            additionalSettings: {
                clientId,
                clientSecret,
                redirectUri,
                authUrl
            }
        });

        await integration.save();

        res.status(201).json({
            success: true,
            data: integration,
            authUrl: authUrl
        });
    } catch (error) {
        console.error('Error creating Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Update Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Google Ads',
                organizationId: organizationId
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error updating Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Delete Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndDelete({
            _id: id,
            source: 'Google Ads',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Google Ads integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Connect Google Ads account using OAuth2
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const connectGoogleAdsAccount = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { code, state, integrationId } = req.body;

        // Find the integration
        const integration = await IntegrationSettings.findOne({
            _id: integrationId,
            source: 'Google Ads',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        const settings = integration.additionalSettings || {};
        const { clientId, clientSecret, redirectUri } = settings;

        if (!clientId || !clientSecret || !redirectUri) {
            return res.status(400).json({
                success: false,
                message: 'Google Ads integration not properly configured'
            });
        }

        // Exchange code for tokens
        const tokens = await googleAdsService.getAccessToken(
            code,
            clientId,
            clientSecret,
            redirectUri
        );

        // Test connection
        const isConnected = await googleAdsService.testConnection(tokens.access_token);

        if (!isConnected) {
            return res.status(400).json({
                success: false,
                message: 'Failed to connect to Google Ads API'
            });
        }

        // Get accessible accounts
        const accounts = await googleAdsService.getAccounts(tokens.access_token);

        // Update integration
        integration.isConnected = true;
        integration.connectedAccounts = accounts.map(account => ({
            id: account.id,
            name: account.name,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + (tokens.expiry_date || 3600) * 1000),
            connectedAt: new Date()
        }));

        await integration.save();

        res.json({
            success: true,
            message: 'Google Ads account connected successfully',
            data: {
                integration: integration,
                accounts: accounts
            }
        });
    } catch (error) {
        console.error('Error connecting Google Ads account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect Google Ads account',
            error: error.message
        });
    }
};

/**
 * Get Google Ads campaigns for connected accounts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGoogleAdsCampaigns = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { accountId } = req.query;

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

        const account = integration.connectedAccounts.find(acc => 
            accountId ? acc.id === accountId : acc.id
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads account not found'
            });
        }

        // Check if token needs refresh
        if (account.expiresAt && new Date() >= account.expiresAt) {
            try {
                const newTokens = await googleAdsService.refreshAccessToken(
                    account.refreshToken,
                    integration.additionalSettings.clientId,
                    integration.additionalSettings.clientSecret
                );

                account.accessToken = newTokens.access_token;
                account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);
                await integration.save();
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                return res.status(401).json({
                    success: false,
                    message: 'Google Ads token expired and refresh failed'
                });
            }
        }

        const campaigns = await googleAdsService.getCampaigns(
            account.id,
            account.accessToken
        );

        res.json({
            success: true,
            data: campaigns,
            accountId: account.id
        });
    } catch (error) {
        console.error('Error getting Google Ads campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Ads campaigns',
            error: error.message
        });
    }
};

/**
 * Get Google Ads conversion data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGoogleAdsConversionData = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { accountId, campaignIds } = req.query;

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

        const account = integration.connectedAccounts.find(acc => 
            accountId ? acc.id === accountId : acc.id
        );

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads account not found'
            });
        }

        // Check if token needs refresh
        if (account.expiresAt && new Date() >= account.expiresAt) {
            try {
                const newTokens = await googleAdsService.refreshAccessToken(
                    account.refreshToken,
                    integration.additionalSettings.clientId,
                    integration.additionalSettings.clientSecret
                );

                account.accessToken = newTokens.access_token;
                account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);
                await integration.save();
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                return res.status(401).json({
                    success: false,
                    message: 'Google Ads token expired and refresh failed'
                });
            }
        }

        const conversionData = await googleAdsService.getConversionData(
            account.id,
            account.accessToken,
            campaignIds ? campaignIds.split(',') : []
        );

        res.json({
            success: true,
            data: conversionData,
            accountId: account.id
        });
    } catch (error) {
        console.error('Error getting Google Ads conversion data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Ads conversion data',
            error: error.message
        });
    }
};

/**
 * Test Google Ads integration connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const testGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Google Ads',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        if (!integration.isConnected || !integration.connectedAccounts.length) {
            return res.status(400).json({
                success: false,
                message: 'Google Ads integration not connected'
            });
        }

        const account = integration.connectedAccounts[0];
        
        // Check if token needs refresh
        if (account.expiresAt && new Date() >= account.expiresAt) {
            try {
                const newTokens = await googleAdsService.refreshAccessToken(
                    account.refreshToken,
                    integration.additionalSettings.clientId,
                    integration.additionalSettings.clientSecret
                );

                account.accessToken = newTokens.access_token;
                account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);
                await integration.save();
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                return res.status(401).json({
                    success: false,
                    message: 'Google Ads token expired and refresh failed'
                });
            }
        }

        const isConnected = await googleAdsService.testConnection(account.accessToken);

        res.json({
            success: true,
            connected: isConnected,
            message: isConnected ? 'Google Ads connection successful' : 'Google Ads connection failed'
        });
    } catch (error) {
        console.error('Error testing Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Activate Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const activateGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Google Ads',
                organizationId: organizationId
            },
            { isConnected: true },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Google Ads integration activated',
            data: integration
        });
    } catch (error) {
        console.error('Error activating Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate Google Ads integration',
            error: error.message
        });
    }
};

/**
 * Deactivate Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deactivateGoogleAdsIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Google Ads',
                organizationId: organizationId
            },
            { isConnected: false },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Google Ads integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Google Ads integration deactivated',
            data: integration
        });
    } catch (error) {
        console.error('Error deactivating Google Ads integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate Google Ads integration',
            error: error.message
        });
    }
};


