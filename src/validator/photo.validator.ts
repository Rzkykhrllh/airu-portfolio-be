import { z } from "zod";

export const createPhotoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),

  featured: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === "boolean") return val;
      return val === "true";
    }),

  visibility: z
    .enum(["PUBLIC", "COLLECTION_ONLY", "PRIVATE"])
    .optional()
    .default("PUBLIC"),

  tags: z.array(z.string()).optional(),

  collectionIds: z.array(z.string()).optional(),

  // Accept EXIF as JSON string, parse to object
  exif: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return undefined;
      try {
        return JSON.parse(val);
      } catch (error) {
        console.error("Failed to parse EXIF data:", error);
        return undefined;
      }
    }),

  capturedAt: z.string().optional().transform(val => {
    if (!val) return undefined;

    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(val).toISOString();
    }
    return val
  })
});

export const getPhotoSchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(100),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  tag: z.array(z.string()).optional(),
  collectionId: z.string().optional(),
  collectionSlug: z.string().optional(),
  scope: z.enum(['public', 'collection', 'admin']).optional().default('public'),
});

export const updatePhotoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  featured: z.boolean().optional(),
  visibility: z.enum(["PUBLIC", "COLLECTION_ONLY", "PRIVATE"]).optional(),
  tags: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  capturedAt: z.string().datetime().optional(),
});
