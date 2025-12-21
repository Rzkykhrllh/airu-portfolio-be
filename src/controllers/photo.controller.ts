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

export const getPhotos = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = getPhotoSchema.parse(req.query);
    const { page, limit, featured, tag, collectionId } = query;

    const skip = (page - 1) * limit;

    // Query where clause
    const where: any = {};

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
      data: photos,
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
      data: photo,
    });
  }
);

export const createPhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = createPhotoSchema.parse(req.body);

    // Dummy Image Url
    const dummyImageUrl = {
      urlSmall: `https://example.com/${Date.now()}/small.jpg`,
      urlMedium: `https://example.com/${Date.now()}/medium.jpg`,
      urlLarge: `https://example.com/${Date.now()}/large.jpg`,
    };

    const photo = await prisma.photo.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        featured: data.featured,
        ...dummyImageUrl,

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
      data: photo,
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
      data: updatedPhoto,
    });
  }
);

export const deletePhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const photo = await prisma.photo.findUnique({
      where: { id },
    });

    if (!photo) {
      throw new NotFoundError("Photo not found");
    }

    await prisma.photo.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Photo deleted successfully",
    });
  }
);
