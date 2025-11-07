import express from 'express';
import { getAppData, getSuperAdminData } from '../controllers/dataController.js';
import { protect, superAdmin } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/app-data').get(protect, getAppData);
router.route('/super-admin-data').get(protect, superAdmin, getSuperAdminData);


export default router;



