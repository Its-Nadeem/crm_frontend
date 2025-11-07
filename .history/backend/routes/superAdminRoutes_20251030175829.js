import express from 'express';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
import {
    createOrUpdatePaymentGatewaySetting, deletePaymentGatewaySetting, getPaymentGatewaySettings, testPaymentGateway,
    createOrUpdateOrganization, deleteOrganization,
    createOrUpdatePlan, deletePlan,
    createOrUpdateAddon, deleteAddon,
    createOrUpdateCoupon, deleteCoupon,
    createOrUpdateBlogPost, deleteBlogPost,
    updateTicketStatus,
    getSuperAdminDashboardData,
    getAnalyticsData,
    getSystemMonitoringData,
    getAuditLogs,
    getGlobalSettings,
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

// Dashboard data
router.route('/dashboard').get(getSuperAdminDashboardData);

// Organizations
router.route('/organizations').get(getSuperAdminDashboardData).post(createOrUpdateOrganization);
router.route('/organizations/:id').put(createOrUpdateOrganization).delete(deleteOrganization);

// Users
router.route('/users').get(getUsers);

// Leads
router.route('/leads').get(getLeads);

// Tasks
router.route('/tasks').get(getTasks);

// Subscription Plans
router.route('/plans').get(getSuperAdminDashboardData).post(createOrUpdatePlan);
router.route('/plans/:id').put(createOrUpdatePlan).delete(deletePlan);

// Addons
router.route('/addons').get(getSuperAdminDashboardData).post(createOrUpdateAddon);
router.route('/addons/:id').put(createOrUpdateAddon).delete(deleteAddon);

// Coupons
router.route('/coupons').get(getSuperAdminDashboardData).post(createOrUpdateCoupon);
router.route('/coupons/:id').put(createOrUpdateCoupon).delete(deleteCoupon);

// Blog
router.route('/blog').get(getBlogPosts).post(createOrUpdateBlogPost);
router.route('/blog/:id').put(createOrUpdateBlogPost).delete(deleteBlogPost);

// Support Tickets
router.route('/support-tickets').get(getSupportTickets);
router.route('/support-tickets/:id/status').put(updateTicketStatus);

// Inquiries
router.route('/inquiries').get(getInquiries);
router.route('/inquiries/:id/status').put(updateInquiryStatus);

// Analytics
router.route('/analytics').get(getAnalyticsData);

// System Monitoring
router.route('/monitoring').get(getSystemMonitoringData);

// Audit Logs
router.route('/audit-logs').get(getAuditLogs);

// Global Settings
// Payment Gateway Settings
router.route('/payment-gateways').get(getPaymentGatewaySettings).post(createOrUpdatePaymentGatewaySetting);
router.route('/payment-gateways/:id').put(createOrUpdatePaymentGatewaySetting).delete(deletePaymentGatewaySetting);
router.route('/settings').get(getGlobalSettings);

export default router;
