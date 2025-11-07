import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    USERS, LEADS, ORGANIZATIONS, STAGES, TEAMS, TASKS,
    CUSTOM_FIELD_DEFS, AUTOMATION_RULES,
    EMAIL_TEMPLATES, SMS_TEMPLATES, WHATSAPP_TEMPLATES, CALL_SCRIPTS,
    EMAIL_CAMPAIGNS, SMS_CAMPAIGNS, WHATSAPP_CAMPAIGNS, CALL_CAMPAIGNS,
    LEAD_SCORE_RULES, SUBSCRIPTION_PLANS, ADDONS, BLOG_POSTS, INQUIRIES,
    INTEGRATION_SETTINGS, WEBHOOKS, SUPPORT_TICKETS, COUPONS, CUSTOM_DOMAINS
} from './clean-data.js';

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
        console.log('🚀 Starting fresh database seeding...');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear all collections first
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
        }
        console.log('🗑️ Cleared existing collections');

        // Insert data in correct order (dependencies first)
        console.log('📝 Inserting subscription plans...');
        await SubscriptionPlan.insertMany(SUBSCRIPTION_PLANS);
        console.log(`✅ Inserted ${SUBSCRIPTION_PLANS.length} subscription plans`);

        console.log('🏢 Inserting organizations...');
        await Organization.insertMany(ORGANIZATIONS);
        console.log(`✅ Inserted ${ORGANIZATIONS.length} organizations`);

        console.log('👥 Inserting users...');
        const createdUsers = [];
        for (const userData of USERS) {
            try {
                const user = await User.create(userData);
                createdUsers.push(user);
            } catch (error) {
                console.error(`❌ Failed to insert user ${userData.email}:`, error.message);
            }
        }
        console.log(`✅ Inserted ${createdUsers.length}/${USERS.length} users`);

        console.log('📋 Inserting stages...');
        await Stage.insertMany(STAGES);
        console.log(`✅ Inserted ${STAGES.length} stages`);

        console.log('👨‍👩‍👧‍👦 Inserting teams...');
        await Team.insertMany(TEAMS);
        console.log(`✅ Inserted ${TEAMS.length} teams`);

        console.log('🎯 Inserting lead score rules...');
        await LeadScoreRule.insertMany(LEAD_SCORE_RULES);
        console.log(`✅ Inserted ${LEAD_SCORE_RULES.length} lead score rules`);

        console.log('📊 Inserting custom fields...');
        await CustomField.insertMany(CUSTOM_FIELD_DEFS);
        console.log(`✅ Inserted ${CUSTOM_FIELD_DEFS.length} custom fields`);

        console.log('🔗 Inserting integration settings...');
        await IntegrationSettings.insertMany(INTEGRATION_SETTINGS);
        console.log(`✅ Inserted ${INTEGRATION_SETTINGS.length} integration settings`);

        console.log('🤖 Inserting automation rules...');
        await AutomationRule.insertMany(AUTOMATION_RULES);
        console.log(`✅ Inserted ${AUTOMATION_RULES.length} automation rules`);

        console.log('📧 Inserting templates...');
        const allTemplates = [...EMAIL_TEMPLATES, ...SMS_TEMPLATES, ...WHATSAPP_TEMPLATES, ...CALL_SCRIPTS];
        await Template.insertMany(allTemplates);
        console.log(`✅ Inserted ${allTemplates.length} templates`);

        console.log('📢 Inserting campaigns...');
        const allCampaigns = [...EMAIL_CAMPAIGNS, ...SMS_CAMPAIGNS, ...WHATSAPP_CAMPAIGNS, ...CALL_CAMPAIGNS];
        await Campaign.insertMany(allCampaigns);
        console.log(`✅ Inserted ${allCampaigns.length} campaigns`);

        console.log('🔗 Inserting leads...');
        const createdLeads = await Lead.insertMany(LEADS);
        console.log(`✅ Inserted ${createdLeads.length} leads`);

        console.log('✅ Inserting tasks...');
        await Task.insertMany(TASKS);
        console.log(`✅ Inserted ${TASKS.length} tasks`);

        console.log('🪝 Inserting webhooks...');
        await WebhookConfig.insertMany(WEBHOOKS);
        console.log(`✅ Inserted ${WEBHOOKS.length} webhooks`);

        console.log('🎫 Inserting support tickets...');
        await SupportTicket.insertMany(SUPPORT_TICKETS);
        console.log(`✅ Inserted ${SUPPORT_TICKETS.length} support tickets`);

        console.log('➕ Inserting addons...');
        await Addon.insertMany(ADDONS);
        console.log(`✅ Inserted ${ADDONS.length} addons`);

        console.log('📝 Inserting blog posts...');
        await BlogPost.insertMany(BLOG_POSTS);
        console.log(`✅ Inserted ${BLOG_POSTS.length} blog posts`);

        console.log('❓ Inserting inquiries...');
        await Inquiry.insertMany(INQUIRIES);
        console.log(`✅ Inserted ${INQUIRIES.length} inquiries`);

        console.log('🎟️ Inserting coupons...');
        await Coupon.insertMany(COUPONS);
        console.log(`✅ Inserted ${COUPONS.length} coupons`);

        console.log('🌐 Inserting custom domains...');
        await CustomDomain.insertMany(CUSTOM_DOMAINS);
        console.log(`✅ Inserted ${CUSTOM_DOMAINS.length} custom domains`);

        console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log(`📊 Total records inserted: ${createdUsers.length + createdLeads.length + ORGANIZATIONS.length + STAGES.length + TEAMS.length + TASKS.length + CUSTOM_FIELD_DEFS.length + AUTOMATION_RULES.length + allTemplates.length + allCampaigns.length + LEAD_SCORE_RULES.length + INTEGRATION_SETTINGS.length + WEBHOOKS.length + SUPPORT_TICKETS.length + SUBSCRIPTION_PLANS.length + ADDONS.length + BLOG_POSTS.length + INQUIRIES.length + COUPONS.length + CUSTOM_DOMAINS.length}`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('❌ Error during seeding:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runSeeder();
}


