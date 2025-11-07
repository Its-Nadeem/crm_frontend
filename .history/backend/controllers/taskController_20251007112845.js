import Task from '../models/Task.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { faker } from '@faker-js/faker';

// @desc    Get all tasks for the logged-in user's organization
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ organizationId: req.user.organizationId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new task
const createTask = async (req, res) => {
  try {
    const task = new Task({ ...req.body, organizationId: req.user.organizationId });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create tasks for multiple users/teams
const createBatchTasks = async (req, res) => {
    try {
        const { taskData, assignment } = req.body;
        const orgId = req.user.organizationId;
        const createdById = req.user.id;

        const usersToAssignIds = new Set();
        
        if (assignment.type === 'user') {
            usersToAssignIds.add(assignment.id);
        } else if (assignment.type === 'team') {
            const team = await Team.findOne({ id: assignment.id, organizationId: orgId });
            if (team) {
                team.memberIds.forEach(id => usersToAssignIds.add(id));
                usersToAssignIds.add(team.leadId);
            }
        } else if (assignment.type === 'all') {
            const users = await User.find({ organizationId: orgId, role: { $ne: 'Admin' } });
            users.forEach(u => usersToAssignIds.add(u.id));
        }

        if (usersToAssignIds.size === 0) {
            return res.status(400).json({ message: 'No users found for assignment' });
        }

        const batchId = usersToAssignIds.size > 1 ? faker.string.uuid() : undefined;

        const tasksToCreate = Array.from(usersToAssignIds).map(userId => ({
            ...taskData,
            assignedToId: userId,
            organizationId: orgId,
            createdById,
            batchId,
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);
        res.status(201).json(createdTasks);

    } catch (error) {
        console.error('Error creating batch tasks:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Update a task
const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (task && task.organizationId === req.user.organizationId) {
      const updatedTask = await Task.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });
    if (task && task.organizationId === req.user.organizationId) {
      await task.deleteOne();
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export { getTasks, createTask, updateTask, deleteTask, createBatchTasks };



