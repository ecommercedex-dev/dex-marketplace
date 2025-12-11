import rateLimit from 'express-rate-limit';
import { config } from '../config/config.js';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' },
  skipSuccessfulRequests: true,
});

// Login rate limiting
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true,
});

// Registration rate limiting
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many registration attempts, please try again later' },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many file uploads, please wait' },
});