/**
 * Enhanced Security Middleware
 * Production-ready security configurations for CVstomize API
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Helmet configuration for security headers
 * Protects against common vulnerabilities:
 * - XSS attacks
 * - Clickjacking
 * - MIME type sniffing
 * - DNS prefetching leaks
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://firebaseapp.com', 'https://firebaseio.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * Rate limiting configurations
 * Multiple tiers based on endpoint sensitivity
 */

// General API rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the 100 requests in 15 minutes limit.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Strict rate limit for auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too Many Auth Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Resume generation rate limit: 10 per hour
const resumeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Resume Generation Limit',
    message: 'You have reached the hourly resume generation limit. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Conversation rate limit: 50 per hour (prevents abuse)
const conversationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    error: 'Conversation Limit',
    message: 'You have reached the hourly conversation limit. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request sanitization middleware
 * Strips potentially dangerous characters from user input
 */
function sanitizeInput(req, res, next) {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === 'string') {
        // Remove script tags and other dangerous patterns
        req.query[key] = req.query[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
    });
  }

  // Sanitize body (but preserve JSON structure)
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'string') {
      // Only strip script tags, preserve other content
      obj[key] = obj[key].replace(/<script[^>]*>.*?<\/script>/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  });
}

/**
 * Security headers middleware
 * Adds additional security headers not covered by helmet
 */
function additionalSecurityHeaders(req, res, next) {
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent page from being displayed in iframe (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Limit what information is sent with referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Feature policy / permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  resumeLimiter,
  conversationLimiter,
  sanitizeInput,
  additionalSecurityHeaders,
};
