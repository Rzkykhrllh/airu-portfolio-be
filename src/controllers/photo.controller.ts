import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/erros";
import {
  createPhotoSchema,
  getPhotoSchema,
  updatePhotoSchema,
} from "../validator/photo.validator";
import { success } from "zod";
import { uploadImageToR2, deleteImageFromR2 } from "../services/upload.services";
import { transformPhoto, transformPhotos } from "../utils/transformers";

export const getPhotos = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = getPhotoSchema.parse(req.query);
    const { page, limit, featured, tag, collectionId, scope } = query;

    const skip = (page - 1) * limit;

    // Check authentication
    const isAuthenticated = !!(req as any).user;

    // Strict auth check for admin scope
    if (scope === 'admin' && !isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for admin scope',
      });
    }

    // Query where clause
    const where: any = {};

    // Filter by scope (visibility levels)
    if (scope === 'admin') {
      // Admin (authenticated): show ALL photos (no filter)
      // where.visibility = undefined (no filter)
    } else if (scope === 'collection') {
      // Public + Collection only
      where.visibility = { in: ['PUBLIC', 'COLLECTION_ONLY'] };
    } else {
      // scope === 'public' (default)
      // Public only
      where.visibility = 'PUBLIC';
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (tag) {
      where.tags = {
        some: { tag },
      };
    }

    if (collectionId) {
      where.collections = {
        some: { id: collectionId },
      };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tags: true,
          collections: {
            include: {
              collection: true,
            },
          },
        },
      }),
      prisma.photo.count({ where }),
    ]);

    res.json({
      success: true,
      data: transformPhotos(photos),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const getPhotoById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const photo = await prisma.photo.findUnique({
      where: { id }, //Get Photo by Id
      include: {
        tags: true, // Include associated tags
        collections: {
          include: {
            collection: true, // Include associated collections
          },
        },
      },
    });

    if (!photo) {
      throw new NotFoundError("Photo not found");
    }

    res.json({
      success: true,
      data: transformPhoto(photo),
    });
  }
);

export const createPhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // File existance check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const data = createPhotoSchema.parse(req.body);
    const imageUrl = await uploadImageToR2(req.file.buffer, req.file.mimetype);

    // File info from multer
    const file = req.file;
    console.log("File received:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer.length, // File ada di memory sebagai Buffer
    });

    const photo = await prisma.photo.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        featured: data.featured,
        visibility: data.visibility,
        capturedAt: data.capturedAt,
        metadata: data.exif || {}, // Store EXIF data in metadata field
        ...imageUrl,

        // Create data into related tables
        tags: data.tags
          ? {
              create: data.tags.map((tag) => ({ tag })),
            }
          : undefined,

        collections: data.collectionIds
          ? {
              create: data.collectionIds.map((collectionId) => ({
                collection: { connect: { id: collectionId } },
              })),
            }
          : undefined,
      },

      // include related data in the response
      include: {
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transformPhoto(photo),
    });
  }
);

export const updatePhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = updatePhotoSchema.parse(req.body);

    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundError("Photo not found");
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        featured: data.featured,
        visibility: data.visibility,
        capturedAt: data.capturedAt,

        //  Update tags - Delete non included and add new ones
        tags: data.tags
          ? {
              deleteMany: {
                tag: {
                  notIn: data.tags,
                },
              },
              createMany: {
                data: data.tags.map((tag) => ({ tag })),
                skipDuplicates: true,
              },
            }
          : undefined,

        // Update Collections - Delete non included and add new ones
        collections: data.collectionIds
          ? {
              deleteMany: {
                collectionId: {
                  notIn: data.collectionIds,
                },
              },
              createMany: {
                data: data.collectionIds.map((collectionId) => ({
                  collectionId,
                })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        tags: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: transformPhoto(updatedPhoto),
    });
  }
);

export const deletePhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Get photo (need URLs for R2 deletion)
    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundError("Photo not found");
    }

    // Delete images from R2
    await deleteImageFromR2({
      urlSmall: photo.urlSmall,
      urlMedium: photo.urlMedium,
      urlLarge: photo.urlLarge,
    });

    // Delete from database
    await prisma.photo.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Photo deleted successfully",
    });
  }
);
