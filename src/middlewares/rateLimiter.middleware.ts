import rateLimit from "express-rate-limit";

// Throttles brute-force/credential-stuffing attempts against the admin
// login. 10 attempts per IP per 15 minutes — generous for a real user who
// mistypes a password, tight enough to make guessing impractical.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
