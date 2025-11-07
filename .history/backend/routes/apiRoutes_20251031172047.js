import express from 'express';
const User = require('../models/User.js');
import Lead from '../models/Lead.js';
import Organization from '../models/Organization.js';
import Stage from '../models/Stage.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Call from '../models/Call.js';
import Addon from '../models/Addon.js';
import AutomationRule from '../models/AutomationRule.js';
import BlogPost from '../models/BlogPost.js';
import Campaign from '../models/Campaign.js';
import Coupon from '../models/Coupon.js';
import CustomDomain from '../models/CustomDomain.js';
import CustomField from '../models/CustomField.js';
import Inquiry from '../models/Inquiry.js';
import IntegrationSettings from '../models/IntegrationSettings.js';
import LeadScoreRule from '../models/LeadScoreRule.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import SupportTicket from '../models/SupportTicket.js';
import Template from '../models/Template.js';
import WebhookConfig from '../models/WebhookConfig.js';
import CustomDashboardWidget from '../models/CustomDashboardWidget.js';

// Import controllers
import { sendSMS, getSMSDeliveryStatus } from '../controllers/smsController.js';
import { sendEmail, getEmailDeliveryStatus } from '../controllers/emailController.js';

const router = express.Router();

// Get all leads with filtering and pagination
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 10, organizationId, stage, assignedToId } = req.query;

    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (stage) query.stage = stage;
    if (assignedToId) query.assignedToId = parseInt(assignedToId);

    const leads = await Lead.find(query)
      .populate('assignedToId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: error.message
    });
  }
});

// Get single lead by ID
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findOne({ id: req.params.id })
      .populate('assignedToId', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      error: error.message
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { organizationId, role } = req.query;

    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (role) query.role = role;

    const users = await User.find(query).select('-password');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get all organizations
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await Organization.find({});

    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizations',
      error: error.message
    });
  }
});

// Get all stages
router.get('/stages', async (req, res) => {
  try {
    const { organizationId } = req.query;

    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const stages = await Stage.find(query);

    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stages',
      error: error.message
    });
  }
});

