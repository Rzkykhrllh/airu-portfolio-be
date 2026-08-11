import { z } from "zod";

export const createInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  projectType: z.string().trim().max(100).optional(),
  message: z.string().trim().min(1, "Message is required").max(5000),

  // Honeypot — real visitors never fill this (it's hidden via CSS). Bots
  // that blindly fill every field trip it. Accepted but never stored.
  company: z.string().optional(),
});

export const getInquirySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(50),
  read: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});
