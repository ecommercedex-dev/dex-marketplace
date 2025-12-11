import dotenv from 'dotenv';
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Email
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';