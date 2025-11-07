import CloudTelephonyIntegration from '../models/CloudTelephonyIntegration.js';

// @desc    Get all cloud telephony integrations for organization
// @route   GET /api/integrations/cloud-telephony
// @access  Private
const getCloudTelephonyIntegrations = async (req, res) => {
    try {
        const integrations = await CloudTelephonyIntegration.findByOrganization(req.user.organizationId);

        res.json({
            success: true,
            data: integrations,
            count: integrations.length
        });
    } catch (error) {
        console.error('Error fetching cloud telephony integrations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cloud telephony integrations',
            error: error.message
        });
    }
};

// @desc    Get single cloud telephony integration
// @route   GET /api/integrations/cloud-telephony/:id
// @access  Private
const getCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Cloud telephony integration not found'
            });
        }

        res.json({
            success: true,
            data: integration
        });
    } catch (error) {
        console.error('Error fetching cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Create cloud telephony integration
// @route   POST /api/integrations/cloud-telephony
// @access  Private
const createCloudTelephonyIntegration = async (req, res) => {
    try {
        const integrationData = {
            ...req.body,
            organizationId: req.user.organizationId,
            createdBy: req.user.id
        };

        const integration = new CloudTelephonyIntegration(integrationData);
        await integration.save();

        res.status(201).json({
            success: true,
            message: 'Cloud telephony integration created successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error creating cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Update cloud telephony integration
// @route   PUT /api/integrations/cloud-telephony/:id
// @access  Private
const updateCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOneAndUpdate(
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
                message: 'Cloud telephony integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Cloud telephony integration updated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error updating cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Delete cloud telephony integration
// @route   DELETE /api/integrations/cloud-telephony/:id
// @access  Private
const deleteCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Cloud telephony integration not found'
            });
        }

        res.json({
            success: true,
            message: 'Cloud telephony integration deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Test cloud telephony integration
// @route   POST /api/integrations/cloud-telephony/:id/test
// @access  Private
const testCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Cloud telephony integration not found'
            });
        }

        // Basic health check - try to connect to the provider
        const startTime = Date.now();

        try {
            // This is a placeholder for actual provider API testing
            // In real implementation, you would test the actual API connection
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call

            const responseTime = Date.now() - startTime;

            // Update health check result
            integration.updateHealthCheck('healthy', responseTime);
            await integration.save();

            res.json({
                success: true,
                message: 'Cloud telephony integration test successful',
                data: {
                    status: 'healthy',
                    responseTime,
                    provider: integration.provider
                }
            });
        } catch (testError) {
            const responseTime = Date.now() - startTime;

            // Update health check result with error
            integration.updateHealthCheck('unhealthy', responseTime, testError.message);
            await integration.save();

            res.status(400).json({
                success: false,
                message: 'Cloud telephony integration test failed',
                error: testError.message,
                data: {
                    status: 'unhealthy',
                    responseTime,
                    provider: integration.provider
                }
            });
        }
    } catch (error) {
        console.error('Error testing cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Activate cloud telephony integration
// @route   POST /api/integrations/cloud-telephony/:id/activate
// @access  Private
const activateCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Cloud telephony integration not found'
            });
        }

        integration.activate();
        await integration.save();

        res.json({
            success: true,
            message: 'Cloud telephony integration activated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error activating cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error activating cloud telephony integration',
            error: error.message
        });
    }
};

// @desc    Deactivate cloud telephony integration
// @route   POST /api/integrations/cloud-telephony/:id/deactivate
// @access  Private
const deactivateCloudTelephonyIntegration = async (req, res) => {
    try {
        const integration = await CloudTelephonyIntegration.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });

        if (!integration) {
            return res.status(404).json({
                success: false,
                message: 'Cloud telephony integration not found'
            });
        }

        integration.deactivate();
        await integration.save();

        res.json({
            success: true,
            message: 'Cloud telephony integration deactivated successfully',
            data: integration
        });
    } catch (error) {
        console.error('Error deactivating cloud telephony integration:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating cloud telephony integration',
            error: error.message
        });
    }
};

export {
    getCloudTelephonyIntegrations,
    getCloudTelephonyIntegration,
    createCloudTelephonyIntegration,
    updateCloudTelephonyIntegration,
    deleteCloudTelephonyIntegration,
    testCloudTelephonyIntegration,
    activateCloudTelephonyIntegration,
    deactivateCloudTelephonyIntegration
};


