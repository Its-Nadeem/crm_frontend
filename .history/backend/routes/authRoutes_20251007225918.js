import express from 'express';
import { login, getTenantContext, refreshToken, attachTenantContext } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getTenantContext);
router.get('/context', protect, attachTenantContext, getTenantContext);

export default router;


