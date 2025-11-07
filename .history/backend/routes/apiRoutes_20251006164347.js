import express from 'express';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Organization from '../models/Organization.js';
import Stage from '../models/Stage.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
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

export default router;


