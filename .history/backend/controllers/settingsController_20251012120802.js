import Stage from '../models/Stage.js';
import CustomField from '../models/CustomField.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import LeadScoreRule from '../models/LeadScoreRule.js';
import WebhookConfig from '../models/WebhookConfig.js';
import WebhookDeliveryLog from '../models/WebhookDeliveryLog.js';
import Organization from '../models/Organization.js';
import { faker } from '@faker-js/faker';

// Generic handler to create or update an item
const createOrUpdateItem = (Model) => async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, organizationId: req.user.organizationId };

        // For webhooks, generate URL on creation
        if (Model === WebhookConfig && !id && data.url === 'new') {
            data.url = `https://api.Clienn CRM.io/v1/webhooks/leads/${faker.string.uuid()}`;
        }
        
        const item = id
            ? await Model.findOneAndUpdate({ _id: id, organizationId: req.user.organizationId }, data, { new: true, runValidators: true })
            : await Model.create(data);

        if (!item) {
            return res.status(404).json({ message: 'Item not found or not authorized' });
        }

        res.status(id ? 200 : 201).json(item);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Generic handler to delete an item
const deleteItem = (Model) => async (req, res) => {
    try {
        const item = await Model.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
        if (!item) {
            return res.status(404).json({ message: 'Item not found or not authorized' });
        }
        await item.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Specific webhook delete handler to handle both string ID and MongoDB ObjectId
export const deleteWebhook = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Webhook ID is required' });
        }

        // Try to find webhook by string ID first, then by MongoDB ObjectId
        let webhook = await WebhookConfig.findOne({ id: id, organizationId: req.user.organizationId });

        // If not found by string ID, try MongoDB ObjectId
        if (!webhook) {
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                webhook = await WebhookConfig.findOne({ _id: id, organizationId: req.user.organizationId });
            }
        }

        if (!webhook) {
            return res.status(404).json({ message: 'Webhook not found or not authorized' });
        }

        await WebhookConfig.deleteOne({ _id: webhook._id });

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const getSettings = async (req, res) => {
    // This could fetch all settings at once if needed
    res.json({ message: 'Settings endpoint' });
};

