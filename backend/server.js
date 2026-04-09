// Load env vars BEFORE requiring modules that may read process.env
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const setupSocket = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const gigRoutes = require('./routes/gigRoutes');
const bidRoutes = require('./routes/bidRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const User = require('./models/user');

// Env already loaded above

// Connect to database
connectDB();

const bootstrapAdminAccount = async () => {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const adminUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
  if (adminUser) {
    adminUser.role = 'admin';
    adminUser.isEmailVerified = true;
    adminUser.freelancerApprovalStatus = 'approved';
    adminUser.accountStatus = 'active';
    adminUser.isBanned = false;
    adminUser.password = adminPassword;
    await adminUser.save();
    return;
  }

  await User.create({
    name: process.env.ADMIN_BOOTSTRAP_NAME || 'Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isEmailVerified: true,
    freelancerApprovalStatus: 'approved',
    accountStatus: 'active'
  });
};

const app = express();
const server = http.createServer(app);

// Required on Render/proxy setups so secure cookies work correctly
app.set('trust proxy', 1);

// Setup Socket.io
const io = setupSocket(server);
app.set('io', io); // Make io accessible in controllers

// Middleware
const normalizeOrigin = (origin) => origin.replace(/\/$/, '');

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || '').split(',')
]
  .filter(Boolean)
  .map((origin) => normalizeOrigin(origin.trim()));

if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and allowed origins
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Taskvra API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await bootstrapAdminAccount();
    server.listen(PORT, () => {
      console.log(` Server running on port ${PORT} in ${NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(' Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
