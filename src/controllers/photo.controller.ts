import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/erros";
import {
  createPhotoSchema,
  getPhotoSchema,
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
              collection: true
            }
          }
        }
      }),
      prisma.photo.count({ where })
    ]);

    res.json({
      success: true,
      data: photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  
      }
);

export const getPhotoById = asyncHandler(async (
  req: Request, res: Response, next: NextFunction
) => {
  const {id} = req.params;

  const photo = await prisma.photo.findUnique({
    where: {id}, //Get Photo by Id
    include: {
      tags: true, // Include associated tags
      collections: {
        include: {
          collection: true // Include associated collections
        }
      }
    }

  })

  if (!photo){
    throw new NotFoundError('Photo not found');
  }

  res.json({
    success: true,
    data: photo
  })
})
  

