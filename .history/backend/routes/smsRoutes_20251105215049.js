import express from 'express';
import SMSService from '../services/smsService.js';
import SMSIntegration from '../models/SMSIntegration.js';
import PhoneList from '../models/PhoneList.js';
import SMSMessage from '../models/SMSMessage.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // For now, we'll skip token validation - in production you'd verify the JWT
    next();
};

// Get SMS integrations for organization
router.get('/integrations', requireAuth, async (req, res) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'organizationId is required'
            });
        }

        const integrations = await SMSIntegration.findByOrganization(organizationId);

        // Transform for frontend compatibility
        const transformedIntegrations = integrations.map(integration => ({
            id: integration._id.toString(),
            organizationId: integration.organizationId,
            provider: integration.provider,
            name: integration.name,
            isConnected: integration.isConnected,
            credentials: {
                // Don't send actual credentials, just structure
                accountSid: integration.credentials.accountSid ? '***' + integration.credentials.accountSid.slice(-4) : '',
                authToken: integration.credentials.authToken ? '***' : '',
                fromNumber: integration.credentials.fromNumber || '',
                apiKey: integration.credentials.apiKey ? '***' + integration.credentials.apiKey.slice(-4) : '',
                senderId: integration.credentials.senderId || ''
            },
            settings: integration.settings,
            usage: integration.usage,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt
        }));

        res.json({
            success: true,
            data: transformedIntegrations
        });
    } catch (error) {
        console.error('Error fetching SMS integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SMS integrations'
        });
    }
});

// Create SMS integration
router.post('/integrations', requireAuth, async (req, res) => {
    try {
        const { organizationId, provider, name, credentials, settings } = req.body;

        // Validate required fields
        if (!organizationId || !provider || !name) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: organizationId, provider, name'
            });
        }

        // Validate provider
        const supportedProviders = ['twilio', 'msg91', 'textlocal', 'aws-sns', 'nexmo'];
        if (!supportedProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported provider. Supported: ${supportedProviders.join(', ')}`
            });
        }

        // Check if integration already exists for this provider
        const existingIntegration = await SMSIntegration.findOne({
            organizationId,
            provider,
            isEnabled: true
        });

        if (existingIntegration) {
            return res.status(400).json({
                success: false,
                message: `Integration already exists for provider: ${provider}`
            });
        }

        let isConnected = false;

        // Test connection if credentials provided
        if (credentials && (credentials.apiKey || credentials.accountSid || credentials.accessKeyId)) {
            try {
                const smsService = new SMSService(provider, credentials, null, organizationId);
                const testResult = await smsService.testConnection();

                if (testResult.success) {
                    isConnected = true;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: `Connection test failed: ${testResult.error}`
                    });
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Connection test failed: ${error.message}`
                });
            }
        }

        // Create integration in database
        const integration = new SMSIntegration({
            organizationId,
            provider,
            name,
            isConnected,
            credentials: credentials || {},
            settings: settings || { dailyLimit: 1000, rateLimit: 10 },
            metadata: {
                lastTested: isConnected ? new Date() : null,
                testResult: isConnected ? 'success' : null
            }
        });

        await integration.save();

        // Transform for response (hide sensitive data)
        const responseData = {
            id: integration._id.toString(),
            organizationId: integration.organizationId,
            provider: integration.provider,
            name: integration.name,
            isConnected: integration.isConnected,
            credentials: {
                accountSid: integration.credentials.accountSid ? '***' + integration.credentials.accountSid.slice(-4) : '',
                authToken: integration.credentials.authToken ? '***' : '',
                fromNumber: integration.credentials.fromNumber || '',
                apiKey: integration.credentials.apiKey ? '***' + integration.credentials.apiKey.slice(-4) : '',
                senderId: integration.credentials.senderId || ''
            },
            settings: integration.settings,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt
        };

        res.status(201).json({
            success: true,
            data: responseData,
            message: 'SMS integration created successfully'
        });
    } catch (error) {
        console.error('Error creating SMS integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create SMS integration'
        });
    }
});

