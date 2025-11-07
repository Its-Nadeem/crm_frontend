import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import winston from 'winston';
import connectDB from './config/db.js';
import { runSeeder } from './seeder.js';

import leadRoutes from './routes/leadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import callRoutes from './routes/callRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import facebookRoutes from './routes/facebook.js';
import facebookWebhookRoutes from './routes/facebookRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { initializeGemini } from './services/geminiService.js';
import { ensureSubscriptionPlans } from './utils/subscriptionPlanInitializer.js';
import facebookWebhookController from './controllers/facebookWebhookController.js';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'Clienn CRM-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

dotenv.config();

connectDB().then(async () => {
  logger.info('Database connected successfully');

  // Initialize Gemini AI service (for future use)
  const geminiInitialized = initializeGemini(process.env.GEMINI_API_KEY);
  if (geminiInitialized) {
    logger.info('Gemini AI service initialized');
  }

  // Ensure subscription plans are initialized
  await ensureSubscriptionPlans();

  // Run seeder after DB connection is established (only in development)
  if (process.env.NODE_ENV === 'development' && process.env.RUN_SEEDER === 'true') {
    runSeeder();
  }
}).catch(err => {
  logger.error('Database connection failed:', err);
  process.exit(1);
});

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - Disabled for development, minimal for production
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000, // 15 minutes in prod, 1 minute in dev
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // 1000 in prod, 10000 in dev
  message: process.env.NODE_ENV === 'production'
    ? 'Too many requests from this IP, please try again later.'
    : 'Rate limit exceeded in development mode. Try again in a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost and development
    if (process.env.NODE_ENV === 'development') {
      return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.startsWith('192.168.') || req.ip.startsWith('10.');
    }
    return false;
  },
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || false
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware with error handling
app.use(express.json({
  limit: '10mb',
  strict: false, // Allow non-strict JSON parsing
  verify: (req, res, buf) => {
    // Store raw body for error handling
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('Malformed JSON received:', {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      bodyLength: req.rawBody ? req.rawBody.length : 0
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Bad Request'
    });
  }
  next(err);
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Clienn CRM API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      // Frontend API endpoints
      'dashboard-stats': '/api/dashboard/stats',
      'leads': '/api/leads',
      'users': '/api/users',
      'organizations': '/api/organizations',
      'stages': '/api/stages',
      'teams': '/api/teams',
      'tasks': '/api/tasks',
      // Legacy endpoints
      'data': '/api/data',
      'settings': '/api/settings',
      'marketing': '/api/marketing',
      'automation': '/api/automation',
      'super-admin': '/api/super-admin'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api', apiRoutes);

// Facebook API routes
app.use('/api/fb', facebookWebhookRoutes);

// Webhook API routes
app.use('/api/webhooks', webhookRoutes);

// Webhook routes (no auth required)
app.use('/webhook', facebookRoutes);

// Facebook webhook routes
app.get('/webhook/facebook', facebookWebhookController.verifyWebhook);
app.post('/webhook/facebook', facebookWebhookController.handleWebhookEvent);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
    headers: req.headers
  });

  // Don't crash on client errors (4xx), only on server errors (5xx)
  if (statusCode >= 500) {
    logger.error('Server error - potential crash:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong!'
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    error: err.message,
    stack: err.stack,
    promise: promise.toString()
  });

  // Don't exit the process for unhandled rejections in development
  // Just log the error and continue
  if (process.env.NODE_ENV === 'production') {
    console.error('Unhandled Promise Rejection in production - shutting down gracefully');
    server.close(() => {
      process.exit(1);
    });
  } else {
    console.error('Unhandled Promise Rejection in development - continuing...');
  }
});

export default app;




