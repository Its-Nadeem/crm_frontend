import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import winston from 'winston';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Emergency throttling middleware for infinite loop protection - more permissive for normal usage
const emergencyThrottle = (req, res, next) => {
  const clientKey = `${req.ip}:${req.user?.id || 'anonymous'}:${req.path}`;
  const now = Date.now();
  const windowMs = 1000; // 1 second window
  const maxRequests = 50; // Max 50 requests per second per client per endpoint (increased from 20)

  // In-memory store for emergency throttling (in production, use Redis)
  if (!global.emergencyThrottleStore) {
    global.emergencyThrottleStore = new Map();
  }

  const store = global.emergencyThrottleStore;
  const clientData = store.get(clientKey) || { requests: [], blocked: false, blockUntil: 0 };

  // Clean old requests outside the window
  clientData.requests = clientData.requests.filter(time => now - time < windowMs);

  // Check if client is currently blocked
  if (clientData.blocked && now < clientData.blockUntil) {
    logger.warn('Emergency throttle: Request blocked', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      blockedUntil: new Date(clientData.blockUntil).toISOString()
    });

    return res.status(429).json({
      success: false,
      message: 'Emergency rate limit exceeded. Too many requests.',
      retryAfter: Math.ceil((clientData.blockUntil - now) / 1000)
    });
  }

  // Check if this request would exceed the limit
  if (clientData.requests.length >= maxRequests) {
    // Block the client for 10 seconds (reduced from 30)
    clientData.blocked = true;
    clientData.blockUntil = now + 10000;

    logger.error('Emergency throttle: Client blocked for excessive requests', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      requestCount: clientData.requests.length,
      blockDuration: '10 seconds'
    });

    return res.status(429).json({
      success: false,
      message: 'Emergency rate limit exceeded. Client blocked for 10 seconds.',
      retryAfter: 10
    });
  }

  // Add current request to the window
  clientData.requests.push(now);
  store.set(clientKey, clientData);

  // Add headers for client information
  res.set({
    'X-RateLimit-Limit': maxRequests,
    'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.requests.length - 1),
    'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
  });

  next();
};

// Infinite loop pattern detection middleware
const infiniteLoopDetector = (req, res, next) => {
  const clientKey = `${req.ip}:${req.user?.id || 'anonymous'}`;
  const now = Date.now();
  const windowMs = 10000; // 10 second window
  const maxRequests = 50; // Max 50 requests per 10 seconds (5 per second average)
  const rapidFireThreshold = 20; // Consider it rapid fire if more than 20 requests in window

  if (!global.infiniteLoopDetectorStore) {
    global.infiniteLoopDetectorStore = new Map();
  }

  const store = global.infiniteLoopDetectorStore;
  const clientData = store.get(clientKey) || {
    requests: [],
    blocked: false,
    blockUntil: 0,
    pattern: null,
    warnings: 0
  };

  // Clean old requests outside the window
  clientData.requests = clientData.requests.filter(time => now - time < windowMs);

  // Check if client is currently blocked
  if (clientData.blocked && now < clientData.blockUntil) {
    logger.warn('Infinite loop detector: Request blocked', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      blockedUntil: new Date(clientData.blockUntil).toISOString()
    });

    return res.status(429).json({
      success: false,
      message: 'Infinite loop pattern detected. Client temporarily blocked.',
      retryAfter: Math.ceil((clientData.blockUntil - now) / 1000)
    });
  }

  // Reset block if time has passed
  if (clientData.blocked && now >= clientData.blockUntil) {
    clientData.blocked = false;
    clientData.blockUntil = 0;
    clientData.warnings = 0;
    logger.info('Infinite loop detector: Client unblocked', { ip: req.ip, userId: req.user?.id });
  }

  // Add current request to the window
  clientData.requests.push(now);

  // Detect potential infinite loop patterns
  if (clientData.requests.length >= rapidFireThreshold) {
    // Check for very regular timing patterns (infinite loop characteristic)
    const intervals = [];
    for (let i = 1; i < clientData.requests.length; i++) {
      intervals.push(clientData.requests[i] - clientData.requests[i - 1]);
    }

    // Check if intervals are very consistent (typical of infinite loops)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // If standard deviation is very low (consistent timing) and average interval is reasonable for infinite loop
    if (stdDev < 50 && avgInterval > 50 && avgInterval < 200) {
      clientData.warnings++;

      logger.warn('Infinite loop pattern detected', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        requestCount: clientData.requests.length,
        avgInterval,
        stdDev,
        warnings: clientData.warnings
      });

      // Block after multiple warnings
      if (clientData.warnings >= 3) {
        clientData.blocked = true;
        clientData.blockUntil = now + 60000; // Block for 1 minute

        logger.error('Infinite loop detector: Client blocked for infinite loop pattern', {
          ip: req.ip,
          userId: req.user?.id,
          path: req.path,
          requestCount: clientData.requests.length,
          avgInterval,
          stdDev,
          blockDuration: '1 minute'
        });

        return res.status(429).json({
          success: false,
          message: 'Infinite loop pattern detected. Client blocked for 1 minute.',
          retryAfter: 60
        });
      }
    }
  }

  store.set(clientKey, clientData);

  // Add headers for client information
  res.set({
    'X-Request-Count': clientData.requests.length,
    'X-Warning-Count': clientData.warnings,
    'X-Blocked': clientData.blocked
  });

  next();
};

