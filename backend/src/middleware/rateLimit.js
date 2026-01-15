import rateLimit from 'express-rate-limit';

// General rate limiter for database operations
// Allows 100 requests per 15 minutes per IP
export const dbRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for expensive operations (export, import)
// Allows 10 requests per 15 minutes per IP
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests for this operation, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

