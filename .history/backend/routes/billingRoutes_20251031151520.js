import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getBillingHistory,
    getSubscriptionPlans,
    changeSubscription,
    getCurrentSubscription,
    downloadMonthlyInvoices
} from '../controllers/billingController.js';

const router = express.Router();

// All billing routes require authentication
router.use(protect);

// Get billing history
router.get('/history', getBillingHistory);

// Get available subscription plans
router.get('/plans', getSubscriptionPlans);

// Get current subscription details
router.get('/subscription/current', getCurrentSubscription);

// Change subscription (upgrade/downgrade)
router.post('/subscription/change', changeSubscription);

export default router;


