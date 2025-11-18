import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    createOrUpdateRule,
    deleteRule,
} from '../controllers/automationController.js';

const router = express.Router();

router.route('/rules').post(protect, createOrUpdateRule);
router.route('/rules/:id').put(protect, createOrUpdateRule).delete(protect, deleteRule);

export default router;



