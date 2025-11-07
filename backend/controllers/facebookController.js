import Lead from '../models/Lead.js';
import IntegrationSettings from '../models/IntegrationSettings.js';
import { processFieldMappings } from '../utils/fieldMapping.js';

// @desc    Verify Facebook webhook (GET request)
// @route   GET /webhook/facebook
// @access  Public (Facebook's verification)
const verifyWebhook = async (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('Facebook webhook verification:', { mode, token: token?.substring(0, 10) + '...', challenge });

        // Check if a token is provided
        if (!token) {
            console.error('No verify token provided by Facebook');
            return res.status(400).send('No verify token provided');
        }

        // Check the mode and token sent is correct
        if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
            console.log('Facebook webhook verified successfully');
            // Respond with the challenge token from the request
            return res.status(200).send(challenge);
        } else {
            console.error('Facebook webhook verification failed - invalid token or mode');
            return res.status(403).send('Forbidden');
        }
    } catch (error) {
        console.error('Error verifying Facebook webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};

// @desc    Receive Facebook leads (POST request)
// @route   POST /webhook/facebook
// @access  Public (Facebook's webhook)
const receiveLeads = async (req, res) => {
    try {
        const body = req.body;

        console.log('Received Facebook webhook:', {
            object: body.object,
            entries: body.entry?.length || 0
        });

        // Check if this is an event from a Facebook app
        if (body.object === 'page') {
            // Iterate over each entry - there may be multiple if batched
            for (const entry of body.entry) {
                const webhookEvent = entry.messaging[0];
                console.log('Processing webhook event:', webhookEvent);

                // Process lead data if present
                if (webhookEvent.lead) {
                    await processFacebookLead(webhookEvent.lead);
                }
            }

            // Return a '200 OK' response to all requests
            return res.status(200).send('EVENT_RECEIVED');
        } else {
            // Return a '404 Not Found' if event is not from a Facebook app
            console.warn('Received non-page event:', body.object);
            return res.status(404).send('Not Found');
        }
    } catch (error) {
        console.error('Error processing Facebook webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};

// @desc    Process individual Facebook lead
const processFacebookLead = async (leadData) => {
    let integrationSettings;

    try {
        console.log('Processing Facebook lead:', leadData.id);

        // Get lead details from Facebook API
        const leadDetails = await getFacebookLeadDetails(leadData.id);

        if (!leadDetails) {
            console.error('Failed to fetch lead details from Facebook');
            return;
        }

        console.log('Facebook lead details:', {
            name: leadDetails.name,
            email: leadDetails.email,
            phone: leadDetails.phone
        });

        // Find integration settings for Facebook
        integrationSettings = await IntegrationSettings.findOne({
            source: 'Facebook',
            isConnected: true
        });

        if (!integrationSettings) {
            console.error('No Facebook integration settings found');
            return;
        }

        // Map Facebook fields to CRM fields
        const mappedData = processFieldMappings(leadDetails, integrationSettings.fieldMappings);

        // Create lead in CRM
        const lead = new Lead({
            name: mappedData.name || leadDetails.name || 'Unknown',
            email: mappedData.email || leadDetails.email,
            phone: mappedData.phone || leadDetails.phone,
            source: 'Facebook',
            stage: 'New', // Default stage for new leads
            followUpStatus: 'Pending',
            score: 0,
            tags: ['Facebook Lead'],
            assignedToId: 1, // Default assignment - should be improved
            dealValue: 0,
            closeDate: new Date(),
            activities: [{
                type: 'LEAD_CREATED',
                content: `Lead created from Facebook Lead Ad`,
                timestamp: new Date(),
                authorId: 1 // System user
            }],
            organizationId: integrationSettings.organizationId,
            customFields: mappedData.customFields || {}
        });

        const savedLead = await lead.save();
        console.log('Facebook lead saved to CRM:', savedLead.id);

        // Log the integration
        await logIntegrationActivity(integrationSettings.organizationId, 'Facebook', 'SUCCESS', {
            leadId: savedLead.id,
            facebookLeadId: leadData.id,
            leadName: leadDetails.name
        });

    } catch (error) {
        console.error('Error processing Facebook lead:', error);

        // Log the error
        if (integrationSettings?.organizationId) {
            await logIntegrationActivity(integrationSettings.organizationId, 'Facebook', 'FAILED', {
                facebookLeadId: leadData.id,
                error: error.message
            });
        }
    }
};

// @desc    Get lead details from Facebook API
const getFacebookLeadDetails = async (leadId) => {
    try {
        console.log('📋 Fetching lead details from Facebook API for lead:', leadId);

        // Check if we have stored lead data in our database first
        const existingLead = await Lead.findOne({ 'customFields.facebookLeadId': leadId });

        if (existingLead) {
            console.log('✅ Found existing lead data in database');
            return {
                id: leadId,
                name: existingLead.name,
                email: existingLead.email,
                phone: existingLead.phone,
                customFields: existingLead.customFields
            };
        }

        // If no stored data, make actual Facebook API call
        // Note: This requires proper Facebook API setup with access tokens
        console.log('🔄 Making Facebook API call for lead details');

        // Get Facebook access token
        const accessToken = await getFacebookAccessToken();
        if (!accessToken) {
            console.error('❌ No Facebook access token available');
            return null;
        }

        // Make Facebook API call to get lead details
        const response = await fetch(`https://graph.facebook.com/v18.0/${leadId}?access_token=${accessToken}&fields=id,created_time,ad_id,form_id,field_data,campaign_id,adset_id`);

        if (!response.ok) {
            console.error('❌ Facebook API call failed:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        if (!data || !data.field_data) {
            console.error('❌ Invalid Facebook lead data received');
            return null;
        }

        // Parse Facebook lead data
        const leadInfo = parseFacebookLeadData(data);
        console.log('✅ Successfully retrieved Facebook lead data:', leadInfo.name);

        return leadInfo;

    } catch (error) {
        console.error('❌ Error fetching Facebook lead details:', error);
        return null;
    }
};

// @desc    Get Facebook access token
const getFacebookAccessToken = async () => {
    try {
        // First try to get from environment variables
        if (process.env.FB_ACCESS_TOKEN) {
            return process.env.FB_ACCESS_TOKEN;
        }

        // Try to get from integration settings (long-lived token)
        const integrationSettings = await IntegrationSettings.findOne({
            source: 'Facebook',
            isConnected: true
        });

        if (integrationSettings?.accessToken) {
            return integrationSettings.accessToken;
        }

        console.error('❌ No Facebook access token found');
        return null;
    } catch (error) {
        console.error('❌ Error getting Facebook access token:', error);
        return null;
    }
};

// @desc    Parse Facebook lead data from API response
const parseFacebookLeadData = (facebookData) => {
    try {
        const fieldData = facebookData.field_data || [];
        const leadInfo = {
            id: facebookData.id,
            name: '',
            email: '',
            phone: '',
            customFields: {
                facebookLeadId: facebookData.id,
                facebookFormId: facebookData.form_id,
                facebookAdId: facebookData.ad_id,
                facebookCampaignId: facebookData.campaign_id,
                facebookAdsetId: facebookData.adset_id,
                facebookCreatedTime: facebookData.created_time
            }
        };

        // Parse field data to extract name, email, phone
        fieldData.forEach(field => {
            const fieldName = field.name?.toLowerCase();
            const fieldValue = field.values?.[0] || '';

            switch (fieldName) {
                case 'full_name':
                case 'name':
                    leadInfo.name = fieldValue;
                    break;
                case 'email':
                case 'email_address':
                    leadInfo.email = fieldValue;
                    break;
                case 'phone':
                case 'phone_number':
                case 'mobile':
                    leadInfo.phone = fieldValue;
                    break;
                default:
                    // Store other fields in custom fields
                    leadInfo.customFields[`facebook_${fieldName}`] = fieldValue;
                    break;
            }
        });

        // Fallback: try to construct name from first_name and last_name if full name not available
        if (!leadInfo.name) {
            const firstName = fieldData.find(f => f.name?.toLowerCase() === 'first_name')?.values?.[0] || '';
            const lastName = fieldData.find(f => f.name?.toLowerCase() === 'last_name')?.values?.[0] || '';
            if (firstName || lastName) {
                leadInfo.name = `${firstName} ${lastName}`.trim();
            }
        }

        return leadInfo;
    } catch (error) {
        console.error('❌ Error parsing Facebook lead data:', error);
        return null;
    }
};

// @desc    Log integration activity
const logIntegrationActivity = async (organizationId, source, status, details) => {
    try {
        // You could create an IntegrationLog model for this
        console.log('Integration activity:', { organizationId, source, status, details });
    } catch (error) {
        console.error('Error logging integration activity:', error);
    }
};

export { verifyWebhook, receiveLeads };


