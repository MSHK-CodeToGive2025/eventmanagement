// CORS Configuration for AWS Deployment
// This file handles CORS settings for different environments

const getCorsOrigins = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production') {
    // Production origins - add your actual frontend domains here
    const productionOrigins = [
      // Frontend ALB from AWS documentation
      'http://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com',
      'https://zubin-emb-alb-1568046412.ap-east-1.elb.amazonaws.com',
      // Alternative frontend ALB (if different)
      'http://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com',
      'https://zubin-events-alb-1307450074.ap-east-1.elb.amazonaws.com',
      // Custom domain (if you have one)
      process.env.CORS_ORIGIN,
      // Additional production domains
      ...(process.env.ADDITIONAL_CORS_ORIGINS ? process.env.ADDITIONAL_CORS_ORIGINS.split(',') : [])
    ].filter(Boolean); // Remove empty values
    
    console.log('[CORS] Production origins configured:', productionOrigins);
    return productionOrigins;
  } else {
    // Development origins
    const devOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:5173',
      'http://localhost:4173', // Vite preview port
      'http://127.0.0.1:4173'
    ];
    console.log('[CORS] Development origins configured:', devOrigins);
    return devOrigins;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log('[CORS] Request from origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('[CORS] Origin allowed:', origin);
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      console.warn(`[CORS] Allowed origins:`, allowedOrigins);
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