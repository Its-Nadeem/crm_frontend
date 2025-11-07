import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, createBatchTasks } from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);
    
router.route('/batch').post(protect, createBatchTasks);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

export default router;



