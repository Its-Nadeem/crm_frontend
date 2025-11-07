import Stage from '../models/Stage.js';
import CustomField from '../models/CustomField.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import LeadScoreRule from '../models/LeadScoreRule.js';
import WebhookConfig from '../models/WebhookConfig.js';
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

const getSettings = async (req, res) => {
    // This could fetch all settings at once if needed
    res.json({ message: 'Settings endpoint' });
};

// Exporting specific handlers for each model
export const createOrUpdateStage = createOrUpdateItem(Stage);
export const deleteStage = deleteItem(Stage);

export const createOrUpdateCustomField = createOrUpdateItem(CustomField);
export const deleteCustomField = deleteItem(CustomField);

export const createOrUpdateTeam = createOrUpdateItem(Team);
export const deleteTeam = deleteItem(Team);

export const createOrUpdateUser = createOrUpdateItem(User);
export const deleteUser = deleteItem(User);

export const createOrUpdateLeadScoreRule = createOrUpdateItem(LeadScoreRule);
export const deleteLeadScoreRule = deleteItem(LeadScoreRule);

export const createOrUpdateWebhook = createOrUpdateItem(WebhookConfig);
export const deleteWebhook = deleteItem(WebhookConfig);


export { getSettings };



