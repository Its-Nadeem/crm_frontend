import express from 'express';
import { authUser, getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.route('/').get(protect, getUsers);
router.post('/login', authUser);

export default router;