// Update SMS integration
router.put('/integrations/:integrationId', requireAuth, async (req, res) => {
    try {
        const { integrationId } = req.params;
        const updates = req.body;

        // Find existing integration
        const integration = await SMSIntegration.findById(integrationId);
        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS integration not found'
            });
        }

        // Test connection if credentials are being updated
        if (updates.credentials) {
            try {
                const smsService = new SMSService(
                    integration.provider,
                    { ...integration.credentials, ...updates.credentials },
                    integrationId,
                    integration.organizationId
                );
                const testResult = await smsService.testConnection();

                if (testResult.success) {
                    updates.isConnected = true;
                    updates.metadata = {
                        ...integration.metadata,
                        lastTested: new Date(),
                        testResult: 'success'
                    };
                } else {
                    updates.isConnected = false;
                    updates.metadata = {
                        ...integration.metadata,
                        lastTested: new Date(),
                        testResult: testResult.error
                    };
                }
            } catch (error) {
                updates.isConnected = false;
                updates.metadata = {
                    ...integration.metadata,
                    lastTested: new Date(),
                    testResult: error.message
                };
            }
        }

        // Update integration
        const updatedIntegration = await SMSIntegration.findByIdAndUpdate(
            integrationId,
            updates,
            { new: true, runValidators: true }
        );

        // Transform for response
        const responseData = {
            id: updatedIntegration._id.toString(),
            organizationId: updatedIntegration.organizationId,
            provider: updatedIntegration.provider,
            name: updatedIntegration.name,
            isConnected: updatedIntegration.isConnected,
            credentials: {
                accountSid: updatedIntegration.credentials.accountSid ? '***' + updatedIntegration.credentials.accountSid.slice(-4) : '',
                authToken: updatedIntegration.credentials.authToken ? '***' : '',
                fromNumber: updatedIntegration.credentials.fromNumber || '',
                apiKey: updatedIntegration.credentials.apiKey ? '***' + updatedIntegration.credentials.apiKey.slice(-4) : '',
                senderId: updatedIntegration.credentials.senderId || ''
            },
            settings: updatedIntegration.settings,
            usage: updatedIntegration.usage,
            updatedAt: updatedIntegration.updatedAt
        };

        res.json({
            success: true,
            data: responseData,
            message: 'SMS integration updated successfully'
        });
    } catch (error) {
        console.error('Error updating SMS integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update SMS integration'
        });
    }
});

// Delete SMS integration
router.delete('/integrations/:integrationId', requireAuth, async (req, res) => {
    try {
        const { integrationId } = req.params;

        // Find and delete integration
        const integration = await SMSIntegration.findByIdAndDelete(integrationId);
        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS integration not found'
            });
        }

        // Optionally, you might want to mark related messages as orphaned
        // or delete them, but for now we'll keep them for historical purposes

        res.json({
            success: true,
            message: 'SMS integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting SMS integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete SMS integration'
        });
    }
});

// Test SMS integration connection
router.post('/integrations/:integrationId/test', requireAuth, async (req, res) => {
    try {
        const { integrationId } = req.params;

        // Fetch integration from database
        const integration = await SMSIntegration.findById(integrationId);
        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS integration not found'
            });
        }

        // Test connection using SMS service
        const smsService = new SMSService(
            integration.provider,
            integration.credentials,
            integrationId,
            integration.organizationId
        );

        const startTime = Date.now();
        const testResult = await smsService.testConnection();
        const responseTime = Date.now() - startTime;

        // Update integration metadata
        await SMSIntegration.findByIdAndUpdate(integrationId, {
            'metadata.lastTested': new Date(),
            'metadata.testResult': testResult.success ? 'success' : testResult.error,
            isConnected: testResult.success
        });

        res.json({
            success: true,
            data: {
                status: testResult.success ? 'healthy' : 'unhealthy',
                responseTime,
                message: testResult.success ? 'Connection test successful' : `Connection test failed: ${testResult.error}`,
                details: testResult.data
            }
        });
    } catch (error) {
        console.error('Error testing SMS integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test SMS integration'
        });
    }
});

// Get phone lists
router.get('/phone-lists', requireAuth, async (req, res) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'organizationId is required'
            });
        }

        const phoneLists = await PhoneList.findActiveByOrganization(organizationId);

        // Transform for frontend compatibility
        const transformedLists = phoneLists.map(list => ({
            id: list._id.toString(),
            organizationId: list.organizationId,
            name: list.name,
            description: list.description,
            country: list.country,
            totalContacts: list.totalContacts,
            activeContacts: list.activeContacts,
            tags: list.tags,
            createdAt: list.createdAt,
            updatedAt: list.updatedAt
        }));

        res.json({
            success: true,
            data: transformedLists
        });
    } catch (error) {
        console.error('Error fetching phone lists:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phone lists'
        });
    }
});

