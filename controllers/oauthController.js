import googleAdsService from '../services/googleAdsService.js';
import IntegrationSettings from '../models/IntegrationSettings.js';

/**
 * Handle Google OAuth callback for Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleGoogleAdsCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // Handle OAuth errors
        if (error) {
            console.error('Google OAuth error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=${error}`);
        }

        // Validate required parameters
        if (!code || !state) {
            console.error('Missing OAuth parameters:', { code: !!code, state: !!state });
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=missing_params`);
        }

        // Find the integration by state (integration ID)
        const integration = await IntegrationSettings.findById(state);

        if (!integration || integration.source !== 'Google Ads') {
            console.error('Invalid integration state:', state);
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=invalid_state`);
        }

        if (!integration.additionalSettings) {
            console.error('Integration not properly configured');
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=integration_not_configured`);
        }

        const { clientId, clientSecret, redirectUri } = integration.additionalSettings;

        if (!clientId || !clientSecret || !redirectUri) {
            console.error('Integration OAuth settings incomplete');
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=incomplete_oauth_settings`);
        }

        // Exchange authorization code for tokens
        const tokens = await googleAdsService.getAccessToken(
            code,
            clientId,
            clientSecret,
            redirectUri
        );

        // Test connection with the new tokens
        const isConnected = await googleAdsService.testConnection(tokens.access_token);

        if (!isConnected) {
            console.error('Failed to connect to Google Ads API with new tokens');
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=connection_failed`);
        }

        // Get accessible accounts
        const accounts = await googleAdsService.getAccounts(tokens.access_token);

        if (accounts.length === 0) {
            console.error('No Google Ads accounts accessible');
            return res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=no_accounts`);
        }

        // Update integration with connection details
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

        console.log(`Google Ads integration connected successfully for organization: ${integration.organizationId}`);

        // Redirect back to integrations page with success
        res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?success=google_ads_connected&integrationId=${integration._id}`);

    } catch (error) {
        console.error('Google Ads OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/settings/integrations?error=oauth_callback_failed`);
    }
};

/**
 * Initiate Google OAuth flow for Google Ads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initiateGoogleAdsOAuth = async (req, res) => {
    try {
        const { integrationId } = req.params;
        const { organizationId } = req.user;

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

        if (!integration.additionalSettings) {
            return res.status(400).json({
                success: false,
                message: 'Integration not properly configured'
            });
        }

        const { clientId, redirectUri } = integration.additionalSettings;

        if (!clientId || !redirectUri) {
            return res.status(400).json({
                success: false,
                message: 'OAuth settings not configured'
            });
        }

        // Generate OAuth URL
        const authUrl = googleAdsService.getAuthUrl(clientId, redirectUri);

        res.json({
            success: true,
            authUrl: authUrl,
            state: integrationId
        });

    } catch (error) {
        console.error('Error initiating Google Ads OAuth:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Google Ads OAuth',
            error: error.message
        });
    }
};

/**
 * Refresh Google Ads access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshGoogleAdsToken = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { integrationId } = req.params;

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

        if (!integration.isConnected || !integration.connectedAccounts.length) {
            return res.status(400).json({
                success: false,
                message: 'Integration not connected'
            });
        }

        const account = integration.connectedAccounts[0];
        const settings = integration.additionalSettings;

        if (!account.refreshToken || !settings.clientId || !settings.clientSecret) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token or OAuth settings missing'
            });
        }

        // Refresh the access token
        const newTokens = await googleAdsService.refreshAccessToken(
            account.refreshToken,
            settings.clientId,
            settings.clientSecret
        );

        // Update the account with new tokens
        account.accessToken = newTokens.access_token;
        account.expiresAt = new Date(Date.now() + (newTokens.expiry_date || 3600) * 1000);

        await integration.save();

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            expiresAt: account.expiresAt
        });

    } catch (error) {
        console.error('Error refreshing Google Ads token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh Google Ads token',
            error: error.message
        });
    }
};

/**
 * Get OAuth status for Google Ads integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getGoogleAdsOAuthStatus = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { integrationId } = req.params;

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

        const status = {
            isConnected: integration.isConnected,
            hasValidToken: false,
            accountsCount: integration.connectedAccounts?.length || 0,
            expiresAt: null
        };

        if (integration.connectedAccounts && integration.connectedAccounts.length > 0) {
            const account = integration.connectedAccounts[0];
            status.expiresAt = account.expiresAt;
            status.hasValidToken = account.expiresAt && new Date() < account.expiresAt;
        }

        res.json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('Error getting Google Ads OAuth status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Google Ads OAuth status',
            error: error.message
        });
    }
};


