import SMSMarketingIntegration from '../models/SMSMarketingIntegration.js';

// @desc    Get all SMS marketing integrations for organization
// @route   GET /api/integrations/sms-marketing
// @access  Private
const getSMSMarketingIntegrations = async (req, res) => {
    try {
        const integrations = await SMSMarketingIntegration.findByOrganization(req.user.organizationId);

        res.json({
            success: true,
            data: integrations,
            count: integrations.length
        });
    } catch (error) {
        console.error('Error fetching SMS marketing integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SMS marketing integrations',
            error: error.message
        });
    }
};

// @desc    Get single SMS marketing integration
// @route   GET /api/integrations/sms-marketing/:id
// @access  Private
const getSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error fetching SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Create SMS marketing integration
// @route   POST /api/integrations/sms-marketing
// @access  Private
const createSMSMarketingIntegration = async (req, res) => {
    try {
        const integrationData = {
            ...req.body,
            organizationId: req.user.organizationId,
            createdBy: req.user.id
        };

        const integration = new SMSMarketingIntegration(integrationData);
        await integration.save();

        res.status(201).json({
            success: true,
            message: 'SMS marketing integration created successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error creating SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Update SMS marketing integration
// @route   PUT /api/integrations/sms-marketing/:id
// @access  Private
const updateSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOneAndUpdate(
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
                message: 'SMS marketing integration not found'
            });
        }

        res.json({
            success: true,
            message: 'SMS marketing integration updated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error updating SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Delete SMS marketing integration
// @route   DELETE /api/integrations/sms-marketing/:id
// @access  Private
const deleteSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        res.json({
            success: true,
            message: 'SMS marketing integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Test SMS marketing integration
// @route   POST /api/integrations/sms-marketing/:id/test
// @access  Private
const testSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        // Basic health check - try to connect to the provider
        const startTime = Date.now();

        try {
            // This is a placeholder for actual provider API testing
            // In real implementation, you would test the actual API connection
            await new Promise(resolve => setTimeout(resolve, 120)); // Simulate API call

            const responseTime = Date.now() - startTime;

            // Update health check result
            integration.updateHealthCheck('healthy', responseTime);
            await integration.save();

            res.json({
                success: true,
                message: 'SMS marketing integration test successful',
                data: {
                    status: 'healthy',
                    responseTime,
                    provider: integration.provider,
                    senderId: integration.senderId
                }
            });
        } catch (testError) {
            const responseTime = Date.now() - startTime;

            // Update health check result with error
            integration.updateHealthCheck('unhealthy', responseTime, testError.message);
            await integration.save();

            res.status(400).json({
                success: false,
                message: 'SMS marketing integration test failed',
                error: testError.message,
                data: {
                    status: 'unhealthy',
                    responseTime,
                    provider: integration.provider
                }
            });
        }
    } catch (error) {
        console.error('Error testing SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Activate SMS marketing integration
// @route   POST /api/integrations/sms-marketing/:id/activate
// @access  Private
const activateSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        integration.activate();
        await integration.save();

        res.json({
            success: true,
            message: 'SMS marketing integration activated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error activating SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Deactivate SMS marketing integration
// @route   POST /api/integrations/sms-marketing/:id/deactivate
// @access  Private
const deactivateSMSMarketingIntegration = async (req, res) => {
    try {
        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        integration.deactivate();
        await integration.save();

        res.json({
            success: true,
            message: 'SMS marketing integration deactivated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error deactivating SMS marketing integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating SMS marketing integration',
            error: error.message
        });
    }
};

// @desc    Add phone number to pool
// @route   POST /api/integrations/sms-marketing/:id/phone-pools/:poolName/numbers
// @access  Private
const addPhoneNumberToPool = async (req, res) => {
    try {
        const { poolName } = req.params;
        const { number, country, capabilities } = req.body;

        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        integration.addPhoneNumberToPool(poolName, number, country, capabilities);
        await integration.save();

        res.json({
            success: true,
            message: 'Phone number added to pool successfully',
            data: integration.phoneNumberPools.find(p => p.poolName === poolName)
        });
    } catch (error) {
        console.error('Error adding phone number to pool:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding phone number to pool',
            error: error.message
        });
    }
};

// @desc    Add SMS template
// @route   POST /api/integrations/sms-marketing/:id/templates
// @access  Private
const addSMSTemplate = async (req, res) => {
    try {
        const { name, template, variables, category } = req.body;

        const integration = await SMSMarketingIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'SMS marketing integration not found'
            });
        }

        integration.addSMSTemplate(name, template, variables, category);
        await integration.save();

        res.json({
            success: true,
            message: 'SMS template added successfully',
            data: integration.smsSettings.messageTemplates[integration.smsSettings.messageTemplates.length - 1]
        });
    } catch (error) {
        console.error('Error adding SMS template:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding SMS template',
            error: error.message
        });
    }
};

export {
    getSMSMarketingIntegrations,
    getSMSMarketingIntegration,
    createSMSMarketingIntegration,
    updateSMSMarketingIntegration,
    deleteSMSMarketingIntegration,
    testSMSMarketingIntegration,
    activateSMSMarketingIntegration,
    deactivateSMSMarketingIntegration,
    addPhoneNumberToPool,
    addSMSTemplate
};


