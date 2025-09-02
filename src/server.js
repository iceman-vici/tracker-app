require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { initializeSocketHandlers } = require('./socket/socketHandlers');
const cronJobs = require('./jobs/cronJobs');

// Import Time Doctor API compatible routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const companyRoutes = require('./routes/company.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const worklogRoutes = require('./routes/worklog.routes');
const screenshotRoutes = require('./routes/screenshot.routes');
const activityRoutes = require('./routes/activity.routes');
const reportRoutes = require('./routes/report.routes');
const payrollRoutes = require('./routes/payroll.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const integrationRoutes = require('./routes/integration.routes');
const webhookRoutes = require('./routes/webhook.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Connect to Database
connectDB();

// Trust proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`Incoming ${req.method} request to ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Info endpoint (Time Doctor style)
app.get('/api/1.0', (req, res) => {
  res.json({
    version: '1.0',
    name: 'Time Tracker API (Time Doctor Clone)',
    endpoints: {
      auth: '/api/1.0/login',
      users: '/api/1.0/users',
      companies: '/api/1.0/companies',
      projects: '/api/1.0/projects',
      tasks: '/api/1.0/tasks',
      worklogs: '/api/1.0/worklogs',
      activity: '/api/1.0/activity',
      screenshots: '/api/1.0/screenshots',
      reports: '/api/1.0/reports'
    }
  });
});

// Time Doctor API Compatible Routes (using /api/1.0 prefix)
app.use('/api/1.0', authRoutes);  // Includes /login, /logout, /register
app.use('/api/1.0/users', userRoutes);
app.use('/api/1.0/companies', companyRoutes);
app.use('/api/1.0/projects', projectRoutes);
app.use('/api/1.0/tasks', taskRoutes);
app.use('/api/1.0/worklogs', worklogRoutes);
app.use('/api/1.0/screenshots', screenshotRoutes);
app.use('/api/1.0/activity', activityRoutes);
app.use('/api/1.0/reports', reportRoutes);
app.use('/api/1.0/payroll', payrollRoutes);
app.use('/api/1.0/invoices', invoiceRoutes);
app.use('/api/1.0/integrations', integrationRoutes);
app.use('/api/1.0/webhooks', webhookRoutes);
app.use('/api/1.0/notifications', notificationRoutes);
app.use('/api/1.0/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    error: {
      code: 404,
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.io handlers
initializeSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

// Start cron jobs
cronJobs.startAll();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`🚀 Time Tracker API (Time Doctor Clone) running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}/api/1.0`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };