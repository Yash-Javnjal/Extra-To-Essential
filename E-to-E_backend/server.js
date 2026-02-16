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
const geocodeRoutes = require('./routes/geocode');

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
app.use('/api/geocode', geocodeRoutes);

// ─── Test Email Route ──────────────────────────────────────────
const {
  sendEmail,
  sendWelcomeDonor,
  sendWelcomeNGO,
  sendListingCreatedEmail,
  sendClaimAcceptedEmail,
  sendDeliveryAssignedEmail,
  sendDeliveryCompletedEmail,
} = require('./services/emailService');

app.get('/test-email', async (req, res) => {
  const template = req.query.template || 'welcomeDonor';
  const to = req.query.to || process.env.EMAIL_USER || 'test@example.com';

  console.log(`[TEST-EMAIL] Sending "${template}" template to ${to}`);

  const sampleData = {
    welcomeDonor: () => sendWelcomeDonor({ to, userName: 'Test Donor', email: to, phone: '+91 98765 43210', organizationName: 'TestOrg Pvt Ltd' }),
    welcomeNGO: () => sendWelcomeNGO({ to, userName: 'Test NGO Admin', email: to, phone: '+91 98765 43210', organizationName: 'Hope Foundation', contactPerson: 'Raj Sharma' }),
    listingCreated: () => sendListingCreatedEmail({ to, ngoName: 'Hope Foundation', donorName: 'TestOrg Pvt Ltd', donorPhone: '+91 98765 43210', foodType: 'Cooked Rice & Curry', quantity: '25', mealEquivalent: '50', pickupAddress: '42 MG Road, Bengaluru, Karnataka', expiryTime: new Date(Date.now() + 6 * 3600000).toLocaleString(), distance: '3.2' }),
    claimAccepted: () => sendClaimAcceptedEmail({ to, donorName: 'TestOrg Pvt Ltd', ngoName: 'Hope Foundation', ngoContact: 'Raj Sharma', ngoPhone: '+91 98765 43210', foodType: 'Cooked Rice & Curry', quantity: '25', pickupAddress: '42 MG Road, Bengaluru, Karnataka', pickupTime: new Date(Date.now() + 2 * 3600000).toLocaleString() }),
    deliveryAssigned: () => sendDeliveryAssignedEmail({ to, volunteerName: 'Amit Kumar', ngoName: 'Hope Foundation', ngoPhone: '+91 98765 43210', donorName: 'TestOrg Pvt Ltd', donorPhone: '+91 98765 43211', foodType: 'Cooked Rice & Curry', quantity: '25', pickupAddress: '42 MG Road, Bengaluru, Karnataka', deliveryStatus: 'Assigned' }),
    deliveryCompleted: () => sendDeliveryCompletedEmail({ to, recipientName: 'TestOrg Pvt Ltd', donorName: 'TestOrg Pvt Ltd', donorPhone: '+91 98765 43211', ngoName: 'Hope Foundation', ngoPhone: '+91 98765 43210', volunteerName: 'Amit Kumar', foodType: 'Cooked Rice & Curry', quantity: '25', mealEquivalent: '50', pickupAddress: '42 MG Road, Bengaluru, Karnataka', deliveryStatus: 'Delivered', completedAt: new Date().toLocaleString(), co2Saved: '62.50' }),
  };

  if (!sampleData[template]) {
    return res.status(400).json({
      error: 'Invalid template',
      available: Object.keys(sampleData),
      usage: 'GET /test-email?template=welcomeDonor&to=your@email.com',
    });
  }

  try {
    const result = await sampleData[template]();
    console.log(`[TEST-EMAIL] Result:`, result);
    res.json({
      message: `Test email sent with template: ${template}`,
      to,
      template,
      result,
    });
  } catch (error) {
    console.error(`[TEST-EMAIL] ❌ Error:`, error);
    res.status(500).json({ error: 'Email failed', message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

// Initialize HTTP server for Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

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
server.listen(PORT, "0.0.0.0", () => {
  console.log('='.repeat(60));
  console.log('Smart Surplus Food Redistribution System');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: http://localhost:${PORT}`);
  console.log(`Network: http://172.19.239.240:${PORT}`);
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