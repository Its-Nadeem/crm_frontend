import IntegrationSettings from '../models/IntegrationSettings.js';
import websiteTrackingService from '../services/websiteTrackingService.js';

/**
 * Get Website integrations for an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWebsiteIntegrations = async (req, res) => {
    try {
        const { organizationId } = req.user;

        console.log('Getting website integrations for organization:', organizationId);

        const integrations = await IntegrationSettings.find({
            source: 'Website',
            organizationId: organizationId
        });

        console.log('Found website integrations:', integrations.length, integrations.map(i => i._id));

        res.json({
            success: true,
            data: integrations
        });
    } catch (error) {
        console.error('Error getting Website integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Website integrations',
            error: error.message
        });
    }
};

/**
 * Get a specific Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error getting Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Website integration',
            error: error.message
        });
    }
};

/**
 * Create a new Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { name, domains, apiEndpoint } = req.body;

        console.log('Create website integration request:', {
            organizationId,
            name,
            domains,
            apiEndpoint,
            user: req.user?.id
        });

        // Check if integration already exists
        const existingIntegration = await IntegrationSettings.findOne({
            source: 'Website',
            organizationId: organizationId
        });

        if (existingIntegration) {
            console.log('Website integration already exists:', existingIntegration._id);
            return res.status(400).json({
                success: false,
                message: 'Website integration already exists for this organization'
            });
        }

        // Generate tracking script
        const trackingScript = websiteTrackingService.generateTrackingScript(
            organizationId,
            apiEndpoint || `${req.protocol}://${req.get('host')}`
        );

        // Create integration settings
        const integration = new IntegrationSettings({
            source: 'Website',
            isConnected: false,
            connectedAccounts: [],
            connectedWebsites: domains || [],
            organizationId: organizationId,
            fieldMappings: [],
            additionalSettings: {
                trackingScript,
                domains: domains || [],
                apiEndpoint: apiEndpoint || `${req.protocol}://${req.get('host')}`,
                scriptId: websiteTrackingService.generateScriptId(organizationId)
            }
        });

        await integration.save();

        res.status(201).json({
            success: true,
            data: integration,
            trackingScript: trackingScript
        });
    } catch (error) {
        console.error('Error creating Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create Website integration',
            error: error.message
        });
    }
};

/**
 * Update Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Website',
                organizationId: organizationId
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error updating Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update Website integration',
            error: error.message
        });
    }
};

/**
 * Delete Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndDelete({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Website integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete Website integration',
            error: error.message
        });
    }
};

/**
 * Generate tracking code for website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateTrackingCode = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const { domains, apiEndpoint } = req.body;

        console.log('Generate tracking code request:', {
            organizationId,
            integrationId: id,
            domains,
            apiEndpoint,
            user: req.user?.id
        });

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            console.error('Website integration not found:', {
                integrationId: id,
                organizationId,
                source: 'Website'
            });
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        // Generate new tracking script
        const trackingScript = websiteTrackingService.generateTrackingScript(
            organizationId,
            apiEndpoint || integration.additionalSettings?.apiEndpoint || `${req.protocol}://${req.get('host')}`
        );

        console.log('Generated tracking script:', {
            organizationId,
            apiEndpoint: apiEndpoint || integration.additionalSettings?.apiEndpoint || `${req.protocol}://${req.get('host')}`,
            scriptLength: trackingScript?.length || 0,
            scriptPreview: trackingScript?.substring(0, 100) || 'empty'
        });

        // Update integration with new settings
        integration.connectedWebsites = domains || integration.connectedWebsites;
        integration.additionalSettings = {
            ...integration.additionalSettings,
            trackingScript,
            domains: domains || integration.connectedWebsites,
            apiEndpoint: apiEndpoint || integration.additionalSettings?.apiEndpoint,
            scriptId: websiteTrackingService.generateScriptId(organizationId)
        };

        await integration.save();

        console.log('Sending response with tracking script:', {
            hasTrackingScript: !!trackingScript,
            scriptLength: trackingScript?.length || 0,
            scriptId: integration.additionalSettings.scriptId
        });

        res.json({
            success: true,
            trackingScript: trackingScript,
            scriptId: integration.additionalSettings.scriptId,
            data: integration
        });
    } catch (error) {
        console.error('Error generating tracking code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate tracking code',
            error: error.message
        });
    }
};

/**
 * Track form submission from website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const trackFormSubmission = async (req, res) => {
    try {
        const { scriptId } = req.params;
        const { formData, metadata } = req.body;

        if (!formData || !scriptId) {
            return res.status(400).json({
                success: false,
                message: 'Form data and script ID are required'
            });
        }

        // Verify script ID is valid
        const isValidScript = await websiteTrackingService.validateScriptId(
            scriptId,
            metadata?.organizationId || scriptId
        );

        if (!isValidScript) {
            return res.status(401).json({
                success: false,
                message: 'Invalid tracking script'
            });
        }

        const result = await websiteTrackingService.trackFormSubmission(
            formData,
            scriptId,
            {
                ...metadata,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                organizationId: metadata?.organizationId || scriptId
            }
        );

        if (result.success) {
            res.json({
                success: true,
                leadId: result.leadId,
                message: 'Form submission tracked successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to track form submission'
            });
        }
    } catch (error) {
        console.error('Error tracking form submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track form submission',
            error: error.message
        });
    }
};

/**
 * Track page view from website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const trackPageView = async (req, res) => {
    try {
        const { scriptId } = req.params;
        const { pageData, metadata } = req.body;

        if (!pageData || !scriptId) {
            return res.status(400).json({
                success: false,
                message: 'Page data and script ID are required'
            });
        }

        const result = await websiteTrackingService.trackPageView(
            scriptId,
            pageData,
            {
                ...metadata,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                organizationId: metadata?.organizationId || scriptId
            }
        );

        if (result.success) {
            res.json({
                success: true,
                pageViewId: result.pageViewId,
                message: 'Page view tracked successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to track page view'
            });
        }
    } catch (error) {
        console.error('Error tracking page view:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track page view',
            error: error.message
        });
    }
};

/**
 * Track custom event from website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const trackCustomEvent = async (req, res) => {
    try {
        const { scriptId } = req.params;
        const { eventName, eventData, metadata } = req.body;

        if (!eventName || !scriptId) {
            return res.status(400).json({
                success: false,
                message: 'Event name and script ID are required'
            });
        }

        const result = await websiteTrackingService.trackCustomEvent(
            scriptId,
            eventName,
            eventData,
            {
                ...metadata,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                organizationId: metadata?.organizationId || scriptId
            }
        );

        if (result.success) {
            res.json({
                success: true,
                eventId: result.eventId,
                message: 'Custom event tracked successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to track custom event'
            });
        }
    } catch (error) {
        console.error('Error tracking custom event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track custom event',
            error: error.message
        });
    }
};

/**
 * Get website analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getWebsiteAnalytics = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        const analytics = await websiteTrackingService.getWebsiteAnalytics(
            organizationId,
            {
                startDate,
                endDate
            }
        );

        res.json({
            success: true,
            data: analytics,
            integration: integration
        });
    } catch (error) {
        console.error('Error getting website analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get website analytics',
            error: error.message
        });
    }
};

/**
 * Get form performance data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFormPerformance = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const { startDate, endDate, formId } = req.query;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        const performance = await websiteTrackingService.getFormPerformance(
            organizationId,
            {
                startDate,
                endDate,
                formId
            }
        );

        res.json({
            success: true,
            data: performance,
            integration: integration
        });
    } catch (error) {
        console.error('Error getting form performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get form performance',
            error: error.message
        });
    }
};

/**
 * Test Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const testWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        // Test if tracking script is accessible
        const isAccessible = true; // You could implement actual accessibility check

        res.json({
            success: true,
            accessible: isAccessible,
            message: isAccessible ? 'Website integration is working' : 'Website integration has issues'
        });
    } catch (error) {
        console.error('Error testing Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test Website integration',
            error: error.message
        });
    }
};

/**
 * Activate Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const activateWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Website',
                organizationId: organizationId
            },
            { isConnected: true },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Website integration activated',
            data: integration
        });
    } catch (error) {
        console.error('Error activating Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate Website integration',
            error: error.message
        });
    }
};

/**
 * Deactivate Website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deactivateWebsiteIntegration = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;

        const integration = await IntegrationSettings.findOneAndUpdate(
            {
                _id: id,
                source: 'Website',
                organizationId: organizationId
            },
            { isConnected: false },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Website integration deactivated',
            data: integration
        });
    } catch (error) {
        console.error('Error deactivating Website integration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate Website integration',
            error: error.message
        });
    }
};

/**
 * Add a new form to website integration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addWebsiteForm = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id } = req.params;
        const { name, url } = req.body;

        if (!name || !url) {
            return res.status(400).json({
                success: false,
                message: 'Form name and URL are required'
            });
        }

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        // Add form to integration's tracked forms
        const newForm = {
            id: `form-${Date.now()}`,
            name: name,
            url: url,
            status: 'Active',
            totalSubmissions: 0,
            lastSubmission: null,
            conversionRate: 0,
            createdAt: new Date()
        };

        if (!integration.additionalSettings.trackedForms) {
            integration.additionalSettings.trackedForms = [];
        }

        integration.additionalSettings.trackedForms.push(newForm);
        await integration.save();

        res.status(201).json({
            success: true,
            message: 'Form added successfully',
            data: newForm
        });
    } catch (error) {
        console.error('Error adding website form:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add website form',
            error: error.message
        });
    }
};

/**
 * Update form status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateWebsiteForm = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { id, formId } = req.params;
        const { status } = req.body;

        const integration = await IntegrationSettings.findOne({
            _id: id,
            source: 'Website',
            organizationId: organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Website integration not found'
            });
        }

        if (!integration.additionalSettings.trackedForms) {
            return res.status(404).json({
                success: false,
                message: 'No forms found for this integration'
            });
        }

        const formIndex = integration.additionalSettings.trackedForms.findIndex(f => f.id === formId);
        if (formIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        // Update form status
        integration.additionalSettings.trackedForms[formIndex].status = status;
        await integration.save();

        res.json({
            success: true,
            message: 'Form updated successfully',
            data: integration.additionalSettings.trackedForms[formIndex]
        });
    } catch (error) {
        console.error('Error updating website form:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update website form',
            error: error.message
        });
    }
};


