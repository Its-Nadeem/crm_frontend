import Organization from '../models/Organization.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Addon from '../models/Addon.js';
import Coupon from '../models/Coupon.js';
import BlogPost from '../models/BlogPost.js';
import SupportTicket from '../models/SupportTicket.js';
import Inquiry from '../models/Inquiry.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import PaymentGatewaySetting from '../models/PaymentGatewaySetting.js';

// Generic handler factory
const createOrUpdateHandler = (Model) => async (req, res) => {
    try {
        const { id } = req.params;
        const item = id
            ? await Model.findOneAndUpdate({ _id: id }, req.body, { new: true, runValidators: true })
            : await Model.create(req.body);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(id ? 200 : 201).json(item);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

const deleteHandler = (Model) => async (req, res) => {
    try {
        const item = await Model.findOneAndDelete({ _id: req.params.id });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Organizations
export const createOrUpdateOrganization = createOrUpdateHandler(Organization);
export const deleteOrganization = deleteHandler(Organization);

// Plans
export const createOrUpdatePlan = createOrUpdateHandler(SubscriptionPlan);
export const deletePlan = deleteHandler(SubscriptionPlan);

// Addons
// Payment Gateway Settings
export const createOrUpdatePaymentGatewaySetting = createOrUpdateHandler(PaymentGatewaySetting);
export const deletePaymentGatewaySetting = deleteHandler(PaymentGatewaySetting);
export const createOrUpdateAddon = createOrUpdateHandler(Addon);
export const deleteAddon = deleteHandler(Addon);

// Coupons
export const createOrUpdateCoupon = createOrUpdateHandler(Coupon);
export const deleteCoupon = deleteHandler(Coupon);

// Blog Posts
export const createOrUpdateBlogPost = createOrUpdateHandler(BlogPost);
export const deleteBlogPost = deleteHandler(BlogPost);

// Specific handler for ticket status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await SupportTicket.findOneAndUpdate(
            { _id: req.params.id },
            { status, lastReplyAt: new Date() },
            { new: true }
        );
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
        const [organizations, users, leads, tasks, plans, tickets, blogPosts, inquiries, paymentGatewaySettings] = await Promise.all([
    }
};

// GET all data for super admin dashboard
export const getSuperAdminDashboardData = async (req, res) => {
    try {
        const [organizations, users, leads, tasks, plans, tickets, blogPosts, inquiries] = await Promise.all([
            Organization.find({}),
            User.find({}),
            Lead.find({}),
            Task.find({}),
            SubscriptionPlan.find({}),
            SupportTicket.find({}).sort({ createdAt: -1 }),
            BlogPost.find({}).sort({ publishedAt: -1 }),
            Inquiry.find({}).sort({ createdAt: -1 })
        ]);
        
        res.json({
            organizations,
            users,
            leads,
            tasks,
            subscriptionPlans: plans,
            supportTickets: tickets,
            blogPosts,
            inquiries
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Support Tickets
export const getSupportTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({}).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Inquiries
export const getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

export const updateInquiryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const inquiry = await Inquiry.findOneAndUpdate(
            { _id: req.params.id },
            { status },
            { new: true }
        );
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Blog Posts
export const getBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find({}).sort({ publishedAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Users (for super admin user management)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Leads (for super admin overview)
export const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find({}).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Tasks (for super admin overview)
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({}).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
// Analytics data with real MRR calculation
export const getAnalyticsData = async (req, res) => {
    try {
        const organizations = await Organization.find().populate('subscriptionPlanId');
        
        // Calculate real MRR data for last 6 months
        const now = new Date();
        const mrrData = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('en', { month: 'short' });
            
            // Get organizations active in this month
            const activeOrgs = organizations.filter(org => {
                const createdAt = new Date(org.createdAt);
                const expiresAt = new Date(org.subscriptionExpiresAt);
                return createdAt <= date && expiresAt >= date;
            });
            
            const mrr = activeOrgs.reduce((total, org) => {
                return total + (org.subscriptionPlanId?.price || 0);
            }, 0);
            
            mrrData.push({
                name: monthName,
                mrr: Math.round(mrr)
            });
        }
        
        res.json({
            mrrData,
            totalOrganizations: organizations.length,
            activeOrganizations: organizations.filter(org => new Date(org.subscriptionExpiresAt) > new Date()).length
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// System monitoring data
export const getSystemMonitoringData = async (req, res) => {
    try {
        // Generate realistic system health metrics
        const now = new Date();
        const healthData = [];
        const apiLogs = [];
        const errorLogs = [];
        
        // Generate last 24 hours of health data
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
            healthData.push({
                id: `health-${i}`,
                timestamp: time.toISOString(),
                cpuLoad: Math.round(Math.random() * 80 + 10), // 10-90%
                memoryUsage: Math.round(Math.random() * 70 + 20), // 20-90%
                responseTime: Math.round(Math.random() * 500 + 100) // 100-600ms
            });
        }
        
        // Generate sample API logs
        for (let i = 0; i < 50; i++) {
            const time = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
            apiLogs.push({
                id: `api-${i}`,
                timestamp: time.toISOString(),
                endpoint: ['/api/leads', '/api/users', '/api/organizations'][Math.floor(Math.random() * 3)],
                statusCode: Math.random() > 0.1 ? 200 : [400, 401, 500][Math.floor(Math.random() * 3)],
                responseTime: Math.round(Math.random() * 300 + 50)
            });
        }
        
        // Generate sample error logs
        for (let i = 0; i < 20; i++) {
            const time = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000));
            errorLogs.push({
                id: `error-${i}`,
                timestamp: time.toISOString(),
                message: ['Database connection timeout', 'API rate limit exceeded', 'Authentication failed'][Math.floor(Math.random() * 3)],
                severity: ['error', 'warning', 'critical'][Math.floor(Math.random() * 3)]
            });
        }
        
        res.json({
            healthData,
            apiLogs,
            errorLogs,
            serviceStatus: {
                'API': 'Operational',
                'Database': 'Operational',
                'File Storage': 'Operational',
                'Email Service': 'Degraded'
            }
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Audit logs (placeholder for now)
export const getAuditLogs = async (req, res) => {
    try {
        // Generate sample audit logs
        const now = new Date();
        const auditLogs = [];
        
        for (let i = 0; i < 100; i++) {
            const time = new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000));
            auditLogs.push({
                id: `audit-${i}`,
                timestamp: time.toISOString(),
                action: ['ORGANIZATION_CREATED', 'PLAN_UPDATED', 'USER_LOGIN', 'TICKET_RESOLVED'][Math.floor(Math.random() * 4)],
                actorId: Math.floor(Math.random() * 10) + 1,
                details: `Sample audit log entry ${i}`,
            });
        }
        
        res.json(auditLogs);
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// Global settings
export const getGlobalSettings = async (req, res) => {
    try {
        // This would typically come from a settings collection or environment variables
        res.json({
            globalAnnouncement: {
                message: "System maintenance scheduled for this weekend",
                type: "info",
                isActive: true
            },
            localizationSettings: {
                defaultLanguage: "en",
                timezone: "UTC"
            },
            globalIntegrationStatus: [
                { name: 'Facebook', status: 'active' },
                { name: 'Google Ads', status: 'active' },
                { name: 'Email Service', status: 'degraded' }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};



