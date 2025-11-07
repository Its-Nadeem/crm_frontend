import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { runSeeder } from './seeder.js';

import leadRoutes from './routes/leadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';


dotenv.config();

connectDB().then(() => {
  // Run seeder after DB connection is established
  runSeeder();
});

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.send('API is running...');
});

app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/super-admin', superAdminRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));



