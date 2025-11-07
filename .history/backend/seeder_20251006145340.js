import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    USERS, LEADS, ORGANIZATIONS, STAGES, TEAMS, TASKS,
    CUSTOM_FIELD_DEFS, AUTOMATION_RULES,
    EMAIL_TEMPLATES, SMS_TEMPLATES, WHATSAPP_TEMPLATES, CALL_SCRIPTS,
    EMAIL_CAMPAIGNS, SMS_CAMPAIGNS, WHATSAPP_CAMPAIGNS, CALL_CAMPAIGNS,
    LEAD_SCORE_RULES, SUBSCRIPTION_PLANS, ADDONS, BLOG_POSTS, INQUIRIES,
    INTEGRATION_SETTINGS, WEBHOOKS, SUPPORT_TICKETS, COUPONS, CUSTOM_DOMAINS
} from './comprehensive-data.js';

import User from './models/User.js';
import Lead from './models/Lead.js';
import Organization from './models/Organization.js';
import Stage from './models/Stage.js';
import Team from './models/Team.js';
import Task from './models/Task.js';
import CustomField from './models/CustomField.js';
import AutomationRule from './models/AutomationRule.js';
import Template from './models/Template.js';
import Campaign from './models/Campaign.js';
import LeadScoreRule from './models/LeadScoreRule.js';
import IntegrationSettings from './models/IntegrationSettings.js';
import WebhookConfig from './models/WebhookConfig.js';
import SupportTicket from './models/SupportTicket.js';
import SubscriptionPlan from './models/SubscriptionPlan.js';
import Addon from './models/Addon.js';
import BlogPost from './models/BlogPost.js';
import Inquiry from './models/Inquiry.js';
import Coupon from './models/Coupon.js';
import CustomDomain from './models/CustomDomain.js';


dotenv.config();

export const runSeeder = async () => {
    try {
        console.log('Checking if seeding is required...');

        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log(`Found ${userCount} existing users. Seeder skipped.`);
            return;
        }

        console.log('Seeding database...');
        
        // Clear all collections
        await User.deleteMany();
        await Lead.deleteMany();
        await Organization.deleteMany();
        await Stage.deleteMany();
        await Team.deleteMany();
        await Task.deleteMany();
        await CustomField.deleteMany();
        await AutomationRule.deleteMany();
        await Template.deleteMany();
        await Campaign.deleteMany();
        await LeadScoreRule.deleteMany();
        await IntegrationSettings.deleteMany();
        await WebhookConfig.deleteMany();
        await SupportTicket.deleteMany();
        await SubscriptionPlan.deleteMany();
        await Addon.deleteMany();
        await BlogPost.deleteMany();
        await Inquiry.deleteMany();
        await Coupon.deleteMany();
        await CustomDomain.deleteMany();
        
        // Insert data
        await Organization.insertMany(ORGANIZATIONS);
        const createdUsers = await User.insertMany(USERS); // Passwords will be hashed by pre-save hook
        
        // Map mock lead IDs to new Mongo _ids for tasks
        const createdLeads = await Lead.insertMany(LEADS);
        const leadIdMap = new Map();
        LEADS.forEach((mockLead, index) => {
            leadIdMap.set(mockLead.id, createdLeads[index]._id);
        });

        const tasksWithMongoLeadIds = TASKS.map(task => ({
            ...task,
            leadId: leadIdMap.get(task.leadId) || null,
        }));
        
        await Stage.insertMany(STAGES);
        await Team.insertMany(TEAMS);
        await Task.insertMany(tasksWithMongoLeadIds);
        await CustomField.insertMany(CUSTOM_FIELD_DEFS);
        await AutomationRule.insertMany(AUTOMATION_RULES);

        const allTemplates = [...EMAIL_TEMPLATES, ...SMS_TEMPLATES, ...WHATSAPP_TEMPLATES, ...CALL_SCRIPTS];
        await Template.insertMany(allTemplates);

        const allCampaigns = [...EMAIL_CAMPAIGNS, ...SMS_CAMPAIGNS, ...WHATSAPP_CAMPAIGNS, ...CALL_CAMPAIGNS];
        await Campaign.insertMany(allCampaigns);

        await LeadScoreRule.insertMany(LEAD_SCORE_RULES);
        await IntegrationSettings.insertMany(INTEGRATION_SETTINGS);
        await WebhookConfig.insertMany(WEBHOOKS);
        await SupportTicket.insertMany(SUPPORT_TICKETS);
        await SubscriptionPlan.insertMany(SUBSCRIPTION_PLANS);
        await Addon.insertMany(ADDONS);
        await BlogPost.insertMany(BLOG_POSTS);
        await Inquiry.insertMany(INQUIRIES);
        await Coupon.insertMany(COUPONS);
        await CustomDomain.insertMany(CUSTOM_DOMAINS);


        console.log('Data Imported!');
    } catch (error) {
        console.error(`Error with seeder: ${error}`);
        process.exit(1);
    }
};



