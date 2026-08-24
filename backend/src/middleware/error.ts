import { NextFunction, Request, Response } from "express";
import multer from "multer";

export function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File exceeds the 50 MB limit"
      });
    }

    return res.status(400).json({
      message: error.message
    });
  }

  if (error?.message?.startsWith("Unsupported file type")) {
    return res.status(415).json({
      message: error.message
    });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({
      message: "A record with this unique value already exists."
    });
  }

  return res.status(500).json({
    message: "Internal server error"
  });
}
