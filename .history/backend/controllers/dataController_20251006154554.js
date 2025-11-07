import Organization from '../models/Organization.js';
import Stage from '../models/Stage.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import AutomationRule from '../models/AutomationRule.js';
import CustomField from '../models/CustomField.js';
import Template from '../models/Template.js';
import Campaign from '../models/Campaign.js';
import LeadScoreRule from '../models/LeadScoreRule.js';
import IntegrationSettings from '../models/IntegrationSettings.js';
import WebhookConfig from '../models/WebhookConfig.js';
import SupportTicket from '../models/SupportTicket.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Addon from '../models/Addon.js';
import BlogPost from '../models/BlogPost.js';
import Inquiry from '../models/Inquiry.js';
import Coupon from '../models/Coupon.js';

// @desc    Get all relevant data for the app bootstrap
// @route   GET /api/data/app-data
// @access  Protected
const getAppData = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        if (!orgId) {
             res.status(400).json({ message: 'No organization found for this user.' });
             return;
        }

        const [
            organizations,
            users,
            leads,
            tasks,
            teams,
            stages,
            automationRules,
            customFieldDefs,
            whatsAppTemplates,
            smsTemplates,
            emailTemplates,
            callScripts,
            whatsAppCampaigns,
            smsCampaigns,
            emailCampaigns,
            callCampaigns,
            leadScoreRules,
            integrationSettings,
            webhooks,
            supportTickets,
            subscriptionPlans,
            billingHistory,
            savedFilters,
            customDomains,
            chatbotConfig
        ] = await Promise.all([
            Organization.find({ id: orgId }),
            User.find({ organizationId: orgId }).select('-password'),
            Lead.find({ organizationId: orgId }),
            Task.find({ organizationId: orgId }),
            Team.find({ organizationId: orgId }),
            Stage.find({ organizationId: orgId }),
            AutomationRule.find({ organizationId: orgId }),
            CustomField.find({ organizationId: orgId }),
            Template.find({ organizationId: orgId, type: 'WhatsApp' }),
            Template.find({ organizationId: orgId, type: 'SMS' }),
            Template.find({ organizationId: orgId, type: 'Email' }),
            Template.find({ organizationId: orgId, type: 'Call' }),
            Campaign.find({ organizationId: orgId, type: 'WhatsApp' }),
            Campaign.find({ organizationId: orgId, type: 'SMS' }),
            Campaign.find({ organizationId: orgId, type: 'Email' }),
            Campaign.find({ organizationId: orgId, type: 'Call' }),
            LeadScoreRule.find({ organizationId: orgId }),
            IntegrationSettings.find({ organizationId: orgId }),
            WebhookConfig.find({ organizationId: orgId }),
            SupportTicket.find({ organizationId: orgId }),
            SubscriptionPlan.find({}),
            // Models to be created for these:
            Promise.resolve([]), // billingHistory
            Promise.resolve([]), // savedFilters
            Promise.resolve([]), // customDomains
            Promise.resolve(null), // chatbotConfig
        ]);

        res.json({
            organizations,
            users,
            leads,
            tasks,
            teams,
            stages,
            automationRules,
            customFieldDefs,
            whatsAppTemplates,
            smsTemplates,
            emailTemplates,
            callScripts,
            whatsAppCampaigns,
            smsCampaigns,
            emailCampaigns,
            callCampaigns,
            leadScoreRules,
            integrationSettings,
            webhooks,
            supportTickets,
            subscriptionPlans,
            billingHistory,
            savedFilters,
            customDomains,
            chatbotConfig
        });

    } catch (error) {
        console.error(`Error fetching app data: ${error.message}`);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all data for the super admin dashboard
// @route   GET /api/data/super-admin-data
// @access  Super Admin Protected
const getSuperAdminData = async (req, res) => {
    try {
        const [
            organizations,
            users,
            leads,
            tasks,
            subscriptionPlans,
            supportTickets,
            auditLogs,
            addons,
            globalAutomationRules,
            globalEmailTemplates,
            inquiries,
            blogPosts,
            coupons,
        ] = await Promise.all([
            Organization.find({}),
            User.find({}).select('-password'),
            Lead.find({}),
            Task.find({}),
            SubscriptionPlan.find({}),
            SupportTicket.find({}),
            Promise.resolve([]), // auditLogs
            Addon.find({}),
            Promise.resolve([]), // globalAutomationRules,
            Promise.resolve([]), // globalEmailTemplates,
            Inquiry.find({}),
            BlogPost.find({}),
            Coupon.find({}),
        ]);

        res.json({
            organizations,
            users,
            leads,
            tasks,
            subscriptionPlans,
            supportTickets,
            auditLogs,
            addons,
            globalAutomationRules,
            globalEmailTemplates,
            inquiries,
            blogPosts,
            coupons,
            // Add other global settings here
            systemHealthData: [],
            apiUsageLogs: [],
            errorLogs: [],
            globalIntegrationStatus: [],
            localizationSettings: null,
            paymentGatewaySettings: [],
            homepageContent: null, // This should be managed in a separate CMS collection
            customDomains: [],
            offerStrip: null,
            pricingComparisonData: [],
        });
    } catch (error) {
        console.error(`Error fetching super admin data: ${error.message}`);
        res.status(500).json({ message: 'Server Error' });
    }
}


export { getAppData, getSuperAdminData };