// Get all teams
router.get('/teams', async (req, res) => {
  try {
    const { organizationId } = req.query;

    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const teams = await Team.find(query);

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
});

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const { organizationId, assignedToId, leadId } = req.query;

    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (assignedToId) query.assignedToId = parseInt(assignedToId);
    if (leadId) query.leadId = leadId;

    const tasks = await Task.find(query)
      .populate('assignedToId', 'name email')
      .populate('leadId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', async (req, res) => {
   try {
     const { organizationId } = req.query;

     let query = {};
     if (organizationId) query.organizationId = organizationId;

     const [totalLeads, totalUsers, totalTasks, leadsByStage] = await Promise.all([
       Lead.countDocuments(query),
       User.countDocuments(query),
       Task.countDocuments(query),
       Lead.aggregate([
         { $match: query },
         { $group: { _id: '$stage', count: { $sum: 1 } } }
       ])
     ]);

     res.json({
       success: true,
       data: {
         totalLeads,
         totalUsers,
         totalTasks,
         leadsByStage: leadsByStage.reduce((acc, stage) => {
           acc[stage._id] = stage.count;
           return acc;
         }, {})
       }
     });
   } catch (error) {
     res.status(500).json({
       success: false,
       message: 'Error fetching dashboard stats',
       error: error.message
     });
   }
});

// ===== CRUD OPERATIONS FOR ALL ENTITIES =====

// Users CRUD
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stages CRUD
router.post('/stages', async (req, res) => {
  try {
    const stage = new Stage(req.body);
    await stage.save();
    res.status(201).json({ success: true, data: stage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/stages/:id', async (req, res) => {
  try {
    const stage = await Stage.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!stage) return res.status(404).json({ success: false, message: 'Stage not found' });
    res.json({ success: true, data: stage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/stages/:id', async (req, res) => {
  try {
    const stage = await Stage.findOneAndDelete({ id: req.params.id });
    if (!stage) return res.status(404).json({ success: false, message: 'Stage not found' });
    res.json({ success: true, message: 'Stage deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Teams CRUD
router.post('/teams', async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({ id: req.params.id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tasks CRUD
router.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ id: req.params.id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Custom Fields CRUD
router.get('/custom-fields', async (req, res) => {
  try {
    const { organizationId, mappableOnly, category, integrationType } = req.query;
    let query = {};

    if (organizationId) query.organizationId = organizationId;

    // Filter for mappable fields only
    if (mappableOnly === 'true') {
      query.isMappable = true;
      query.isActive = true;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by integration type
    if (integrationType) {
      const usageField = `usage.in${integrationType}`;
      query[usageField] = true;
    }

    const customFields = await CustomField.find(query).sort({ displayOrder: 1, createdAt: 1 });

    res.json({
      success: true,
      data: customFields,
      count: customFields.length,
      filters: { mappableOnly, category, integrationType }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get mappable fields for integrations
router.get('/custom-fields/mappable/:integrationType?', async (req, res) => {
  try {
    const { integrationType } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const mappableFields = await CustomField.getMappableFields(organizationId, integrationType);

    res.json({
      success: true,
      data: mappableFields,
      count: mappableFields.length,
      integrationType
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get fields for lead display
router.get('/custom-fields/lead-display', async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const displayFields = await CustomField.getLeadDisplayFields(organizationId);

    res.json({
      success: true,
      data: displayFields,
      count: displayFields.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/custom-fields', async (req, res) => {
  try {
    const customField = new CustomField(req.body);
    await customField.save();
    res.status(201).json({ success: true, data: customField });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/custom-fields/:id', async (req, res) => {
  try {
    const customField = await CustomField.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!customField) return res.status(404).json({ success: false, message: 'Custom field not found' });
    res.json({ success: true, data: customField });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/custom-fields/:id', async (req, res) => {
  try {
    const customField = await CustomField.findByIdAndDelete(req.params.id);
    if (!customField) return res.status(404).json({ success: false, message: 'Custom field not found' });
    res.json({ success: true, message: 'Custom field deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Automation Rules CRUD
router.get('/automation-rules', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const rules = await AutomationRule.find(query);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/automation-rules', async (req, res) => {
  try {
    const rule = new AutomationRule(req.body);
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/automation-rules/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Automation rule not found' });
    res.json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/automation-rules/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndDelete({ id: req.params.id });
    if (!rule) return res.status(404).json({ success: false, message: 'Automation rule not found' });
    res.json({ success: true, message: 'Automation rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Templates CRUD (WhatsApp, SMS, Email)
router.get('/templates', async (req, res) => {
  try {
    const { organizationId, type } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (type) query.type = type;

    const templates = await Template.find(query);
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/templates', async (req, res) => {
  try {
    const template = new Template(req.body);
    await template.save();
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({ id: req.params.id });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Campaigns CRUD
router.get('/campaigns', async (req, res) => {
  try {
    const { organizationId, type } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (type) query.type = type;

    const campaigns = await Campaign.find(query);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const campaign = new Campaign(req.body);
    await campaign.save();
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ id: req.params.id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Organizations CRUD
router.post('/organizations', async (req, res) => {
  try {
    const organization = new Organization(req.body);
    await organization.save();
    res.status(201).json({ success: true, data: organization });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/organizations/:id', async (req, res) => {
  try {
    const organization = await Organization.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, data: organization });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/organizations/:id', async (req, res) => {
  try {
    const organization = await Organization.findOneAndDelete({ id: req.params.id });
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Addons CRUD
router.get('/addons', async (req, res) => {
  try {
    const addons = await Addon.find({});
    res.json({ success: true, data: addons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Blog Posts CRUD
router.get('/blog-posts', async (req, res) => {
  try {
    const blogPosts = await BlogPost.find({});
    res.json({ success: true, data: blogPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/blog-posts', async (req, res) => {
  try {
    const blogPost = new BlogPost(req.body);
    await blogPost.save();
    res.status(201).json({ success: true, data: blogPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/blog-posts/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
    if (!blogPost) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, data: blogPost });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/blog-posts/:id', async (req, res) => {
  try {
    const blogPost = await BlogPost.findOneAndDelete({ id: req.params.id });
    if (!blogPost) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Coupons CRUD
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/coupons', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Custom Domains CRUD
router.get('/custom-domains', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const domains = await CustomDomain.find(query);
    res.json({ success: true, data: domains });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/custom-domains', async (req, res) => {
  try {
    const domain = new CustomDomain(req.body);
    await domain.save();
    res.status(201).json({ success: true, data: domain });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Inquiries CRUD
router.get('/inquiries', async (req, res) => {
  try {
    const inquiries = await Inquiry.find({});
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Integration Settings CRUD
router.get('/integration-settings', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const settings = await IntegrationSettings.find(query);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/integration-settings', async (req, res) => {
  try {
    const setting = new IntegrationSettings(req.body);
    await setting.save();
    res.status(201).json({ success: true, data: setting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Lead Score Rules CRUD
router.get('/lead-score-rules', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const rules = await LeadScoreRule.find(query);
    res.json({ success: true, data: rules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/lead-score-rules', async (req, res) => {
  try {
    const rule = new LeadScoreRule(req.body);
    await rule.save();
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Subscription Plans CRUD
router.get('/subscription-plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({});
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Support Tickets CRUD
router.get('/support-tickets', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const tickets = await SupportTicket.find(query);
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/support-tickets', async (req, res) => {
  try {
    const ticket = new SupportTicket(req.body);
    await ticket.save();
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Webhook Config CRUD
router.get('/webhook-configs', async (req, res) => {
  try {
    const { organizationId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;

    const webhooks = await WebhookConfig.find(query);
    res.json({ success: true, data: webhooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/webhook-configs', async (req, res) => {
  try {
    const webhook = new WebhookConfig(req.body);
    await webhook.save();
    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Notes CRUD
router.post('/notes', async (req, res) => {
  try {
    const note = new Note({
      ...req.body,
      authorId: req.user.id || req.user._id,
      organizationId: req.user.organizationId
    });
    await note.save();
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/notes/:leadId', async (req, res) => {
  try {
    const notes = await Note.find({
      leadId: req.params.leadId,
      organizationId: req.user.organizationId
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calls CRUD
router.post('/calls', async (req, res) => {
  try {
    const call = new Call({
      ...req.body,
      authorId: req.user.id || req.user._id,
      organizationId: req.user.organizationId
    });
    await call.save();
    res.status(201).json({ success: true, data: call });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/calls/:leadId', async (req, res) => {
  try {
    const calls = await Call.find({
      leadId: req.params.leadId,
      organizationId: req.user.organizationId
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: calls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/calls/:id', async (req, res) => {
   try {
     const call = await Call.findOneAndDelete({
       _id: req.params.id,
       organizationId: req.user.organizationId
     });
     if (!call) return res.status(404).json({ success: false, message: 'Call log not found' });
     res.json({ success: true, message: 'Call log deleted successfully' });
   } catch (error) {
     res.status(500).json({ success: false, message: error.message });
   }
});

// SMS routes
router.post('/sms/send', sendSMS);
router.get('/sms/status/:messageId', getSMSDeliveryStatus);

// Email routes
router.post('/email/send', sendEmail);
router.get('/email/status/:messageId', getEmailDeliveryStatus);

// Public routes (no authentication required)
router.get('/public/enabled-payment-gateways', async (req, res) => {
    try {
        const PaymentGatewaySetting = (await import('../models/PaymentGatewaySetting.js')).default;
        const enabledGateways = await PaymentGatewaySetting.find({ isEnabled: true }, 'provider');
        const gateways = enabledGateways.map(g => g.provider);
        res.json({ gateways });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
});

// Custom Dashboard Widgets CRUD
router.get('/custom-dashboard-widgets', async (req, res) => {
  try {
    const { organizationId, userId } = req.query;
    let query = {};
    if (organizationId) query.organizationId = organizationId;
    if (userId) query.userId = parseInt(userId);

    const widgets = await CustomDashboardWidget.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: widgets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/custom-dashboard-widgets', async (req, res) => {
  try {
    const widget = new CustomDashboardWidget(req.body);
    await widget.save();
    res.status(201).json({ success: true, data: widget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/custom-dashboard-widgets/:id', async (req, res) => {
  try {
    const widget = await CustomDashboardWidget.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    res.json({ success: true, data: widget });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/custom-dashboard-widgets/:id', async (req, res) => {
  try {
    const widget = await CustomDashboardWidget.findOneAndDelete({ id: req.params.id });
    if (!widget) return res.status(404).json({ success: false, message: 'Widget not found' });
    res.json({ success: true, message: 'Widget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