// Request deduplication middleware - disabled for app functionality
const requestDeduplication = (req, res, next) => {
  // Skip ALL deduplication for now to fix app functionality
  // TODO: Re-enable with proper timing after app is working
  next();
};

// Circuit breaker middleware
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 10;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = [];
    this.lastFailureTime = null;
  }

  async execute(req, res, next) {
    const endpoint = req.path;

    if (!global.circuitBreakers) {
      global.circuitBreakers = new Map();
    }

    if (!global.circuitBreakers.has(endpoint)) {
      global.circuitBreakers.set(endpoint, new CircuitBreaker());
    }

    const breaker = global.circuitBreakers.get(endpoint);

    if (breaker.state === 'OPEN') {
      if (Date.now() - breaker.lastFailureTime > breaker.recoveryTimeout) {
        breaker.state = 'HALF_OPEN';
        logger.info(`Circuit breaker for ${endpoint} moved to HALF_OPEN`);
      } else {
        logger.warn(`Circuit breaker OPEN for ${endpoint}, request blocked`);
        return res.status(503).json({
          success: false,
          message: 'Service temporarily unavailable due to high error rate',
          retryAfter: Math.ceil((breaker.recoveryTimeout - (Date.now() - breaker.lastFailureTime)) / 1000)
        });
      }
    }

    // Store original res.json to monitor for errors
    const originalJson = res.json;
    res.json = function(body) {
      if (res.statusCode >= 500) {
        breaker.recordFailure();
      } else if (breaker.state === 'HALF_OPEN') {
        breaker.recordSuccess();
      }

      return originalJson.call(this, body);
    };

    next();
  }

  recordFailure() {
    this.failures.push(Date.now());
    this.lastFailureTime = Date.now();

    // Clean old failures outside monitoring period
    this.failures = this.failures.filter(time =>
      Date.now() - time <= this.monitoringPeriod
    );

    if (this.failures.length >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`Circuit breaker OPENED due to ${this.failures.length} failures in ${this.monitoringPeriod}ms`);
    }
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = [];
      logger.info('Circuit breaker CLOSED after successful request');
    }
  }
}
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
import integrationRoutes from './routes/integrationRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import webhookSyncRoutes from './routes/webhookSyncRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import { initializeGemini } from './services/geminiService.js';
import { ensureSubscriptionPlans } from './utils/subscriptionPlanInitializer.js';
import { startWebhookProcessor } from './services/webhookProcessor.js';
import facebookWebhookController from './controllers/facebookWebhookController.js';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'CliennCRM-backend' },
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

dotenv.config({ path: './.env' });

