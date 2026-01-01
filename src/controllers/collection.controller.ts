import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/erros";
import {
  createCollectionSchema,
  generateSlug,
  getCollectionSchema,
  updateCollectionSchema,
} from "../validator/collection.validator";
import { transformCollection, transformCollections } from "../utils/transformers";

export const getCollections = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = getCollectionSchema.parse(req.query);

    const { page, limit, scope } = query;
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

    // Determine photo visibility filter based on scope
    let photoVisibilityFilter: any;

    if (scope === 'admin') {
      // Admin (authenticated): show ALL photos (no filter)
      photoVisibilityFilter = {};
    } else {
      // scope === 'public' (default)
      // Public + Collection only
      photoVisibilityFilter = {
        photo: {
          visibility: { in: ['PUBLIC', 'COLLECTION_ONLY'] },
        },
      };
    }

    const [collections, total] = await Promise.all([
      prisma.collections.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          photos: {
            where: photoVisibilityFilter,
            include: {
              photo: {
                select: {
                  id: true,
                  title: true,
                  urlSmall: true,
                  urlMedium: true,
                  urlLarge: true,
                },
              },
            },
          },
          _count: { select: { photos: true } }, // Include count of related photos
        },
      }),
      prisma.collections.count(),
    ]);

    res.json({
      success: true,
      data: transformCollections(collections),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const getCollectionsbySlug = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    const query = getCollectionSchema.parse(req.query);
    const { scope } = query;

    // Check authentication
    const isAuthenticated = !!(req as any).user;

    // Strict auth check for admin scope
    if (scope === 'admin' && !isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for admin scope',
      });
    }

    // Determine photo visibility filter based on scope
    let photoVisibilityFilter: any;

    if (scope === 'admin') {
      // Admin (authenticated): show ALL photos (no filter)
      photoVisibilityFilter = {};
    } else {
      // scope === 'public' (default)
      // Public + Collection only
      photoVisibilityFilter = {
        photo: {
          visibility: { in: ['PUBLIC', 'COLLECTION_ONLY'] },
        },
      };
    }

    const collection = await prisma.collections.findUnique({
      where: { slug }, //Get Collection by Slug
      include: {
        photos: {
          where: photoVisibilityFilter,
          include: {
            photo: {
              select: {
                id: true,
                title: true,
                urlSmall: true,
                urlMedium: true,
                urlLarge: true,
                tags: true,
              },
            },
          },
        },
        _count: { select: { photos: true } },
      },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    res.json({
      success: true,
      data: transformCollection(collection),
    });
  }
);

export const createCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = createCollectionSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.name);

    // check if slug already exists
    const existingCollection = await prisma.collections.findUnique({
      where: { slug },
    });

    if (existingCollection) {
      return res.status(400).json({
        success: false,
        message: "Collection with this slug already exists",
      });
    }

    const newCollection = await prisma.collections.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
      include: {
        _count: { select: { photos: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: transformCollection(newCollection),
    });
  }
);

export const updateCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = updateCollectionSchema.parse(req.body);

    const collection = await prisma.collections.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    const updatedCollection = await prisma.collections.update({
      where: { id: id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: { select: { photos: true } },
      },
    });

    res.json({
      success: true,
      data: transformCollection(updatedCollection),
    });
  }
);

export const updateCollectionBySlug = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    const data = updateCollectionSchema.parse(req.body);

    const collection = await prisma.collections.findUnique({
      where: { slug },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    const updatedCollection = await prisma.collections.update({
      where: { slug },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: { select: { photos: true } },
      },
    });

    res.json({
      success: true,
      data: transformCollection(updatedCollection),
    });
  }
);

export const deleteCollection = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const collection = await prisma.collections.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    await prisma.collections.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Collection deleted successfully",
    });
  }
);

export const deleteCollectionBySlug = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;
    console.log("slug woyyy", slug);

    const collection = await prisma.collections.findUnique({
      where: { slug },
    });

    if (!collection) {
      throw new NotFoundError("Collection not found");
    }

    await prisma.collections.delete({
      where: { slug },
    });

    res.json({
      success: true,
      message: "Collection deleted successfully",
    });
  }
);