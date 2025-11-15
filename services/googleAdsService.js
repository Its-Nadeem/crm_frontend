import { google } from 'googleapis';
import axios from 'axios';

class GoogleAdsService {
    constructor() {
        this.oauth2Client = null;
        this.ads = null;
    }

    /**
     * Initialize Google Ads API client with OAuth2 credentials
     * @param {Object} credentials - OAuth2 credentials from Google
     */
    initializeClient(credentials) {
        try {
            this.oauth2Client = new google.auth.OAuth2(
                credentials.client_id,
                credentials.client_secret,
                credentials.redirect_uri
            );

            this.oauth2Client.setCredentials({
                access_token: credentials.access_token,
                refresh_token: credentials.refresh_token
            });

            this.ads = google.ads({
                version: 'v16',
                auth: this.oauth2Client
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Google Ads client:', error);
            return false;
        }
    }

    /**
     * Generate OAuth2 authorization URL
     * @param {string} clientId - Google OAuth2 client ID
     * @param {string} redirectUri - OAuth2 redirect URI
     * @returns {string} Authorization URL
     */
    getAuthUrl(clientId, redirectUri) {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            process.env.GOOGLE_ADS_CLIENT_SECRET,
            redirectUri
        );

        const scopes = [
            'https://www.googleapis.com/auth/adwords',
            'https://www.googleapis.com/auth/ads',
        ];

        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchange authorization code for tokens
     * @param {string} code - Authorization code
     * @param {string} clientId - Google OAuth2 client ID
     * @param {string} clientSecret - Google OAuth2 client secret
     * @param {string} redirectUri - OAuth2 redirect URI
     * @returns {Object} Tokens object
     */
    async getAccessToken(code, clientId, clientSecret, redirectUri) {
        try {
            const oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                redirectUri
            );

            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);

            return tokens;
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }

    /**
     * Get all accessible Google Ads accounts
     * @param {string} accessToken - Access token
     * @returns {Array} List of accessible accounts
     */
    async getAccounts(accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });
            
            const response = await this.ads.customers.listAccessibleCustomers();
            
            if (!response.data.resourceNames) {
                return [];
            }

            const accounts = [];
            for (const resourceName of response.data.resourceNames) {
                const customerId = resourceName.replace('customers/', '');
                const accountInfo = await this.getAccountInfo(customerId, accessToken);
                if (accountInfo) {
                    accounts.push(accountInfo);
                }
            }