connectDB().then(async () => {
  logger.info('Database connected successfully');

  // Initialize Gemini AI service (for future use)
  const geminiInitialized = initializeGemini(process.env.GEMINI_API_KEY);
  if (geminiInitialized) {
    logger.info('Gemini AI service initialized');
  }

  // Ensure subscription plans are initialized
  await ensureSubscriptionPlans();

  // Start webhook delivery processor
  startWebhookProcessor();

  // Run seeder after DB connection is established (only in development)
  if (process.env.NODE_ENV === 'development' && process.env.RUN_SEEDER === 'true') {
    runSeeder();
  }
}).catch(err => {
  logger.error('Database connection failed:', err);
  process.exit(1);
});

const app = express();

// WebSocket server for real-time sync
const wss = new WebSocketServer({ noServer: true });

// Store connected clients by organization
const clients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, request) => {
    console.log('New WebSocket connection established');

    let organizationId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'subscribe' && data.organizationId) {
                organizationId = data.organizationId;

                // Add client to organization group
                if (!clients.has(organizationId)) {
                    clients.set(organizationId, new Set());
                }
                clients.get(organizationId).add(ws);

                console.log(`Client subscribed to organization: ${organizationId}`);
                console.log(`Total clients for ${organizationId}: ${clients.get(organizationId).size}`);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        if (organizationId && clients.has(organizationId)) {
            clients.get(organizationId).delete(ws);
            console.log(`Client disconnected from organization: ${organizationId}`);
            console.log(`Remaining clients for ${organizationId}: ${clients.get(organizationId).size}`);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Function to broadcast messages to organization clients
const broadcastToOrganization = (organizationId, message) => {
    if (clients.has(organizationId)) {
        const orgClients = clients.get(organizationId);
        const messageStr = JSON.stringify(message);

        orgClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });

        console.log(`Broadcasted message to ${orgClients.size} clients in organization ${organizationId}:`, message.type);
    }
};

// Make broadcastToOrganization available globally for controllers
global.broadcastToOrganization = broadcastToOrganization;

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

// Emergency rate limiting for infinite loop protection - more permissive for normal usage
const emergencyLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 50, // Max 50 requests per second per IP (increased from 10)
  message: {
    success: false,
    message: 'Emergency rate limit exceeded. Too many requests per second.',
    retryAfter: 1
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for health checks, static content, auth, data, lead endpoints, and webhooks
    return req.path === '/api/health' ||
           req.path.startsWith('/privacy') ||
           req.path.startsWith('/facebook/data-deletion') ||
           req.path.startsWith('/api/auth') ||
           req.path === '/api/data/app-data' ||
           req.path.startsWith('/api/data') ||
           req.path.startsWith('/api/leads') ||
           req.path.startsWith('/webhook/') ||
           req.path.startsWith('/api/fb/');
  },
  // Remove custom keyGenerator to use built-in IPv6 compatible generator
});

// Apply emergency throttling to all API routes
app.use('/api/', emergencyThrottle);
app.use('/api/', requestDeduplication);
app.use('/api/', infiniteLoopDetector);
app.use('/api/', emergencyLimiter);

// Apply circuit breaker to specific endpoints that are prone to infinite loops
app.use('/api/leads/:id', async (req, res, next) => {
  const endpoint = req.path;
  const breaker = global.circuitBreakers?.get(endpoint) || new CircuitBreaker();
  await breaker.execute(req, res, next);
});

// Legacy rate limiting - more permissive for normal operations
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000, // 15 minutes in prod, 1 minute in dev
  max: process.env.NODE_ENV === 'production' ? 5000 : 50000, // 5000 in prod, 50000 in dev (increased significantly)
  message: process.env.NODE_ENV === 'production'
    ? 'Too many requests from this IP, please try again later.'
    : 'Rate limit exceeded in development mode. Try again in a moment.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost, development, and essential endpoints
    if (process.env.NODE_ENV === 'development') {
      return req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.startsWith('192.168.') || req.ip.startsWith('10.');
    }
    // Also skip for essential API endpoints in production
    return req.path === '/api/auth/login' ||
           req.path === '/api/data/app-data' ||
           req.path.startsWith('/api/auth');
  },
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://crm.clienn.com',
      'https://clinee.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3002',
      'http://localhost:3001',
      // Allow specific Cloudflare tunnel
      'https://221d037e-00ed-40e9-99f1-3713b3edd7d0.trycloudflare.com',
      'https://*.trycloudflare.com'
    ];

    // Check for exact matches first
    if (allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowedOrigins.indexOf(origin) !== -1;
    })) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// CRITICAL: Webhook routes MUST come FIRST before any static file serving
