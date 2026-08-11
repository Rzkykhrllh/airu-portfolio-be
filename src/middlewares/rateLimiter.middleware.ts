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

// Throttles the public contact form. Generous enough for a real visitor
// (retry after a typo, one genuine follow-up), tight enough to blunt a
// spam/flood script — this endpoint has no auth at all to fall back on.
export const inquiryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent. Please try again later.",
  },
});
