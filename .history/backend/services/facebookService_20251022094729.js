import axios from 'axios';

class FacebookService {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
        this.appId = process.env.FB_APP_ID;
        this.appSecret = process.env.FB_APP_SECRET;
        this.redirectUri = process.env.FB_REDIRECT_URI;
        this.allowedRedirects = (process.env.FB_ALLOWED_REDIRECTS || '').split(',').map(s => s.trim()).filter(Boolean);

        this.redirectUri = process.env.FB_REDIRECT_URI;
    }

    /**
     * Generate Facebook OAuth URL for authorization
     */
    getAuthUrl(tenantId, redirectOverride) {
        const scopes = [
            'pages_read_engagement',
            'pages_show_list',
            'pages_manage_metadata',
            'leads_retrieval',
            'read_insights',
            'email',
            'public_profile'
        ].join(',');

        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            scope: scopes,
            response_type: 'code',
            state: tenantId,
            display: 'page'
        });

        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code) {
        try {
            console.log('🔄 Exchanging code for token:', { appId: this.appId, redirectUri: this.redirectUri });

            const params = {
                client_id: this.appId,
                client_secret: this.appSecret,
                redirect_uri: this.redirectUri,
                code: code
            };

            const response = await axios.get(`${this.baseURL}/oauth/access_token`, { params });

            if (response.data.error) {
                throw new Error(`Facebook OAuth error: ${response.data.error.message}`);
            }

            console.log('✅ Token exchange successful');
            return response.data.access_token;
        } catch (error) {
            console.error('❌ Error exchanging code for token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get long-lived access token from short-lived token
     */
    async getLongLivedToken(shortLivedToken) {
        try {
            const params = {
                grant_type: 'fb_exchange_token',
                client_id: this.appId,
                client_secret: this.appSecret,
                fb_exchange_token: shortLivedToken
            };

            const response = await axios.get(`${this.baseURL}/oauth/access_token`, { params });

            if (response.data.error) {
                throw new Error(`Facebook token exchange error: ${response.data.error.message}`);
            }

            return response.data.access_token;
        } catch (error) {
            console.error('Error getting long-lived token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
      * Get user information using access token
      */
     async getUserInfo(accessToken) {
         try {
             console.log('👤 Fetching user information from Facebook API');

             const params = {
                 access_token: accessToken,
                 fields: 'id,name,email,first_name,last_name'
             };

             const response = await axios.get(`${this.baseURL}/me`, { params });

             if (response.data.error) {
                 throw new Error(`Facebook API error: ${response.data.error.message}`);
             }

             console.log('✅ User information fetched successfully');
             return {
                 userId: response.data.id,
                 name: response.data.name,
                 email: response.data.email,
                 firstName: response.data.first_name,
                 lastName: response.data.last_name
             };
         } catch (error) {
             console.error('❌ Error fetching user information:', error.response?.data || error.message);

             // If it's a token error, try to refresh or provide more context
             if (error.response?.data?.error?.code === 190) {
                 console.error('❌ Token expired or invalid');
             } else if (error.response?.data?.error?.code === 100) {
                 console.error('❌ Insufficient permissions to access user info');
             }

             throw error;
         }
     }

    /**
     * Get user pages using long-lived token
     */
    async getUserPages(accessToken) {
        try {
            console.log('📄 Fetching user pages from Facebook API');

            const params = {
                access_token: accessToken,
                fields: 'id,name,access_token,instagram_business_account'
            };

            const response = await axios.get(`${this.baseURL}/me/accounts`, { params });

            if (response.data.error) {
                throw new Error(`Facebook API error: ${response.data.error.message}`);
            }

            const pages = response.data.data.map(page => ({
                pageId: page.id,
                pageName: page.name,
                pageAccessToken: page.access_token,
                instagramBusinessAccount: page.instagram_business_account?.id || page.instagram_business_account || null
            }));

            console.log(`✅ Found ${pages.length} Facebook pages`);
            return pages;
        } catch (error) {
            console.error('❌ Error fetching user pages:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get lead gen forms for a specific page
     */
    async getLeadGenForms(pageId, pageAccessToken) {
        try {
            const params = {
                access_token: pageAccessToken,
                fields: 'id,name,leads_count,created_time'
            };

            const response = await axios.get(`${this.baseURL}/${pageId}/leadgen_forms`, { params });

            if (response.data.error) {
                throw new Error(`Facebook API error: ${response.data.error.message}`);
            }

            return response.data.data.map(form => ({
                formId: form.id,
                formName: form.name,
                leadsCount: form.leads_count,
                createdTime: form.created_time
            }));
        } catch (error) {
            console.error('Error fetching lead gen forms:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get lead details by lead gen ID
     */
    async getLeadDetails(leadGenId, pageAccessToken) {
        try {
            const params = {
                access_token: pageAccessToken,
                fields: 'id,created_time,field_data,custom_data'
            };

            const response = await axios.get(`${this.baseURL}/${leadGenId}`, { params });

            if (response.data.error) {
                throw new Error(`Facebook API error: ${response.data.error.message}`);
            }

            return {
                leadId: response.data.id,
                createdTime: response.data.created_time,
                fieldData: response.data.field_data || [],
                customData: response.data.custom_data || []
            };
        } catch (error) {
            console.error('Error fetching lead details:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Subscribe page to webhook
     */
    async subscribePageToWebhook(pageId, pageAccessToken) {
        try {
            const data = {
                subscribed_fields: ['leadgen'],
                access_token: pageAccessToken
            };

            const response = await axios.post(`${this.baseURL}/${pageId}/subscribed_apps`, data);

            if (response.data.error) {
                throw new Error(`Facebook subscription error: ${response.data.error.message}`);
            }

            return response.data.success;
        } catch (error) {
            console.error('Error subscribing page to webhook:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Normalize lead data for CRM storage
     */
    normalizeLeadData(leadDetails, fieldMapping) {
        const normalized = {
            source: 'Facebook',
            createdAt: new Date(leadDetails.createdTime),
            rawData: leadDetails
        };

        // Map Facebook fields to CRM fields
        if (fieldMapping && leadDetails.fieldData) {
            leadDetails.fieldData.forEach(field => {
                const crmField = fieldMapping[field.name];
                if (crmField) {
                    normalized[crmField] = field.values[0];
                }
            });
        }

        // Extract common fields if not mapped
        if (!normalized.name && leadDetails.fieldData) {
            const fullNameField = leadDetails.fieldData.find(f => f.name === 'full_name');
            if (fullNameField) {
                normalized.name = fullNameField.values[0];
            }
        }

        if (!normalized.email && leadDetails.fieldData) {
            const emailField = leadDetails.fieldData.find(f => f.name === 'email');
            if (emailField) {
                normalized.email = emailField.values[0];
            }
        }

        if (!normalized.phone && leadDetails.fieldData) {
            const phoneField = leadDetails.fieldData.find(f => f.name === 'phone_number');
            if (phoneField) {
                normalized.phone = phoneField.values[0];
            }
        }

        return normalized;
    }
}

export default FacebookService;


