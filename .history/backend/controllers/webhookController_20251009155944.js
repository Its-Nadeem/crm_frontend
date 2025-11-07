import WebhookConfig from '../models/WebhookConfig.js';
import WebhookDeliveryLog from '../models/WebhookDeliveryLog.js';
import Lead from '../models/Lead.js';
import Stage from '../models/Stage.js';
import User from '../models/User.js';
import { getDeliveryLogs, retrySpecificDelivery } from '../services/webhookDeliveryService.js';

// @desc    Create webhook configuration
// @route   POST /api/webhooks
// @access  Private
const createWebhook = async (req, res) => {
    try {
        const { name, url, events, headers } = req.body;

        // Validate required fields
        if (!name || !url) {
            return res.status(400).json({
                success: false,
                message: 'Name and URL are required'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        const webhookConfig = new WebhookConfig({
            name,
            url,
            events: events || ['lead.created', 'lead.updated'],
            headers: headers || {},
            organizationId: req.user.organizationId
        });

        await webhookConfig.save();

        // Remove sensitive data from response
        const response = webhookConfig.toObject();
        delete response.secret;

        res.status(201).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating webhook',
            error: error.message
        });
    }
};

// @desc    Get all webhooks for organization
// @route   GET /api/webhooks
// @access  Private
const getWebhooks = async (req, res) => {
    try {
        const webhooks = await WebhookConfig.find({
            organizationId: req.user.organizationId
        }).select('-secret');

        res.json({
            success: true,
            data: webhooks
        });

    } catch (error) {
        console.error('Error fetching webhooks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching webhooks',
            error: error.message
        });
    }
};

// @desc    Update webhook configuration
// @route   PUT /api/webhooks/:id
// @access  Private
const updateWebhook = async (req, res) => {
    try {
        const { name, url, events, headers, isEnabled } = req.body;

        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Update fields
        if (name) webhook.name = name;
        if (url) {
            try {
                new URL(url);
                webhook.url = url;
            } catch {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL format'
                });
            }
        }
        if (events) webhook.events = events;
        if (headers) webhook.headers = headers;
        if (typeof isEnabled === 'boolean') webhook.isEnabled = isEnabled;

        await webhook.save();

        // Remove sensitive data from response
        const response = webhook.toObject();
        delete response.secret;

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating webhook',
            error: error.message
        });
    }
};

// @desc    Delete webhook configuration
// @route   DELETE /api/webhooks/:id
// @access  Private
const deleteWebhook = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting webhook',
            error: error.message
        });
    }
};

// @desc    Test webhook
// @route   POST /api/webhooks/:id/test
// @access  Private
const testWebhook = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Create test payload
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            organizationId: webhook.organizationId,
            data: {
                message: 'This is a test webhook',
                test: true
            }
        };

        const result = await webhook.trigger('webhook.test', testPayload.data);

        res.json({
            success: true,
            testResult: result
        });

    } catch (error) {
        console.error('Error testing webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing webhook',
            error: error.message
        });
    }
};

// @desc    Receive webhook (for external integrations)
// @route   POST /api/webhooks/receive
// @access  Public (but requires API key)
const receiveWebhook = async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.query.api_key;

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API key required'
            });
        }

        // Find webhook config by API key
        const webhook = await WebhookConfig.findOne({ apiKey });

        if (!webhook || !webhook.isEnabled) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found or disabled'
            });
        }

        const event = req.headers['x-event'] || 'lead.created';
        const signature = req.headers['x-signature'];
        const timestamp = req.headers['x-timestamp'];

        // Verify signature if provided
        if (signature && timestamp) {
            const isValidSignature = webhook.verifySignature(req.body, signature, timestamp);
            if (!isValidSignature) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid signature'
                });
            }
        }

        // Process the webhook data
        const result = await processWebhookData(webhook, event, req.body);

        res.json({
            success: true,
            message: 'Webhook received successfully',
            processed: result
        });

    } catch (error) {
        console.error('Error receiving webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing webhook',
            error: error.message
        });
    }
};

// @desc    Process webhook data and create/update leads
// @access  Private
const processWebhookData = async (webhook, event, payload) => {
    try {
        const { data } = payload;

        if (!data) {
            return { success: false, message: 'No data provided' };
        }

        // Handle different event types
        switch (event) {
            case 'lead.created':
            case 'lead.updated':
                return await handleLeadWebhook(webhook, data, event === 'lead.created' ? 'create' : 'update');

            default:
                return { success: false, message: `Unsupported event: ${event}` };
        }

    } catch (error) {
        console.error('Error processing webhook data:', error);
        throw error;
    }
};

// @desc    Handle lead-related webhook events
// @access  Private
const handleLeadWebhook = async (webhook, leadData, action) => {
    try {
        const { organizationId } = webhook;

        // Find or create lead
        let lead = null;

        if (action === 'update' && leadData.id) {
            lead = await Lead.findOne({ id: leadData.id, organizationId });
        }

        if (action === 'create' || !lead) {
            lead = new Lead({
                ...leadData,
                organizationId,
                source: 'Webhook'
            });
        } else {
            // Update existing lead
            Object.assign(lead, leadData);
        }

        await lead.save();

        // Trigger webhooks for lead events
        await triggerLeadWebhooks(organizationId, action === 'create' ? 'lead.created' : 'lead.updated', {
            lead: {
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                stage: lead.stage,
                source: lead.source,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt
            }
        });

        return {
            success: true,
            action,
            leadId: lead.id,
            message: `Lead ${action}d successfully`
        };

    } catch (error) {
        console.error('Error handling lead webhook:', error);
        throw error;
    }
};

