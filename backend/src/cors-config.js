// CORS Configuration for AWS Deployment
// This file handles CORS settings for different environments

const getCorsOrigins = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    // Production origins - add your actual frontend domains here
    const productionOrigins = [
      // New frontend ALB (user-facing)
      'http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com',
      // Custom domain (if you have one)
      process.env.CORS_ORIGIN,
      // Additional production domains
      ...(process.env.ADDITIONAL_CORS_ORIGINS ? process.env.ADDITIONAL_CORS_ORIGINS.split(',') : [])
    ].filter(Boolean); // Remove empty values
    return productionOrigins;
  } else {
    // Development origins
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:5173',
      'http://localhost:4173', // Vite preview port
      'http://127.0.0.1:4173'
    ];
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export default corsOptions; 