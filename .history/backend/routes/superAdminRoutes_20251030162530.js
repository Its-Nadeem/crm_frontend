import express from 'express';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
import {
    createOrUpdateOrganization, deleteOrganization,
    createOrUpdatePlan, deletePlan,
    createOrUpdateAddon, deleteAddon,
    createOrUpdateCoupon, deleteCoupon,
    createOrUpdateBlogPost, deleteBlogPost,
    updateTicketStatus,
    getSuperAdminDashboardData,
    getSupportTickets,
    getInquiries,
    updateInquiryStatus,
    getBlogPosts,
    getUsers,
    getLeads,
    getTasks,
} from '../controllers/superAdminController.js';

const router = express.Router();

// All routes in this file are protected and for super admins only
router.use(protect, superAdmin);

// Organizations
router.route('/organizations').post(createOrUpdateOrganization);
router.route('/organizations/:id').put(createOrUpdateOrganization).delete(deleteOrganization);

// Subscription Plans
router.route('/plans').post(createOrUpdatePlan);
router.route('/plans/:id').put(createOrUpdatePlan).delete(deletePlan);

// Addons
router.route('/addons').post(createOrUpdateAddon);
router.route('/addons/:id').put(createOrUpdateAddon).delete(deleteAddon);

// Coupons
router.route('/coupons').post(createOrUpdateCoupon);
router.route('/coupons/:id').put(createOrUpdateCoupon).delete(deleteCoupon);

// Blog
router.route('/blog').post(createOrUpdateBlogPost);
router.route('/blog/:id').put(createOrUpdateBlogPost).delete(deleteBlogPost);

// Support Tickets
router.route('/support-tickets/:id/status').put(updateTicketStatus);
router.route('/support-tickets').get(getSupportTickets);

// Inquiries
router.route('/inquiries').get(getInquiries);
router.route('/inquiries/:id/status').put(updateInquiryStatus);

// Blog Posts
router.route('/blog').get(getBlogPosts);

// Users
router.route('/users').get(getUsers);

// Leads
router.route('/leads').get(getLeads);

// Tasks
router.route('/tasks').get(getTasks);

// Dashboard Data
router.route('/dashboard').get(getSuperAdminDashboardData);

export default router;



