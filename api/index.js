require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Initialize singleton instances
const prisma = require('./config/database');
const { initializeFirebase } = require('./config/firebase');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - Allow all environments (production, staging, development)
const allowedOrigins = [
  // Production
  'https://cvstomize-frontend-351889420459.us-central1.run.app',
  'https://cvstomize.web.app',
  'https://cvstomize.firebaseapp.com',
  // Staging
  'https://cvstomize-frontend-staging-j7hztys6ba-uc.a.run.app',
  'https://cvstomize-api-staging-j7hztys6ba-uc.a.run.app',
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3010',
  'http://localhost:3011'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Trust proxy for Cloud Run (behind load balancer)
// Set to number of proxies between user and server (Cloud Run uses 1 proxy)
app.set('trust proxy', 1);

// Rate limiting with proper trust proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Validate that trust proxy is properly configured
  validate: { trustProxy: false },
});
app.use('/api/', limiter);

// Body parsing middleware (increased limits for resume uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Quick health check (no DB query)
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Detailed health check with database connectivity
app.get('/health/detailed', async (req, res) => {
  const checks = {
    server: 'healthy',
    database: 'unknown',
    firebase: 'unknown',
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    logger.error('Database health check failed:', error);
  }

  try {
    // Test Firebase (check if initialized)
    const admin = require('firebase-admin');
    checks.firebase = admin.apps.length > 0 ? 'healthy' : 'not_initialized';
  } catch (error) {
    checks.firebase = 'unhealthy';
    logger.error('Firebase health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(status => status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks,
  });
});

// API routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const conversationRoutes = require('./routes/conversation');
const resumeRoutes = require('./routes/resume');
const goldStandardRoutes = require('./routes/goldStandard');
const proxyRoutes = require('./routes/proxy');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/gold-standard', goldStandardRoutes);
app.use('/api/proxy', proxyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Initialize Firebase at startup (not per-request)
async function initializeApp() {
  try {
    // Initialize Firebase Admin SDK
    if (process.env.NODE_ENV !== 'test') {
      await initializeFirebase();
      logger.info('✅ Firebase Admin SDK initialized');
    } else {
      logger.info('🧪 Test mode: Skipping Firebase initialization');
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection verified');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Detailed health: http://localhost:${PORT}/health/detailed`);
    });

    return server;
  } catch (error) {
    logger.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
let server;
if (process.env.NODE_ENV !== 'test') {
  initializeApp().then(s => server = s);
} else {
  // In test mode, don't auto-start server
  server = null;
}

// Export for testing
module.exports = { app, prisma, logger, initializeApp };
