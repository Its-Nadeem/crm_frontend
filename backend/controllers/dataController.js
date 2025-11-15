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
import BillingHistory from '../models/BillingHistory.js';

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

        // First, let's check what stages exist in the database for this organization
        const { ensureDefaultStages } = await import('./settingsController.js');
        await ensureDefaultStages(orgId);

        const allStagesForOrg = await Stage.find({ organizationId: orgId });
        console.log('DEBUG: Stages found in database for org', orgId, ':', allStagesForOrg.length, allStagesForOrg.map(s => ({ id: s.id, name: s.name })));

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
            BillingHistory.find({ organizationId: orgId }).sort({ date: -1 }).limit(20),
            Promise.resolve([]), // savedFilters
            Promise.resolve([]), // customDomains
            Promise.resolve(null), // chatbotConfig
        ]);

        console.log('DEBUG: Final stages being sent to frontend:', stages.length, stages.map(s => ({ id: s.id, name: s.name })));

        // Get the current subscription plan for the organization
        let currentSubscriptionPlan = null;

        if (organization?.subscriptionPlanId) {
            // First try exact match
            currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === organization.subscriptionPlanId);

            // If not found and organization has 'enterprise', also check for 'plan_enterprise' (for backward compatibility)
            if (!currentSubscriptionPlan && organization.subscriptionPlanId === 'enterprise') {
                currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === 'plan_enterprise');
            }

            // If still not found, try the reverse lookup
            if (!currentSubscriptionPlan) {
                currentSubscriptionPlan = subscriptionPlans.find(plan => plan.id === 'enterprise' || plan.id === 'plan_enterprise');
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

        // Ensure organization has subscription plan info
        const organizationWithPlan = organization ? {
            ...organization.toObject(),
            subscriptionPlan: currentSubscriptionPlan,
            subscriptionPlanDetails: currentSubscriptionPlan
        } : null;

        res.json({
            organizations: organizationWithPlan ? [organizationWithPlan] : [], // Return as array for consistency
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
            subscriptionPlan: currentSubscriptionPlan, // Add another reference for frontend compatibility
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


// @desc    Get reports data for analytics and charts
// @route   GET /api/data/reports
// @access  Protected
const getReportsData = async (req, res) => {
    try {
        const orgId = req.user ? req.user.organizationId : null;
        if (!orgId) {
            // If no user or no orgId, return empty data instead of error
            res.json({
                success: true,
                data: {
                    salesFunnelData: [],
                    leadSourceData: [],
                    salesRepData: [],
                    teamPerformanceData: [],
                    conversionData: [],
                    leadTrendData: [],
                    stages: [],
                    summary: {
                        totalLeads: 0,
                        totalUsers: 0,
                        totalStages: 0,
                        totalTeams: 0,
                        avgLeadsPerRep: 0
                    }
                }
            });
            return;
        }

        console.log('Loading reports data for organization:', orgId);

        // Ensure default stages exist for this organization
        const { ensureDefaultStages } = await import('./settingsController.js');
        await ensureDefaultStages(orgId);

        const [
            leads,
            users,
            stages,
            teams
        ] = await Promise.all([
            Lead.find({ organizationId: orgId }),
            User.find({ organizationId: orgId }).select('-password'),
            Stage.find({ organizationId: orgId }),
            Team.find({ organizationId: orgId })
        ]);

        console.log('Total leads fetched:', leads.length);
        console.log('Stages available:', stages.map(s => ({ id: s.id, name: s.name })));

        // Define the proper funnel order based on actual app stages (from top to bottom: New Lead -> ... -> Closed Won)
        const funnelOrder = [
            'New Lead',        // 0 - Top of funnel (widest)
            'Interested',      // 1
            'Qualified',       // 2
            'Proposal Sent',   // 3
            'Negotiation',     // 4
            'Closed Won',      // 5 - Bottom of funnel (narrowest)
            'DNP',            // 6 - Do Not Pursue (negative outcome)
            'Closed-Lost'     // 7 - Lost deals (negative outcome)
        ];

        // Calculate sales funnel data based on lead stages
        // Handle both stage IDs and stage names for backward compatibility
        const salesFunnelData = stages.map(stage => {
            const count = leads.filter(lead =>
                lead.stage === stage.id ||
                lead.stage === stage.name ||
                lead.stage === stage.name.toLowerCase().replace(/\s+/g, '-')
            ).length;
            console.log(`Stage ${stage.name} (${stage.id}): ${count} leads`);
            return {
                name: stage.name,
                value: count,
                fill: stage.color || '#8884d8',
                stageId: stage.id,
                order: funnelOrder.indexOf(stage.name) !== -1 ? funnelOrder.indexOf(stage.name) : 999
            };
        });

        // Sort by the defined order
        salesFunnelData.sort((a, b) => a.order - b.order);

        // Check for leads with stages not in the funnel
        const allStageValues = stages.flatMap(stage => [
            stage.id,
            stage.name,
            stage.name.toLowerCase().replace(/\s+/g, '-')
        ]);
        const leadsWithInvalidStages = leads.filter(lead => lead.stage && !allStageValues.includes(lead.stage));
        console.log('Leads with stages not counted in funnel:', leadsWithInvalidStages.length);
        if (leadsWithInvalidStages.length > 0) {
            console.log('Invalid stage values:', [...new Set(leadsWithInvalidStages.map(l => l.stage))]);
        }

        const leadsWithNullStages = leads.filter(lead => !lead.stage);
        console.log('Leads with null/undefined stages:', leadsWithNullStages.length);

        // Add leads with invalid stages to the first stage (New Lead)
        const invalidStageCount = leadsWithInvalidStages.length + leadsWithNullStages.length;
        if (invalidStageCount > 0 && salesFunnelData.length > 0) {
            salesFunnelData[0].value += invalidStageCount;
            console.log(`Added ${invalidStageCount} leads with invalid/null stages to ${salesFunnelData[0].name}`);
        }

        const totalInFunnel = salesFunnelData.reduce((sum, stage) => sum + stage.value, 0);
        console.log('Total leads in funnel:', totalInFunnel);
        console.log('Difference:', leads.length - totalInFunnel);

        console.log('Sales funnel data being sent:', salesFunnelData);

        // Calculate lead source data
        const leadSourceCounts = leads.reduce((acc, lead) => {
            const source = lead.source || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        const leadSourceData = Object.entries(leadSourceCounts)
            .map(([name, value]) => ({
                name,
                value
            }))
            .sort((a, b) => b.value - a.value); // Sort by count descending

        // Calculate sales rep performance data
        const salesRepData = users
            .filter(user => user.role === 'Sales Rep' || user.role === 'Manager')
            .map(user => {
                const userLeads = leads.filter(lead => lead.assignedToId === user.id);
                const wonLeads = userLeads.filter(lead =>
                    stages.find(stage => stage.id === lead.stage)?.name === 'Closed Won' ||
                    stages.find(stage => stage.id === lead.stage)?.name === 'Closed-Won'
                ).length;
                const totalValue = userLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

                return {
                    name: user.name,
                    leads: userLeads.length,
                    won: wonLeads,
                    value: totalValue,
                    conversionRate: userLeads.length > 0 ? (wonLeads / userLeads.length * 100).toFixed(1) : 0
                };
            })
            .sort((a, b) => b.won - a.won);

        // Calculate team performance data
        const teamPerformanceData = teams.map(team => {
            const memberIds = [...(team.memberIds || []), team.leadId].filter(Boolean);
            const teamLeads = leads.filter(lead => memberIds.includes(lead.assignedToId));
            const teamUsers = users.filter(user => memberIds.includes(user.id));

            return {
                name: team.name,
                leads: teamLeads.length,
                members: teamUsers.length,
                avgLeadsPerMember: teamUsers.length > 0 ? (teamLeads.length / teamUsers.length).toFixed(1) : 0
            };
        }).filter(team => team.leads > 0 || team.members > 0); // Only show teams with data

        // Calculate conversion rates between stages
        const conversionData = [];
        for (let i = 0; i < stages.length - 1; i++) {
            const currentStage = stages[i];
            const nextStage = stages[i + 1];

            const currentStageLeads = leads.filter(lead => lead.stage === currentStage.id).length;
            const nextStageLeads = leads.filter(lead => lead.stage === nextStage.id).length;

            if (currentStageLeads > 0) {
                const conversionRate = (nextStageLeads / currentStageLeads * 100).toFixed(1);
                conversionData.push({
                    fromStage: currentStage.name,
                    toStage: nextStage.name,
                    conversionRate: parseFloat(conversionRate),
                    currentStageLeads,
                    nextStageLeads
                });
            }
        }

        // Calculate lead creation trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentLeads = leads.filter(lead => new Date(lead.createdAt) >= thirtyDaysAgo);

        const dailyLeadCounts = {};
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyLeadCounts[dateStr] = 0;
        }

        recentLeads.forEach(lead => {
            const dateStr = new Date(lead.createdAt).toISOString().split('T')[0];
            if (dailyLeadCounts.hasOwnProperty(dateStr)) {
                dailyLeadCounts[dateStr]++;
            }
        });

        const leadTrendData = Object.entries(dailyLeadCounts).map(([date, count]) => ({
            date,
            leads: count
        }));

        res.json({
            success: true,
            data: {
                salesFunnelData,
                leadSourceData,
                salesRepData,
                teamPerformanceData,
                conversionData,
                leadTrendData,
                stages: stages.map(stage => {
                    const funnelData = salesFunnelData.find(f => f.stageId === stage.id);
                    return {
                        id: stage.id,
                        name: stage.name,
                        color: stage.color,
                        value: funnelData ? funnelData.value : 0
                    };
                }),
                summary: {
                    totalLeads: leads.length,
                    totalUsers: users.length,
                    totalStages: stages.length,
                    totalTeams: teams.length,
                    avgLeadsPerRep: users.filter(u => u.role === 'Sales Rep').length > 0
                        ? (leads.length / users.filter(u => u.role === 'Sales Rep').length).toFixed(1)
                        : 0
                }
            }
        });

    } catch (error) {
        console.error(`Error fetching reports data: ${error.message}`);
        res.status(500).json({ message: 'Server Error' });
    }
};

export { getAppData, getSuperAdminData, getReportsData };



