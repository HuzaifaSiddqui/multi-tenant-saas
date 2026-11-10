const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev convenience
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  })
);

// Stripe Webhook Route (Needs raw body for signature verification)
const { handleStripeWebhook } = require('./controllers/billingController');
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Body parsing middleware for normal JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'multi-tenant-saas-api',
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/organizations', require('./routes/orgRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/invitations', require('./routes/invitationRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/activity', require('./routes/auditLogRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`[Server] Multi-Tenant SaaS Backend running on port ${PORT}`);
});

module.exports = { app, server };
