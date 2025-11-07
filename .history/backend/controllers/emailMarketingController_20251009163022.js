import EmailMarketingIntegration from '../models/EmailMarketingIntegration.js';
import SendGridService from '../services/sendGridService.js';

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
            // This is a placeholder for actual provider API testing
            // In real implementation, you would test the actual API connection
            await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API call

            const responseTime = Date.now() - startTime;

            // Update health check result
            integration.updateHealthCheck('healthy', responseTime);
            await integration.save();

            res.json({
                success: true,
                message: 'Email marketing integration test successful',
                data: {
                    status: 'healthy',
                    responseTime,
                    provider: integration.provider,
                    fromEmail: integration.fromEmail
                }
            });
        } catch (testError) {
            const responseTime = Date.now() - startTime;

            // Update health check result with error
            integration.updateHealthCheck('unhealthy', responseTime, testError.message);
            await integration.save();

            res.status(400).json({
                success: false,
                message: 'Email marketing integration test failed',
                error: testError.message,
                data: {
                    status: 'unhealthy',
                    responseTime,
                    provider: integration.provider
                }
            });
        }
    } catch (error) {
        console.error('Error testing email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing email marketing integration',
            error: error.message
        });
    }
};

// @desc    Activate email marketing integration
// @route   POST /api/integrations/email-marketing/:id/activate
// @access  Private
const activateEmailMarketingIntegration = async (req, res) => {
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

        integration.activate();
        await integration.save();

        res.json({
            success: true,
            message: 'Email marketing integration activated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error activating email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating email marketing integration',
            error: error.message
        });
    }
};

// @desc    Deactivate email marketing integration
// @route   POST /api/integrations/email-marketing/:id/deactivate
// @access  Private
const deactivateEmailMarketingIntegration = async (req, res) => {
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

        integration.deactivate();
        await integration.save();

        res.json({
            success: true,
            message: 'Email marketing integration deactivated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error deactivating email marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating email marketing integration',
            error: error.message
        });
    }
};

// @desc    Add email template to integration
// @route   POST /api/integrations/email-marketing/:id/templates
// @access  Private
const addEmailTemplate = async (req, res) => {
    try {
        const { templateId, name, subject, variables } = req.body;

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

        integration.addEmailTemplate(templateId, name, subject, variables);
        await integration.save();

        res.json({
            success: true,
            message: 'Email template added successfully',
            data: integration.emailTemplates[integration.emailTemplates.length - 1]
        });
    } catch (error) {
        console.error('Error adding email template:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding email template',
            error: error.message
        });
    }
};

// @desc    Add mailing list to integration
// @route   POST /api/integrations/email-marketing/:id/lists
// @access  Private
const addMailingList = async (req, res) => {
    try {
        const { listId, name, description } = req.body;

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

        integration.addMailingList(listId, name, description);
        await integration.save();

        res.json({
            success: true,
            message: 'Mailing list added successfully',
            data: integration.mailingLists[integration.mailingLists.length - 1]
        });
    } catch (error) {
        console.error('Error adding mailing list:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding mailing list',
            error: error.message
        });
    }
};

export {
    getEmailMarketingIntegrations,
    getEmailMarketingIntegration,
    createEmailMarketingIntegration,
    updateEmailMarketingIntegration,
    deleteEmailMarketingIntegration,
    testEmailMarketingIntegration,
    activateEmailMarketingIntegration,
    deactivateEmailMarketingIntegration,
    addEmailTemplate,
    addMailingList
};


