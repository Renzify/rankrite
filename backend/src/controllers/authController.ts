import type { Request, Response } from "express";
import {
  login as loginUser,
  signup as signupUser,
  type LoginInput,
  type SignupInput,
  type AuthUser,
} from "../services/authService.ts";
import { clearTokenCookie, generateToken } from "../lib/utils.ts";

function serializeAuthUser(user: AuthUser) {
  // Keep `_id` for compatibility with old frontend payloads.
  return {
    id: user.id,
    _id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
  };
}

export async function signupController(req: Request, res: Response) {
  try {
    const payload = req.body as SignupInput;
    const createdUser = await signupUser(payload);
    clearTokenCookie(res);

    res.status(201).json(serializeAuthUser(createdUser));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EMAIL_FORMAT") {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (error instanceof Error && error.message === "PASSWORD_MISMATCH") {
      return res.status(400).json({
        message: "Password and confirm password do not match",
      });
    }

    if (error instanceof Error && error.message === "PASSWORD_TOO_SHORT") {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    console.error("Error in signup controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const payload = req.body as LoginInput;
    const authenticatedUser = await loginUser(payload);
    generateToken(authenticatedUser.id, res);

    res.status(200).json(serializeAuthUser(authenticatedUser));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    console.error("Error in login controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export function logoutController(_req: Request, res: Response) {
  clearTokenCookie(res);
  res.status(200).json({
    message: "Logged out successfully",
  });
}