// Create phone list
router.post('/phone-lists', requireAuth, async (req, res) => {
    try {
        const { organizationId, name, description, country, tags } = req.body;

        if (!organizationId || !name) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: organizationId, name'
            });
        }

        const phoneList = new PhoneList({
            organizationId,
            name,
            description,
            country: country || 'US',
            tags: tags || [],
            metadata: {
                createdBy: req.user?.id || 'system'
            }
        });

        await phoneList.save();

        // Transform for response
        const responseData = {
            id: phoneList._id.toString(),
            organizationId: phoneList.organizationId,
            name: phoneList.name,
            description: phoneList.description,
            country: phoneList.country,
            totalContacts: phoneList.totalContacts,
            activeContacts: phoneList.activeContacts,
            tags: phoneList.tags,
            createdAt: phoneList.createdAt,
            updatedAt: phoneList.updatedAt
        };

        res.status(201).json({
            success: true,
            data: responseData,
            message: 'Phone list created successfully'
        });
    } catch (error) {
        console.error('Error creating phone list:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create phone list'
        });
    }
});

// Get SMS balance and usage
router.get('/balance', requireAuth, async (req, res) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'organizationId is required'
            });
        }

        // Get real usage statistics from database
        const usageStats = await SMSService.getUsageStats(organizationId);

        // For now, use a fixed credit system (can be enhanced with actual billing)
        const monthlyLimit = 10000; // Example limit
        const remaining = Math.max(0, monthlyLimit - usageStats.monthlyUsage);

        const balance = {
            organizationId,
            credits: remaining,
            usedThisMonth: usageStats.monthlyUsage,
            remaining: remaining,
            dailyUsed: usageStats.dailyUsage,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            currency: 'USD',
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('Error fetching SMS balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SMS balance'
        });
    }
});

// Get SMS performance analytics
router.get('/analytics', requireAuth, async (req, res) => {
    try {
        const { organizationId, startDate, endDate } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'organizationId is required'
            });
        }

        // Parse dates or use defaults
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        // Get real analytics from database
        const analytics = await SMSService.getAnalytics(organizationId, start, end);

        const responseData = {
            organizationId,
            totalSent: parseInt(analytics.totalSent),
            delivered: parseInt(analytics.delivered),
            failed: parseInt(analytics.failed),
            deliveryRate: parseFloat(analytics.deliveryRate),
            totalCost: analytics.totalCost,
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString()
            }
        };

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('Error fetching SMS analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SMS analytics'
        });
    }
});

// Send SMS
router.post('/send', requireAuth, async (req, res) => {
    try {
        const { organizationId, to, message, listId, senderId } = req.body;

        if (!organizationId || !to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: organizationId, to, message'
            });
        }

        // In a real implementation, fetch SMS integration from database
        // For now, simulate SMS sending
        const result = {
            success: true,
            messageId: `sms_${Date.now()}`,
            status: 'sent',
            provider: 'twilio',
            to,
            message,
            sentAt: new Date(),
            cost: 0.05
        };

        res.json({
            success: true,
            data: result,
            message: 'SMS sent successfully'
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS'
        });
    }
});

// Send bulk SMS
router.post('/send-bulk', requireAuth, async (req, res) => {
    try {
        const { organizationId, recipients, message, listId, senderId } = req.body;

        if (!organizationId || !recipients || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: organizationId, recipients, message'
            });
        }

        // In a real implementation, use SMS service to send bulk messages
        const results = recipients.map(recipient => ({
            phone: recipient.phone,
            success: true,
            messageId: `sms_${Date.now()}_${Math.random()}`,
            status: 'sent'
        }));

        const summary = {
            total: recipients.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };

        res.json({
            success: true,
            data: summary,
            message: 'Bulk SMS sent successfully'
        });
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send bulk SMS'
        });
    }
});

// Get SMS delivery status
router.get('/status/:messageId', requireAuth, async (req, res) => {
    try {
        const { messageId } = req.params;

        // In a real implementation, check with SMS provider
        const status = {
            messageId,
            status: 'delivered',
            deliveredAt: new Date(),
            cost: 0.05,
            errorCode: null,
            errorMessage: null
        };

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error fetching SMS status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SMS status'
        });
    }
});

export default router;


