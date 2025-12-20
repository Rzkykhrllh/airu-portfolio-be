import { z } from "zod";

export const createPhotoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});


export const getPhotoSchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(100),
  featured: z.string().transform((val) => val === 'true').optional(),
  tag: z.array(z.string()).optional(),
  collectionId: z.string().optional(),
});