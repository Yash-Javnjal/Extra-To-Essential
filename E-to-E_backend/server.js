require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const ngoRoutes = require('./routes/ngos');
const listingRoutes = require('./routes/listings');
const claimRoutes = require('./routes/claims');
const deliveryRoutes = require('./routes/deliveries');
const impactRoutes = require('./routes/impact');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Surplus Food Redistribution System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      donors: '/api/donors',
      ngos: '/api/ngos',
      listings: '/api/listings',
      claims: '/api/claims',
      deliveries: '/api/deliveries',
      impact: '/api/impact'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/impact', impactRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Smart Surplus Food Redistribution System');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('\nAvailable Endpoints:');
  console.log('  POST   /api/auth/register     - Register new user');
  console.log('  POST   /api/auth/login        - Login user');
  console.log('  POST   /api/auth/logout       - Logout user');
  console.log('  GET    /api/auth/me           - Get current user');
  console.log('');
  console.log('  POST   /api/donors            - Create donor profile');
  console.log('  GET    /api/donors/me         - Get donor profile');
  console.log('  GET    /api/donors/me/impact  - Get donor impact');
  console.log('');
  console.log('  POST   /api/ngos              - Create NGO profile');
  console.log('  GET    /api/ngos/me           - Get NGO profile');
  console.log('  POST   /api/ngos/me/volunteers - Add volunteer');
  console.log('  GET    /api/ngos/me/volunteers - List volunteers');
  console.log('');
  console.log('  POST   /api/listings          - Create food listing');
  console.log('  GET    /api/listings          - Get available listings');
  console.log('  GET    /api/listings/my       - Get my listings');
  console.log('');
  console.log('  POST   /api/claims            - Claim listing');
  console.log('  GET    /api/claims/my         - Get my claims');
  console.log('');
  console.log('  POST   /api/deliveries        - Assign delivery');
  console.log('  PUT    /api/deliveries/:id/status - Update delivery status');
  console.log('  GET    /api/deliveries/my     - Get my deliveries');
  console.log('');
  console.log('  GET    /api/impact/total      - Total impact metrics');
  console.log('  GET    /api/impact/dashboard  - Dashboard summary');
  console.log('  GET    /api/impact/leaderboard/donors - Donor leaderboard');
  console.log('='.repeat(60));
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;