// Specific stage handlers to work with 'id' field instead of '_id'
export const createOrUpdateStage = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== STAGE UPDATE REQUEST ===');
        console.log('Request method:', req.method);
        console.log('Request params (id):', id);
        console.log('Received stage data:', JSON.stringify(req.body, null, 2));
        console.log('User organizationId:', req.user.organizationId);

        const data = { ...req.body, organizationId: req.user.organizationId };

        // Generate a unique ID for new stages
        if (!id) {
            data.id = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('DEBUG: Creating new stage with ID:', data.id);
            console.log('DEBUG: Stage data received:', JSON.stringify(req.body, null, 2));
        } else {
            console.log('DEBUG: Updating existing stage with ID:', id);
        }

        console.log('DEBUG: Final data to save:', JSON.stringify(data, null, 2));

        const stage = id
            ? await Stage.findOneAndUpdate({ id: id, organizationId: req.user.organizationId }, data, { new: true, runValidators: true })
            : await Stage.create(data);

        if (!stage) {
            console.error('Stage not found or not authorized for ID:', id);
            return res.status(404).json({ message: 'Stage not found or not authorized' });
        }

        console.log('Stage operation successful:', stage);
        res.status(id ? 200 : 201).json(stage);
    } catch (error) {
        console.error('Stage operation error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Function to ensure default stages exist for an organization
export const ensureDefaultStages = async (organizationId) => {
    try {
        console.log('Checking default stages for organization:', organizationId);

        const existingStages = await Stage.find({ organizationId });
        console.log('Existing stages count:', existingStages.length);

        if (existingStages.length === 0) {
            console.log('No stages found, creating default stages...');

            const defaultStages = [
                { name: 'New Lead', color: '#3B82F6', organizationId },
                { name: 'Contacted', color: '#F59E0B', organizationId },
                { name: 'Qualified', color: '#10B981', organizationId },
                { name: 'Proposal', color: '#8B5CF6', organizationId },
                { name: 'Negotiation', color: '#F97316', organizationId },
                { name: 'Closed-Won', color: '#059669', organizationId },
                { name: 'Closed-Lost', color: '#EF4444', organizationId },
                { name: 'Nurturing', color: '#06B6D4', organizationId },
                { name: 'Follow-up', color: '#84CC16', organizationId }
            ];

            // Add unique IDs to default stages
            const stagesWithIds = defaultStages.map((stage, index) => ({
                ...stage,
                id: `stage_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
            }));

            const createdStages = await Stage.insertMany(stagesWithIds);
            console.log('Created default stages:', createdStages.length);

            return createdStages;
        }

        return existingStages;
    } catch (error) {
        console.error('Error ensuring default stages:', error);
        throw error;
    }
};

export const deleteStage = async (req, res) => {
    try {
        const { id } = req.params;

        const stage = await Stage.findOne({ id: id, organizationId: req.user.organizationId });
        if (!stage) {
            return res.status(404).json({ message: 'Stage not found or not authorized' });
        }

        await Stage.deleteOne({ id: id, organizationId: req.user.organizationId });
        res.status(204).send();
    } catch (error) {
        console.error('Stage deletion error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const createOrUpdateCustomField = createOrUpdateItem(CustomField);
export const deleteCustomField = deleteItem(CustomField);

export const createOrUpdateTeam = createOrUpdateItem(Team);
export const deleteTeam = deleteItem(Team);

export const createOrUpdateUser = createOrUpdateItem(User);
export const deleteUser = deleteItem(User);

// Specific lead score rule handlers to work with 'id' field instead of '_id'
export const createOrUpdateLeadScoreRule = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body, organizationId: req.user.organizationId };

        console.log('=== LEAD SCORE RULE UPDATE REQUEST ===');
        console.log('Request method:', req.method);
        console.log('Request params (id):', id);
        console.log('Received rule data:', JSON.stringify(data, null, 2));

        // Generate a unique ID for new rules
        if (!id) {
            data.id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('DEBUG: Creating new rule with ID:', data.id);
        } else {
            console.log('DEBUG: Updating existing rule with ID:', id);
        }

        console.log('DEBUG: Final data to save:', JSON.stringify(data, null, 2));

        const rule = id
            ? await LeadScoreRule.findOneAndUpdate({ id: id, organizationId: req.user.organizationId }, data, { new: true, runValidators: true })
            : await LeadScoreRule.create(data);

        if (!rule) {
            console.error('Rule not found or not authorized for ID:', id);
            return res.status(404).json({ message: 'Rule not found or not authorized' });
        }

        console.log('Rule operation successful:', rule);
        res.status(id ? 200 : 201).json(rule);
    } catch (error) {
        console.error('Rule operation error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const deleteLeadScoreRule = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('DEBUG: Deleting lead score rule:', id);

        const rule = await LeadScoreRule.findOne({ id: id, organizationId: req.user.organizationId });
        if (!rule) {
            return res.status(404).json({ message: 'Rule not found or not authorized' });
        }

        await LeadScoreRule.deleteOne({ id: id, organizationId: req.user.organizationId });

        console.log('DEBUG: Rule deleted successfully:', id);
        res.status(204).send();
    } catch (error) {
        console.error('Rule deletion error:', error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Get all lead score rules for organization
export const getLeadScoreRules = async (req, res) => {
    try {
        const rules = await LeadScoreRule.find({
            organizationId: req.user.organizationId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: rules,
            count: rules.length
        });
    } catch (error) {
        console.error('Error fetching lead score rules:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lead score rules',
            error: error.message
        });
    }
};

export const createOrUpdateWebhook = createOrUpdateItem(WebhookConfig);

// Get all webhooks for organization (for settings page)
export const getWebhooks = async (req, res) => {
    try {
        const webhooks = await WebhookConfig.find({
            organizationId: req.user.organizationId
        }).select('-secret').lean();

        // Get recent delivery logs for each webhook
        const enhancedWebhooks = await Promise.all(webhooks.map(async (webhook) => {
            const recentLogs = await WebhookDeliveryLog.find({
                webhookId: webhook._id
            }).sort({ createdAt: -1 }).limit(1).lean();

            const lastDelivery = recentLogs[0] ? {
                timestamp: recentLogs[0].createdAt,
                statusCode: recentLogs[0].statusCode,
                responseTime: recentLogs[0].responseTimeMs,
                event: recentLogs[0].event
            } : null;

            return {
                ...webhook,
                maskedSecret: webhook.getMaskedSecret ? webhook.getMaskedSecret() : '••••••••',
                lastDelivery,
                canEdit: true,
                canDelete: true
            };
        }));

        res.json({
            success: true,
            data: enhancedWebhooks,
            count: enhancedWebhooks.length
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

// Organization API Key Management
export const getOrganizationApiKey = async (req, res) => {
    try {
        console.log('Fetching API key for user:', {
            userId: req.user._id,
            organizationId: req.user.organizationId,
            username: req.user.name,
            unmasked: req.query.unmasked === 'true'
        });

        const organization = await Organization.findOne({
            id: req.user.organizationId
        });

        console.log('Organization lookup result:', organization ? 'Found' : 'Not found');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Check if unmasked version is requested
        const shouldUnmask = req.query.unmasked === 'true';
        const apiKey = shouldUnmask ? organization.apiKey : (organization.apiKey ? organization.apiKey.replace(/(.{4}).*(.{4})/, '$1••••••••$2') : null);

        res.json({
            success: true,
            data: {
                apiKey: apiKey,
                status: organization.apiKeyStatus,
                lastUsed: organization.apiKeyLastUsed,
                hasApiKey: !!organization.apiKey,
                // Include full key in a separate field for internal use
                fullApiKey: shouldUnmask ? organization.apiKey : undefined
            }
        });
    } catch (error) {
        console.error('Error fetching organization API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching API key',
            error: error.message
        });
    }
};

export const generateOrganizationApiKey = async (req, res) => {
    try {
        const organization = await Organization.findOne({
            id: req.user.organizationId
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const apiKey = organization.generateApiKey();
        await organization.save();

        res.json({
            success: true,
            message: 'API key generated successfully',
            data: {
                apiKey: apiKey,
                status: organization.apiKeyStatus
            }
        });
    } catch (error) {
        console.error('Error generating organization API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating API key',
            error: error.message
        });
    }
};

export const regenerateOrganizationApiKey = async (req, res) => {
    try {
        const organization = await Organization.findOne({
            id: req.user.organizationId
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const oldApiKey = organization.apiKey;
        const newApiKey = organization.regenerateApiKey();
        await organization.save();

        res.json({
            success: true,
            message: 'API key regenerated successfully',
            data: {
                apiKey: newApiKey,
                previousApiKey: oldApiKey,
                status: organization.apiKeyStatus
            }
        });
    } catch (error) {
        console.error('Error regenerating organization API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error regenerating API key',
            error: error.message
        });
    }
};

export const revokeOrganizationApiKey = async (req, res) => {
    try {
        const organization = await Organization.findOne({
            id: req.user.organizationId
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        organization.revokeApiKey();
        await organization.save();

        res.json({
            success: true,
            message: 'API key revoked successfully',
            data: {
                status: organization.apiKeyStatus
            }
        });
    } catch (error) {
        console.error('Error revoking organization API key:', error);
        res.status(500).json({
            success: false,
            message: 'Error revoking API key',
            error: error.message
        });
    }
};

// Meta Settings Management
export const getMetaSettings = async (req, res) => {
    try {
        const organization = await Organization.findOne({
            id: req.user.organizationId
        }).select('metaSettings');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: organization.metaSettings || {}
        });
    } catch (error) {
        console.error('Error fetching Meta settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching Meta settings',
            error: error.message
        });
    }
};

export const updateMetaSettings = async (req, res) => {
    try {
        const { pixelId, accessToken, testCode } = req.body;

        const organization = await Organization.findOne({
            id: req.user.organizationId
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        organization.metaSettings = {
            pixelId,
            accessToken,
            testCode
        };

        await organization.save();

        res.json({
            success: true,
            message: 'Meta settings updated successfully',
            data: organization.metaSettings
        });
    } catch (error) {
        console.error('Error updating Meta settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating Meta settings',
            error: error.message
        });
    }
};


export { getSettings };



