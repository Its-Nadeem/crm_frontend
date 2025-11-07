import Template from '../models/Template.js';
import Campaign from '../models/Campaign.js';
import Lead from '../models/Lead.js';
import EmailMarketingIntegration from '../models/EmailMarketingIntegration.js';
import SendGridService from '../services/sendGridService.js';

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

const sendCampaign = async (req, res) => {
    try {
        const { type, id } = req.params;

        // Only support email campaigns for now
        if (type !== 'email') {
            return res.status(400).json({
                success: false,
                message: 'Only email campaigns are supported for sending'
            });
        }

        // Get the campaign
        const campaign = await Campaign.findOne({
            _id: id,
            organizationId: req.user.organizationId,
            type: 'email'
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }

        // Get active email integration
        const emailIntegration = await EmailMarketingIntegration.findOne({
            organizationId: req.user.organizationId,
            isActive: true
        });

        if (!emailIntegration) {
            return res.status(400).json({
                success: false,
                message: 'No active email integration found'
            });
        }

        // Get template
        const template = await Template.findOne({
            _id: campaign.templateId,
            organizationId: req.user.organizationId,
            type: 'Email'
        });

        if (!template) {
            return res.status(400).json({
                success: false,
                message: 'Email template not found'
            });
        }

        // Get target leads based on campaign conditions
        let targetLeads = await Lead.find({
            organizationId: req.user.organizationId,
            email: { $exists: true, $ne: null, $ne: '' }
        });

        // Apply campaign filters if any
        if (campaign.conditions && campaign.conditions.length > 0) {
            // Simple filtering logic - can be enhanced
            targetLeads = targetLeads.filter(lead => {
                // For now, just return all leads with emails
                // Advanced filtering can be implemented based on conditions
                return true;
            });
        }

        // Initialize SendGrid service
        const sendGridService = new SendGridService(emailIntegration.apiKey);

        // Get verified sender
        const senders = await sendGridService.getSenders();
        const verifiedSender = senders.data.find(sender => sender.verified);

        if (!verifiedSender) {
            return res.status(400).json({
                success: false,
                message: 'No verified sender identity found'
            });
        }

        // Send emails to all target leads
        let sentCount = 0;
        let failedCount = 0;
        const results = [];

        for (const lead of targetLeads) {
            try {
                // Personalize email content (basic variable replacement)
                let personalizedSubject = template.subject;
                let personalizedBody = template.body;

                // Replace basic variables
                personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, lead.name || 'Valued Customer');
                personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, lead.name || 'Valued Customer');
                personalizedBody = personalizedBody.replace(/\{\{email\}\}/g, lead.email);

                const result = await sendGridService.sendEmail(
                    lead.email,
                    verifiedSender.from.email,
                    personalizedSubject,
                    personalizedBody
                );

                if (result.success) {
                    sentCount++;

                    // Log email activity
                    const activities = lead.activities || [];
                    activities.unshift({
                        type: 'EMAIL',
                        content: `Email sent via campaign "${campaign.name}". Subject: ${personalizedSubject}`,
                        timestamp: new Date(),
                        authorId: req.user.id,
                        status: 'sent',
                        metadata: {
                            campaignId: campaign._id,
                            templateId: template._id,
                            messageId: result.messageId,
                            provider: 'sendgrid'
                        }
                    });

                    await Lead.updateOne(
                        { _id: lead._id },
                        { activities }
                    );
                } else {
                    failedCount++;
                }

                results.push({
                    leadId: lead._id,
                    email: lead.email,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                });

            } catch (error) {
                failedCount++;
                results.push({
                    leadId: lead._id,
                    email: lead.email,
                    success: false,
                    error: error.message
                });
            }
        }

        // Update campaign with results
        campaign.recipientCount = targetLeads.length;
        campaign.sentCount = sentCount;
        campaign.failedCount = failedCount;
        await campaign.save();

        res.json({
            success: true,
            message: `Campaign sent to ${sentCount} out of ${targetLeads.length} recipients`,
            data: {
                sentCount,
                failedCount,
                totalRecipients: targetLeads.length,
                campaignId: campaign._id,
                results: results.slice(0, 10) // Return first 10 results for preview
            }
        });

    } catch (error) {
        console.error('Error sending campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send campaign',
            error: error.message
        });
    }
};

export {
    createOrUpdateTemplate, deleteTemplate,
    createOrUpdateCampaign, deleteCampaign,
    getTemplates, getTemplate,
    getCampaigns, getCampaign,
    sendCampaign,
};



