import express from 'express';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
import {
    createOrUpdateOrganization, deleteOrganization,
    createOrUpdatePlan, deletePlan,
    createOrUpdateAddon, deleteAddon,
    createOrUpdateCoupon, deleteCoupon,
    createOrUpdateBlogPost, deleteBlogPost,
    updateTicketStatus,
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

export default router;



