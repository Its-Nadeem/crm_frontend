
import EmailMarketingIntegration from '../models/EmailMarketingIntegration.js';

// @desc    Get all email marketing integrations for organization
// @route   GET /api/integrations/email-marketing
// @access  Private
const getEmailMarketingIntegrations = async (req, res) => {
    try {
        const integrations = await EmailMarketingIntegration.findByOrganization(req.user.organizationId);

        res.json({
            success: true,
            data: integrations,
            count: integrations.length
        });
    } catch (error) {
        console.error('Error fetching email marketing integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email marketing integrations',
            error: error.message
        });
    }
};

// @desc    Get single email marketing integration
// @route   GET /api/integrations/email-marketing/:id
// @access  Private
const getEmailMarketingIntegration = async (req, res) => {
    try {
        const integration = await EmailMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Email marketing integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error fetching email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching email marketing integration',
            error: error.message
        });
    }
};

// @desc    Create email marketing integration
// @route   POST /api/integrations/email-marketing
// @access  Private
const createEmailMarketingIntegration = async (req, res) => {
    try {
        const integrationData = {
            ...req.body,
            organizationId: req.user.organizationId,
            createdBy: req.user.id
        };

        const integration = new EmailMarketingIntegration(integrationData);
        await integration.save();

        res.status(201).json({
            success: true,
            message: 'Email marketing integration created successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error creating email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating email marketing integration',
            error: error.message
        });
    }
};

// @desc    Update email marketing integration
// @route   PUT /api/integrations/email-marketing/:id
// @access  Private
const updateEmailMarketingIntegration = async (req, res) => {
    try {
        const integration = await EmailMarketingIntegration.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId
            },
            {
                ...req.body,
                updatedBy: req.user.id,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Email marketing integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Email marketing integration updated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error updating email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating email marketing integration',
            error: error.message
        });
    }
};

// @desc    Delete email marketing integration
// @route   DELETE /api/integrations/email-marketing/:id
// @access  Private
const deleteEmailMarketingIntegration = async (req, res) => {
    try {
        const integration = await EmailMarketingIntegration.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Email marketing integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Email marketing integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting email marketing integration',
            error: error.message
        });
    }
};

// @desc    Test email marketing integration
// @route   POST /api/integrations/email-marketing/:id/test
// @access  Private
const testEmailMarketingIntegration = async (req, res) => {
    try {
        const integration = await EmailMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Email marketing integration not found'
            });
        }

        // Basic health check - try to connect to the provider
        const startTime = Date.now();

        try {



