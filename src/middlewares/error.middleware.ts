import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/erros";
import { success, ZodError } from "zod";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "validation failed",
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle unexpected errors
  console.log("Unexpected Error:", err);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } else {
    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
