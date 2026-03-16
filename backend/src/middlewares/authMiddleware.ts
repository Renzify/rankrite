import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.ts";
import { getAuthUserById, type AuthUser } from "../services/authService.ts";

type JwtPayload = {
  userId: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export async function protectRoute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const token = authReq.cookies?.jwt;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
      });
    }

    const { JWT_SECRET } = ENV;

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return res.status(401).json({
        message: "Unauthorized - Invalid token",
      });
    }

    if (!decoded?.userId || typeof decoded.userId !== "string") {
      return res.status(401).json({
        message: "Unauthorized - Invalid token",
      });
    }

    const authenticatedUser = await getAuthUserById(decoded.userId);

    if (!authenticatedUser) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    authReq.user = authenticatedUser;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