// Facebook webhook routes (must come before ANY other routes)
app.get('/webhook/facebook', facebookWebhookController.verifyWebhook);
app.post('/webhook/facebook', facebookWebhookController.handleWebhookEvent);

// Webhook routes (no auth required)
app.use('/webhook', facebookRoutes);

// API routes - Order matters! More specific routes first
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
// General /api routes should come last to avoid overriding specific routes
app.use('/api', apiRoutes);

// Facebook API routes
app.use('/api/fb', facebookWebhookRoutes);

// Integration API routes
app.use('/api/integrations', integrationRoutes);

// OAuth API routes
app.use('/api/oauth', oauthRoutes);

// Webhook sync API routes
app.use('/api/webhook-sync', webhookSyncRoutes);

// Webhook API routes
app.use('/api/webhooks', webhookRoutes);

// Billing API routes
app.use('/api/billing', billingRoutes);

// SMS API routes
app.use('/api/sms', smsRoutes);

// Public pages (no auth required) - Facebook compliance endpoints and API docs
app.get('/api-docs', (req, res) => {
  console.log('API Docs route hit:', req.path, req.method);
  // Serve the API docs page directly from backend
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Documentation — Clienn CRM</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }
            h2 {
                color: #34495e;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .section {
                margin-bottom: 25px;
                padding: 20px;
                background: #f8f9fa;
                border-left: 4px solid #3498db;
                border-radius: 4px;
            }
            .endpoint {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 20px;
                margin: 15px 0;
            }
            .method {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                color: white;
            }
            .method.GET { background: #28a745; }
            .method.POST { background: #007bff; }
            .method.PUT { background: #ffc107; color: #212529; }
            .method.DELETE { background: #dc3545; }
            .code {
                background: #2c3e50;
                color: #ecf0f1;
                padding: 15px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                margin: 10px 0;
                overflow-x: auto;
            }
            .copy-btn {
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                margin-top: 10px;
            }
            .copy-btn:hover {
                background: #2980b9;
            }
            a {
                color: #3498db;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            @media (max-width: 768px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>API Documentation — Clienn CRM</h1>

            <div class="section">
                <h2>Quick Start</h2>
                <p>Integrate with Clienn CRM using our REST API and webhooks. All API requests should use the base URL: <code>https://crm.clienn.com/api</code></p>

                <h3>Authentication</h3>
                <p>Use your API key in the Authorization header:</p>
                <div class="code">Authorization: Bearer YOUR_API_KEY</div>
                <button class="copy-btn" onclick="navigator.clipboard.writeText('Authorization: Bearer YOUR_API_KEY')">Copy Header</button>

                <h3>Rate Limits</h3>
                <ul>
                    <li>1000 requests per hour</li>
                    <li>100 requests per minute</li>
                </ul>
            </div>

            <div class="section">
                <h2>API Endpoints</h2>

                <h3>Leads</h3>

                <div class="endpoint">
                    <h4><span class="method GET">GET</span> /api/leads</h4>
                    <p>Retrieve all leads with optional filtering</p>
                    <div class="code">GET https://crm.clienn.com/api/leads</div>
                    <p><strong>Query Parameters:</strong></p>
                    <ul>
                        <li><code>limit</code> - Number of leads to return (default: 50)</li>
                        <li><code>offset</code> - Number of leads to skip (default: 0)</li>
                        <li><code>stage</code> - Filter by lead stage</li>
                        <li><code>assignedTo</code> - Filter by assigned user ID</li>
                    </ul>
                </div>

                <div class="endpoint">
                    <h4><span class="method POST">POST</span> /api/leads</h4>
                    <p>Create a new lead</p>
                    <div class="code">POST https://crm.clienn.com/api/leads</div>
                    <p><strong>Request Body:</strong></p>
                    <div class="code">{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "website",
  "notes": "Interested in our services"
}</div>
                </div>

                <div class="endpoint">
                    <h4><span class="method PUT">PUT</span> /api/leads/{id}</h4>
                    <p>Update an existing lead</p>
                    <div class="code">PUT https://crm.clienn.com/api/leads/123</div>
                    <p><strong>Request Body:</strong></p>
                    <div class="code">{
  "stage": "Contacted",
  "notes": "Updated contact information"
}</div>
                </div>

                <div class="endpoint">
                    <h4><span class="method DELETE">DELETE</span> /api/leads/{id}</h4>
                    <p>Delete a lead</p>
                    <div class="code">DELETE https://crm.clienn.com/api/leads/123</div>
                </div>

                <h3>Webhooks</h3>

                <div class="endpoint">
                    <h4><span class="method GET">GET</span> /api/webhooks</h4>
                    <p>List all webhooks</p>
                    <div class="code">GET https://crm.clienn.com/api/webhooks</div>
                </div>

                <div class="endpoint">
                    <h4><span class="method POST">POST</span> /api/webhooks</h4>
                    <p>Create a new webhook</p>
                    <div class="code">POST https://crm.clienn.com/api/webhooks</div>
                    <p><strong>Request Body:</strong></p>
                    <div class="code">{
  "name": "My Webhook",
  "url": "https://myapp.com/webhook",
  "events": ["lead.created", "lead.updated"],
  "isEnabled": true
}</div>
                </div>
            </div>

            <div class="section">
                <h2>Webhook Events</h2>
                <p>Webhooks are sent as POST requests to your configured URLs with JSON payloads. Each webhook includes an HMAC signature for verification.</p>

                <h3>Available Events:</h3>
                <ul>
                    <li><code>lead.created</code> - Triggered when a new lead is created</li>
                    <li><code>lead.updated</code> - Triggered when a lead's information is updated</li>
                    <li><code>lead.deleted</code> - Triggered when a lead is deleted</li>
                    <li><code>lead.stage_changed</code> - Triggered when a lead moves to a different stage</li>
                    <li><code>lead.assigned</code> - Triggered when a lead is assigned to a user</li>
                    <li><code>lead.received</code> - Triggered when a lead is received from an external source</li>
                </ul>

                <h3>Sample Payload:</h3>
                <div class="code">{
  "event": "lead.created",
  "data": {
    "id": "lead_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": "website",
    "createdAt": "2025-01-23T10:30:00Z",
    "organizationId": "org_456"
  },
  "timestamp": "2025-01-23T10:30:00Z",
  "webhookId": "webhook_789"
}</div>
            </div>

            <div class="section">
                <h2>Authentication & Security</h2>
                <h3>API Key Security</h3>
                <ul>
                    <li>Keep your API keys secure and never share them publicly</li>
                    <li>Use HTTPS for all API requests</li>
                    <li>Rotate your keys regularly for security</li>
                    <li>Monitor your API usage for unusual activity</li>
                </ul>

                <h3>Webhook Verification</h3>
                <p>Each webhook request includes an X-Webhook-Signature header containing an HMAC-SHA256 signature of the payload.</p>
                <div class="code">const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', 'your_webhook_secret')
  .update(payload)
  .digest('hex');

if (signature === expectedSignature) {
  // Webhook is authentic
}</div>
            </div>

            <div style="margin-top: 40px; padding: 20px; background: #e8f4f8; border: 1px solid #3498db; border-radius: 6px;">
                <h3 style="color: #2c3e50; margin-top: 0;">Need Help?</h3>
                <p>Contact our support team for integration assistance.</p>
                <p><strong>Email:</strong> <a href="mailto:support@Clienn CRM.io">support@Clienn CRM.io</a></p>
            </div>

            <p style="margin-top: 40px; font-size: 14px; color: #666; text-align: center;">
                This API documentation was last updated on ${new Date().toLocaleDateString()}.
            </p>
        </div>
    </body>
    </html>
  `;

  res.status(200).set('Content-Type', 'text/html').send(html);
});

app.get('/privacy', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy — Clienn CRM</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }
            h2 {
                color: #34495e;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .section {
                margin-bottom: 25px;
                padding: 20px;
                background: #f8f9fa;
                border-left: 4px solid #3498db;
                border-radius: 4px;
            }
            .contact-info {
                background: #e8f4f8;
                padding: 20px;
                border-radius: 6px;
                margin-top: 30px;
            }
            .contact-info strong {
                color: #2c3e50;
            }
            a {
                color: #3498db;
                text-decoration: none;
            }
            a:hover {
                text-decoration: underline;
            }
            @media (max-width: 768px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Privacy Policy — Clienn CRM</h1>

            <div class="section">
                <h2>What We Collect</h2>
                <p>We collect the following information to provide our lead management services:</p>
                <ul>
                    <li><strong>Personal Information:</strong> Name, email address, phone number</li>
                    <li><strong>Lead Data:</strong> Information provided through lead forms and interactions</li>
                    <li><strong>Usage Data:</strong> Analytics and usage logs to improve our services</li>
                </ul>
            </div>

            <div class="section">
                <h2>Why We Collect This Information</h2>
                <p>We use the collected information for:</p>
                <ul>
                    <li><strong>Lead Management:</strong> Processing and managing customer leads</li>
                    <li><strong>Analytics:</strong> Understanding usage patterns to improve our services</li>
                    <li><strong>Integrations:</strong> Connecting with third-party services like Facebook Lead Ads</li>
                    <li><strong>Communication:</strong> Providing customer support and service updates</li>
                </ul>
            </div>

            <div class="section">
                <h2>Information Sharing</h2>
                <p>We do not sell your personal information. We may share data only with:</p>
                <ul>
                    <li>Third-party services you explicitly connect (e.g., Facebook Lead Ads, email marketing platforms)</li>
                    <li>Service providers who assist in our operations (under strict confidentiality agreements)</li>
                    <li>When required by law or to protect our rights</li>
                </ul>
            </div>

            <div class="section">
                <h2>Data Retention</h2>
                <p>We retain your information:</p>
                <ul>
                    <li>As long as your account or contract remains active</li>
                    <li>As required by applicable laws and regulations</li>
                    <li>Until you request deletion (subject to legal requirements)</li>
                </ul>
            </div>

            <div class="section">
                <h2>Security Measures</h2>
                <p>We implement appropriate security measures:</p>
                <ul>
                    <li><strong>Encryption:</strong> All data is encrypted in transit using HTTPS</li>
                    <li><strong>Access Control:</strong> Restricted access to authorized personnel only</li>
                    <li><strong>Regular Updates:</strong> Security systems are regularly updated and monitored</li>
                </ul>
            </div>

            <div class="section">
                <h2>Your Data Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li><strong>Access:</strong> Request information about your data</li>
                    <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                    <li><strong>Export:</strong> Receive your data in a structured format</li>
                </ul>
            </div>

            <div class="contact-info">
                <h2>Contact Information</h2>
                <p>For privacy-related inquiries or to exercise your data rights:</p>
                <p><strong>Email:</strong> <a href="mailto:support@Clienn CRM.io">support@Clienn CRM.io</a></p>
                <p><strong>Alternative Email:</strong> <a href="mailto:nadeemjabir1@gmail.com">nadeemjabir1@gmail.com</a></p>
                <p><strong>Data Deletion:</strong> Visit our <a href="/facebook/data-deletion">Facebook Data Deletion</a> page for specific instructions</p>
            </div>

            <p style="margin-top: 40px; font-size: 14px; color: #666; text-align: center;">
                This privacy policy was last updated on ${new Date().toLocaleDateString()}.
            </p>
        </div>
    </body>
    </html>
  `;

  res.status(200).set('Content-Type', 'text/html').send(html);
});

app.get('/facebook/data-deletion', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facebook Data Deletion Instructions — Clienn CRM</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }
            .instruction-box {
                background: #e8f4f8;
                border: 2px solid #3498db;
                border-radius: 6px;
                padding: 25px;
                margin: 20px 0;
            }
            .method {
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-left: 4px solid #27ae60;
                border-radius: 4px;
            }
            .method h3 {
                color: #27ae60;
                margin-top: 0;
            }
            .api-example {
                background: #2c3e50;
                color: #ecf0f1;
                padding: 15px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                margin: 10px 0;
            }
            .contact-info {
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 20px;
                border-radius: 6px;
                margin-top: 30px;
            }
            a {
                color: #3498db;
                text-decoration: none;
                font-weight: bold;
            }
            a:hover {
                text-decoration: underline;
            }
            @media (max-width: 768px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Facebook Data Deletion Instructions — Clienn CRM</h1>

            <p>If you want to delete your data obtained through Facebook integrations with Clienn CRM, you can use one of the following methods:</p>

            <div class="method">
                <h3>Method 1: Email Request</h3>
                <p>To delete your data obtained via Facebook integrations:</p>
                <div class="instruction-box">
                    <p><strong>Send an email to:</strong> <a href="mailto:support@Clienn CRM.io">support@Clienn CRM.io</a></p>
                    <p><strong>Subject:</strong> Facebook Data Deletion</p>
                    <p><strong>Body:</strong> Please include your registered email address and organization details</p>
                </div>
            </div>

            <div class="method">
                <h3>Method 2: API Request</h3>
                <p>You can submit a deletion request via our API:</p>
                <div class="instruction-box">
                    <p><strong>Endpoint:</strong> POST /v1/privacy/data-deletion</p>
                    <p><strong>Required Information:</strong></p>
                    <ul>
                        <li>Your organization identifier</li>
                        <li>Your user identifier</li>
                        <li>Confirmation of your identity</li>
                    </ul>
                </div>

                <div class="api-example">
POST /v1/privacy/data-deletion
Content-Type: application/json

{
  "orgId": "your-organization-id",
  "userId": "your-user-id",
  "reason": "Facebook data deletion request"
}
                </div>
            </div>

            <div class="contact-info">
                <h3>Confirmation Timeline</h3>
                <p>We will process your deletion request and confirm completion within <strong>7 business days</strong>.</p>
                <p>You will receive confirmation via email once the deletion is complete.</p>
            </div>

            <div class="contact-info" style="background: #d4edda; border-color: #c3e6cb;">
                <h3>What Gets Deleted</h3>
                <p>This process will delete:</p>
                <ul>
                    <li>All lead data obtained through Facebook integrations</li>
                    <li>Associated analytics and usage data</li>
                    <li>Facebook-specific integration settings</li>
                </ul>
                <p><em>Note: Some data may be retained if required by law or for legitimate business purposes.</em></p>
            </div>

            <p style="margin-top: 40px; font-size: 14px; color: #666; text-align: center;">
                For more information about our data practices, please visit our <a href="/privacy">Privacy Policy</a>.
            </p>
        </div>
    </body>
    </html>
  `;

  res.status(200).set('Content-Type', 'text/html').send(html);
});

// Serve static files from frontend build directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend/dist'));

  // Catch-all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    // Skip API and webhook routes - these should have been handled above
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.path.startsWith('/privacy') || req.path.startsWith('/facebook/data-deletion')) {
      return res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    }

    res.sendFile(path.resolve('../frontend/dist/index.html'));
  });
} else {
  // In development, just return 404 for non-API routes
  app.use('*', (req, res) => {
    // Skip API routes and public pages
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') ||
        req.path === '/api-docs' || req.path.startsWith('/privacy') ||
        req.path.startsWith('/facebook/data-deletion')) {
      return res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
      });
    }

    // For development, return a simple message
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found. In development mode, please ensure you're accessing the correct frontend port.`
    });
  });
}

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

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  // Check if this is a WebSocket upgrade request for /api/sync
  if (request.url === '/api/sync') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // Reject other WebSocket connections
    socket.destroy();
  }
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




