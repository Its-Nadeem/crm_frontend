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

        console.log('Loading data for organization:', orgId);

        const [
            organization,
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
            Organization.findOne({ id: orgId }),
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

        // Get the current subscription plan for the organization
        // Handle both formats: 'enterprise' and 'plan_enterprise'
        let currentSubscriptionPlan = null;

        if (organization?.subscriptionPlanId) {
            currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === organization.subscriptionPlanId);

            // Try alternative ID formats if not found
            if (!currentSubscriptionPlan) {
                if (organization.subscriptionPlanId === 'enterprise') {
                    currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === 'plan_enterprise');
                } else if (organization.subscriptionPlanId === 'plan_enterprise') {
                    currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === 'enterprise');
                }
            }
        }

        console.log('Organization data:', {
            id: organization?.id,
            name: organization?.name,
            subscriptionPlanId: organization?.subscriptionPlanId,
            subscriptionExpiresAt: organization?.subscriptionExpiresAt
        });

        console.log('Available subscription plans:', subscriptionPlans.map(p => ({ id: p.id, name: p.name })));
        console.log('Organization subscription plan ID:', organization?.subscriptionPlanId);
        console.log('Current subscription plan found:', currentSubscriptionPlan ? {
            id: currentSubscriptionPlan.id,
            name: currentSubscriptionPlan.name
        } : 'Not found');

        // Additional debugging for troubleshooting
        if (organization?.subscriptionPlanId === 'enterprise') {
            console.log('🔍 DEBUG: Organization has enterprise plan ID, looking for plan_enterprise...');
            const enterprisePlan = subscriptionPlans.find(plan => plan.id === 'plan_enterprise');
            console.log('🔍 DEBUG: plan_enterprise found:', enterprisePlan ? 'YES' : 'NO');
        }

        res.json({
            organizations: [organization], // Return as array for consistency
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
            currentSubscriptionPlan, // Add current plan for easy access
            subscriptionPlanDetails: currentSubscriptionPlan, // Add plan details
            billingHistory,
            savedFilters,
            customDomains,
            chatbotConfig,
            // Additional fields expected by frontend
            integrationLogs: [],
            userSessionLogs: [],
            auditLogs: [],
            globalAnnouncement: null,
            systemHealthData: [],
            apiUsageLogs: [],
            errorLogs: [],
            globalAutomationRules: [],
            globalEmailTemplates: [],
            globalIntegrationStatus: [],
            localizationSettings: null,
            paymentGatewaySettings: [],
            homepageContent: {
                hero: { title: "Welcome to Clienn CRM", gradientTitle: "AI-Powered CRM", subtitle: "Manage your business with intelligent automation", cta1: "Get Started", cta2: "Learn More" },
                loginPage: { title: "Sign in to your account", subtitle: "Access your dashboard", cta: "Contact Support", image: { src: "", alt: "" } },
                trustedBy: { title: "Trusted by teams worldwide", logos: [] },
                howItWorks: { title: "How it works", subtitle: "Simple setup process", steps: [] },
                integrations: { title: "Integrations", subtitle: "Connect your tools", logos: [] },
                features: { title: "Features", subtitle: "Everything you need", items: [] },
                growthChart: { title: "Growth metrics", subtitle: "Track your progress", chartData: [], stat: { value: 0, label: "" } },
                funnel: { title: "Sales funnel", subtitle: "Visualize your pipeline", stages: [] },
                pricing: { title: "Pricing", subtitle: "Choose your plan", monthlyPlans: [], yearlyPlans: [] },
                testimonials: { title: "Testimonials", items: [] },
                faq: { title: "FAQ", subtitle: "Common questions", items: [] },
                contactForm: { title: "Contact", subtitle: "Get in touch", webhookUrl: "", address: "", email: "", phone: "", mapSrc: "", fields: [] },
                chatbot: { enabled: false, welcomeMessage: "", questions: [], thankYouMessage: "", color: "#2563eb", style: "button" },
                blog: { title: "Blog", subtitle: "Latest insights" },
                footer: { description: "CRM platform", address: "", columns: [], socialLinks: [], legal: { copyright: "", links: [] } },
                finalCta: { title: "Get started", subtitle: "Join today", cta: "Start Free Trial" }
            },
            addons: [],
            blogPosts: [],
            inquiries: [],
            coupons: [],
            offerStrip: { isEnabled: false, text: "", ctaText: "", ctaLink: "", autoDisableAt: "" },
            pricingComparisonData: [],
            customDashboardWidgets: []
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
            homepageContent: {
                hero: { title: "Welcome to Clienn CRM", gradientTitle: "AI-Powered CRM", subtitle: "Manage your business with intelligent automation", cta1: "Get Started", cta2: "Learn More" },
                loginPage: { title: "Sign in to your account", subtitle: "Access your dashboard", cta: "Contact Support", image: { src: "", alt: "" } },
                trustedBy: { title: "Trusted by teams worldwide", logos: [] },
                howItWorks: { title: "How it works", subtitle: "Simple setup process", steps: [] },
                integrations: { title: "Integrations", subtitle: "Connect your tools", logos: [] },
                features: { title: "Features", subtitle: "Everything you need", items: [] },
                growthChart: { title: "Growth metrics", subtitle: "Track your progress", chartData: [], stat: { value: 0, label: "" } },
                funnel: { title: "Sales funnel", subtitle: "Visualize your pipeline", stages: [] },
                pricing: { title: "Pricing", subtitle: "Choose your plan", monthlyPlans: [], yearlyPlans: [] },
                testimonials: { title: "Testimonials", items: [] },
                faq: { title: "FAQ", subtitle: "Common questions", items: [] },
                contactForm: { title: "Contact", subtitle: "Get in touch", webhookUrl: "", address: "", email: "", phone: "", mapSrc: "", fields: [] },
                chatbot: { enabled: false, welcomeMessage: "", questions: [], thankYouMessage: "", color: "#2563eb", style: "button" },
                blog: { title: "Blog", subtitle: "Latest insights" },
                footer: { description: "CRM platform", address: "", columns: [], socialLinks: [], legal: { copyright: "", links: [] } },
                finalCta: { title: "Get started", subtitle: "Join today", cta: "Start Free Trial" }
            },
            customDomains: [],
            offerStrip: { isEnabled: false, text: "", ctaText: "", ctaLink: "", autoDisableAt: "" },
            pricingComparisonData: [],
        });
    } catch (error) {
        console.error(`Error fetching super admin data: ${error.message}`);
        res.status(500).json({ message: 'Server Error' });
    }
}


export { getAppData, getSuperAdminData };



