import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

// Extrend Express Request to include user property
// TODO: still not understand mechanism of this code
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try{
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Still not understand why need &&

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }
  

  // Verify Token
  const decoded = verifyToken(token);

  // attach user info to request object
  req.user = {
    userId: decoded.userId,
    username: decoded.username,
  }

  // to the next middleware/route handler
  next();

  }
  catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional authentication middleware
 * Tries to authenticate if token is present, but doesn't fail if absent
 * Used for routes that support both public and authenticated access
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    // If no token, just continue without setting req.user
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    // Invalid token - just continue without setting req.user
    // Don't return error, let the route handler decide
    next();
  }
};

// Authentication middleware to protect routes