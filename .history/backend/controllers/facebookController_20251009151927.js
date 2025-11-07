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

        // In a real implementation, you would make an API call to Facebook
        // For now, we'll simulate getting lead details
        console.log('⚠️ Using mock lead data - replace with real Facebook API call');

        // This is where you would make the actual Facebook API call:
        // const response = await fetch(`https://graph.facebook.com/v18.0/${leadId}?access_token=${accessToken}`);
        // const data = await response.json();

        // For demonstration, we'll return mock data
        return {
            id: leadId,
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            // Add more fields as needed
        };

    } catch (error) {
        console.error('❌ Error fetching Facebook lead details:', error);
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


