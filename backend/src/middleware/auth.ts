import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  file?: Express.Multer.File;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      res.status(401).json({
        message: "Authorization header missing"
      });
      return;
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      res.status(401).json({
        message: "Authorization format must be Bearer <token>"
      });
      return;
    }

    const payload = verifyToken(token);

    req.userId = payload.userId;

    next();
  } catch {
    res.status(401).json({
      message: "Invalid or expired token"
    });
    return;
  }
}
