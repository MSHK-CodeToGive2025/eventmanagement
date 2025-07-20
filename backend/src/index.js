import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import usersRoutes from './routes/users.js';
import eventRegistrationRoutes from './routes/eventRegistrations.js';
import registrationFormRoutes from './routes/registrationForms.js';
import corsOptions from './cors-config.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/event-registrations', eventRegistrationRoutes);
app.use('/api/registration-forms', registrationFormRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Zubin Foundation Event Management System API' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 [MAIN] Health check endpoint hit!');
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    // Check MongoDB connection status
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (dbState === 1) {
      // Test database operations
      const adminDb = mongoose.connection.db.admin();
      const result = await adminDb.ping();
      
      res.json({
        status: 'OK',
        database: 'MongoDB',
        connection: dbStatus[dbState],
        ping: result.ok === 1 ? 'successful' : 'failed',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'ERROR',
        database: 'MongoDB',
        connection: dbStatus[dbState],
        message: 'Database is not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'MongoDB',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 