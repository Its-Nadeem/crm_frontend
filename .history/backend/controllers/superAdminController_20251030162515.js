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