// @desc    Trigger webhooks for lead events
// @access  Private
const triggerLeadWebhooks = async (organizationId, event, leadData) => {
    try {
        const webhooks = await WebhookConfig.find({
            organizationId,
            isEnabled: true,
            events: event
        });

        const results = [];

        for (const webhook of webhooks) {
            const result = await webhook.trigger(event, leadData);
            results.push({
                webhookId: webhook._id,
                webhookName: webhook.name,
                result
            });
        }

        return results;

    } catch (error) {
        console.error('Error triggering lead webhooks:', error);
        throw error;
    }
};

// @desc    Get API keys for organization
// @route   GET /api/webhooks/api-keys
// @access  Private
const getApiKeys = async (req, res) => {
    try {
        const webhooks = await WebhookConfig.find({
            organizationId: req.user.organizationId
        }).select('name apiKey url events isEnabled');

        res.json({
            success: true,
            data: webhooks
        });

    } catch (error) {
        console.error('Error fetching API keys:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching API keys',
            error: error.message
        });
    }
};

// @desc    Regenerate API key for webhook
// @route   POST /api/webhooks/:id/regenerate-key
// @access  Private
const regenerateApiKey = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Generate new API key and secret
        webhook.apiKey = `wk_${crypto.randomBytes(32).toString('hex')}`;
        webhook.secret = crypto.randomBytes(64).toString('hex');
        await webhook.save();

        // Remove sensitive data from response
        const response = webhook.toObject();
        delete response.secret;

        res.json({
            success: true,
            message: 'API key regenerated successfully',
            data: response
        });

    } catch (error) {
        console.error('Error regenerating API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error regenerating API key',
            error: error.message
        });
    }
};

// @desc    Get delivery logs for a webhook
// @route   GET /api/webhooks/:id/logs
// @access  Private
const getWebhookLogs = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const logs = await getDeliveryLogs(req.params.id, parseInt(limit));

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });

    } catch (error) {
        console.error('Error fetching webhook logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching webhook logs',
            error: error.message
        });
    }
};

// @desc    Get webhook with secret (masked)
// @route   GET /api/webhooks/:id/secret
// @access  Private
const getWebhookSecret = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        res.json({
            success: true,
            data: {
                secret: webhook.getMaskedSecret(),
                hasSecret: !!webhook.secret
            }
        });

    } catch (error) {
        console.error('Error fetching webhook secret:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching webhook secret',
            error: error.message
        });
    }
};

// @desc    Regenerate webhook secret
// @route   POST /api/webhooks/:id/regenerate-secret
// @access  Private
const regenerateWebhookSecret = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        const newSecret = webhook.regenerateSecret();
        await webhook.save();

        res.json({
            success: true,
            message: 'Webhook secret regenerated successfully',
            data: {
                secret: newSecret,
                maskedSecret: webhook.getMaskedSecret()
            }
        });

    } catch (error) {
        console.error('Error regenerating webhook secret:', error);
        res.status(500).json({
            success: false,
            message: 'Error regenerating webhook secret',
            error: error.message
        });
    }
};

// @desc    Retry a specific delivery
// @route   POST /api/webhooks/deliveries/:deliveryId/retry
// @access  Private
const retryDelivery = async (req, res) => {
    try {
        const delivery = await retrySpecificDelivery(req.params.deliveryId);

        res.json({
            success: true,
            message: 'Delivery retry initiated',
            data: delivery
        });

    } catch (error) {
        console.error('Error retrying delivery:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error retrying delivery'
        });
    }
};

// @desc    Enhanced webhook test with delivery logging
// @route   POST /api/webhooks/:id/test
// @access  Private
const testWebhookEnhanced = async (req, res) => {
    try {
        const webhook = await WebhookConfig.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Validate URL before testing
        let url = webhook.url;
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook URL'
            });
        }

        // Block localhost/ngrok in production
        if (process.env.NODE_ENV === 'production') {
            if (url.includes('localhost') || url.includes('ngrok') || url.includes('127.0.0.1')) {
                return res.status(400).json({
                    success: false,
                    message: 'Localhost and ngrok URLs are not allowed in production'
                });
            }
        }

        // Create test payload
        const testPayload = {
            event: 'lead.created',
            timestamp: new Date().toISOString(),
            organizationId: webhook.organizationId,
            data: {
                message: 'This is a test webhook from Clienn CRM',
                test: true,
                webhookName: webhook.name,
                timestamp: new Date().toISOString()
            }
        };

        const result = await webhook.trigger('lead.created', testPayload.data);

        res.json({
            success: true,
            message: 'Webhook test completed',
            testResult: result
        });

    } catch (error) {
        console.error('Error testing webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing webhook',
            error: error.message
        });
    }
};

export {
    createWebhook,
    getWebhooks,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    testWebhookEnhanced,
    receiveWebhook,
    getApiKeys,
    regenerateApiKey,
    triggerLeadWebhooks,
    getWebhookLogs,
    retryDelivery,
    getWebhookSecret,
    regenerateWebhookSecret
};


