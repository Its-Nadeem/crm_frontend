import express from 'express';
import { getAppData, getSuperAdminData, getReportsData } from '../controllers/dataController.js';
import { protect, optionalProtect, superAdmin } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/app-data').get(protect, getAppData);
router.route('/super-admin-data').get(protect, superAdmin, getSuperAdminData);
router.route('/reports').get(protect, getReportsData);


export default router;