            return accounts;
        } catch (error) {
            console.error('Failed to get Google Ads accounts:', error);
            throw error;
        }
    }

    /**
     * Get account information
     * @param {string} customerId - Google Ads customer ID
     * @param {string} accessToken - Access token
     * @returns {Object} Account information
     */
    async getAccountInfo(customerId, accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            const response = await this.ads.customers.get(customerId);
            
            return {
                id: customerId,
                name: response.data.descriptiveName || `Account ${customerId}`,
                currency: response.data.currencyCode || 'USD',
                timeZone: response.data.timeZone || 'America/New_York',
                status: 'Active'
            };
        } catch (error) {
            console.error(`Failed to get account info for ${customerId}:`, error);
            return null;
        }
    }

    /**
     * Get campaigns for a specific account
     * @param {string} customerId - Google Ads customer ID
     * @param {string} accessToken - Access token
     * @returns {Array} List of campaigns
     */
    async getCampaigns(customerId, accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            const query = `
                SELECT 
                    campaign.id,
                    campaign.name,
                    campaign.status,
                    campaign.budget_micros,
                    campaign.target_cpa_micros,
                    metrics.impressions,
                    metrics.clicks,
                    metrics.conversions,
                    metrics.cost_micros
                FROM campaign
                WHERE campaign.status IN ('ENABLED', 'PAUSED')
                ORDER BY campaign.name
            `;

            const response = await this.ads.customers.googleAds.search({
                customerId: customerId,
                query: query
            });

            const campaigns = [];
            if (response.data.results) {
                for (const row of response.data.results) {
                    const campaign = row.campaign;
                    const metrics = row.metrics;

                    campaigns.push({
                        id: campaign.id,
                        name: campaign.name,
                        status: campaign.status,
                        budget: campaign.budgetMicros ? parseInt(campaign.budgetMicros) / 1000000 : 0,
                        targetCpa: campaign.targetCpaMicros ? parseInt(campaign.targetCpaMicros) / 1000000 : null,
                        impressions: metrics ? parseInt(metrics.impressions) : 0,
                        clicks: metrics ? parseInt(metrics.clicks) : 0,
                        conversions: metrics ? parseFloat(metrics.conversions) : 0,
                        cost: metrics ? parseInt(metrics.costMicros) / 1000000 : 0,
                        customerId: customerId
                    });
                }
            }

            return campaigns;
        } catch (error) {
            console.error(`Failed to get campaigns for customer ${customerId}:`, error);
            throw error;
        }
    }

    /**
     * Get conversion data for campaigns
     * @param {string} customerId - Google Ads customer ID
     * @param {string} accessToken - Access token
     * @param {Array} campaignIds - List of campaign IDs to get conversions for
     * @returns {Object} Conversion data
     */
    async getConversionData(customerId, accessToken, campaignIds = []) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            let query = `
                SELECT 
                    campaign.id,
                    campaign.name,
                    metrics.conversions,
                    metrics.conversions_value,
                    metrics.cost_micros,
                    metrics.clicks,
                    metrics.impressions
                FROM campaign
                WHERE campaign.status = 'ENABLED'
            `;

            if (campaignIds.length > 0) {
                const ids = campaignIds.map(id => `'${id}'`).join(',');
                query += ` AND campaign.id IN (${ids})`;
            }

            const response = await this.ads.customers.googleAds.search({
                customerId: customerId,
                query: query
            });

            let totalConversions = 0;
            let totalCost = 0;
            let totalClicks = 0;
            let totalImpressions = 0;
            let totalConversionValue = 0;

            if (response.data.results) {
                for (const row of response.data.results) {
                    const metrics = row.metrics;
                    if (metrics) {
                        totalConversions += parseFloat(metrics.conversions || 0);
                        totalCost += parseInt(metrics.costMicros || 0) / 1000000;
                        totalClicks += parseInt(metrics.clicks || 0);
                        totalImpressions += parseInt(metrics.impressions || 0);
                        totalConversionValue += parseFloat(metrics.conversionsValue || 0);
                    }
                }
            }

            return {
                totalConversions,
                totalCost,
                totalClicks,
                totalImpressions,
                totalConversionValue,
                conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
                costPerConversion: totalConversions > 0 ? totalCost / totalConversions : 0,
                campaigns: response.data.results || []
            };
        } catch (error) {
            console.error(`Failed to get conversion data for customer ${customerId}:`, error);
            throw error;
        }
    }

    /**
     * Create a conversion action for lead tracking
     * @param {string} customerId - Google Ads customer ID
     * @param {string} accessToken - Access token
     * @param {Object} conversionData - Conversion action data
     * @returns {Object} Created conversion action
     */
    async createConversionAction(customerId, accessToken, conversionData) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            const conversionAction = {
                name: conversionData.name,
                type: 'WEBPAGE',
                category: 'PURCHASE',
                status: 'ENABLED',
                viewThroughLookbackWindowDays: 30,
                ctcLookbackWindowDays: 90
            };

            const response = await this.ads.customers.conversionActions.create({
                customerId: customerId,
                conversionAction: conversionAction
            });

            return response.data;
        } catch (error) {
            console.error(`Failed to create conversion action for customer ${customerId}:`, error);
            throw error;
        }
    }

    /**
     * Test Google Ads API connection
     * @param {string} accessToken - Access token
     * @returns {boolean} Connection status
     */
    async testConnection(accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });
            
            // Try to list accessible customers as a connection test
            const response = await this.ads.customers.listAccessibleCustomers();
            
            return response.status === 200;
        } catch (error) {
            console.error('Google Ads connection test failed:', error);
            return false;
        }
    }

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Refresh token
     * @param {string} clientId - Google OAuth2 client ID
     * @param {string} clientSecret - Google OAuth2 client secret
     * @returns {Object} New tokens
     */
    async refreshAccessToken(refreshToken, clientId, clientSecret) {
        try {
            const oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                process.env.GOOGLE_ADS_REDIRECT_URI
            );

            oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const { credentials } = await oauth2Client.refreshAccessToken();
            return credentials;
        } catch (error) {
            console.error('Failed to refresh access token:', error);
            throw error;
        }
    }
}

export default new GoogleAdsService();


