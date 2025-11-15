import Template from '../models/Template.js';
import Campaign from '../models/Campaign.js';

// Generic handler for Templates (Email, SMS, WhatsApp, Call Script)
const createOrUpdateTemplate = async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = { ...req.body, organizationId: req.user.organizationId, type };
        
        const item = id
            ? await Template.findOneAndUpdate({ _id: id, organizationId: req.user.organizationId, type }, data, { new: true })
            : await Template.create(data);

        if (!item) return res.status(404).json({ message: 'Template not found' });
        res.status(id ? 200 : 201).json(item);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { type, id } = req.params;
        const item = await Template.findOne({ _id: id, organizationId: req.user.organizationId, type });
        if (!item) return res.status(404).json({ message: 'Template not found' });
        await item.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Generic handler for Campaigns (Email, SMS, WhatsApp, Call)
const createOrUpdateCampaign = async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = { ...req.body, organizationId: req.user.organizationId, type };
        
        const item = id
            ? await Campaign.findOneAndUpdate({ _id: id, organizationId: req.user.organizationId, type }, data, { new: true })
            : await Campaign.create(data);

        if (!item) return res.status(404).json({ message: 'Campaign not found' });
        res.status(id ? 200 : 201).json(item);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const deleteCampaign = async (req, res) => {
    try {
        const { type, id } = req.params;
        const item = await Campaign.findOne({ _id: id, organizationId: req.user.organizationId, type });
        if (!item) return res.status(404).json({ message: 'Campaign not found' });
        await item.deleteOne();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// GET functions for retrieving templates and campaigns
const getTemplates = async (req, res) => {
    try {
        const { type } = req.params;
        const templates = await Template.find({ organizationId: req.user.organizationId, type }).sort({ createdAt: -1 });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const getTemplate = async (req, res) => {
    try {
        const { type, id } = req.params;
        const template = await Template.findOne({ _id: id, organizationId: req.user.organizationId, type });
        if (!template) return res.status(404).json({ message: 'Template not found' });
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const getCampaigns = async (req, res) => {
    try {
        const { type } = req.params;
        const campaigns = await Campaign.find({ organizationId: req.user.organizationId, type }).sort({ createdAt: -1 });
        res.json({ success: true, data: campaigns });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const getCampaign = async (req, res) => {
    try {
        const { type, id } = req.params;
        const campaign = await Campaign.findOne({ _id: id, organizationId: req.user.organizationId, type });
        if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export {
    createOrUpdateTemplate, deleteTemplate,
    createOrUpdateCampaign, deleteCampaign,
    getTemplates, getTemplate,
    getCampaigns, getCampaign,
};



