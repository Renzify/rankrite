import jwt from "jsonwebtoken";
import type { Response } from "express";
import { ENV } from "./env.ts";

const JWT_COOKIE_NAME = "jwt";
const TOKEN_EXPIRY_DAYS = 7;
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

function buildTokenCookieOptions() {
  return {
    maxAge: TOKEN_EXPIRY_MS,
    httpOnly: true,
    sameSite: "strict" as const,
    secure: ENV.NODE_ENV === "development" ? false : true,
    path: "/",
  };
}

export const generateToken = (userId: string, res: Response) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });

  res.cookie(JWT_COOKIE_NAME, token, buildTokenCookieOptions());

  return token;
};

export const clearTokenCookie = (res: Response) => {
  const cookieOptions = buildTokenCookieOptions();

  res.cookie(JWT_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0,
  });
};
