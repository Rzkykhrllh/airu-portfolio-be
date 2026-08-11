import { Router } from "express";
import {
  createInquiry,
  getInquiries,
  markInquiryRead,
  deleteInquiry,
} from "../controllers/inquiry.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { inquiryRateLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Public — the contact form
router.post("/", inquiryRateLimiter, createInquiry);

// Admin inbox
router.get("/", authenticateToken, getInquiries);
router.patch("/:id/read", authenticateToken, markInquiryRead);
router.delete("/:id", authenticateToken, deleteInquiry);

export default router;
