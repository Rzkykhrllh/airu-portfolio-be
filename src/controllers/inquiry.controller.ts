import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../utils/erros";
import { createInquirySchema, getInquirySchema } from "../validator/inquiry.validator";

export const createInquiry = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = createInquirySchema.parse(req.body);

    // Honeypot tripped — pretend success so the bot doesn't learn anything,
    // but don't touch the database.
    if (data.company) {
      return res.status(201).json({ success: true });
    }

    await prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        projectType: data.projectType,
        message: data.message,
      },
    });

    res.status(201).json({ success: true });
  }
);

export const getInquiries = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, read } = getInquirySchema.parse(req.query);
    const skip = (page - 1) * limit;

    const where = read !== undefined ? { read } : {};

    const [inquiries, total, unreadCount] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inquiry.count({ where }),
      prisma.inquiry.count({ where: { read: false } }),
    ]);

    res.json({
      success: true,
      data: inquiries,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export const markInquiryRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const read = req.body?.read !== false;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Inquiry not found");
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: { read },
    });

    res.json({ success: true, data: updated });
  }
);

export const deleteInquiry = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError("Inquiry not found");
    }

    await prisma.inquiry.delete({ where: { id } });

    res.json({ success: true, message: "Inquiry deleted" });
  }
);
