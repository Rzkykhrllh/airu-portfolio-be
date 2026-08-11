import { Router } from "express";
import {register, login} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { loginRateLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Register new user — gated behind an existing admin session. This app has
// a single User model with no role/permission distinction, so an open
// register endpoint was equivalent to an unauthenticated admin signup.
router.post("/register", authenticateToken, register);

// Login user
router.post("/login", loginRateLimiter, login);

export default router;