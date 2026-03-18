import type { Request, Response } from "express";
import {
  deleteAccountById,
  getSettingsProfileById,
  login as loginUser,
  updateSettingsPassword,
  updateSettingsProfile,
  signup as signupUser,
  type LoginInput,
  type SignupInput,
  type AuthUser,
  type SettingsProfile,
  type UpdatePasswordInput,
  type UpdateProfileInput,
} from "../services/authService.ts";
import { createActivityLogEntry } from "../services/activityLogService.ts";
import { clearTokenCookie, generateToken } from "../lib/utils.ts";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

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

function serializeSettingsProfile(profile: SettingsProfile) {
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    profilePic: profile.profilePic,
    passwordUpdatedAt: profile.passwordUpdatedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function signupController(req: Request, res: Response) {
  try {
    const payload = req.body as SignupInput;
    const createdUser = await signupUser(payload);
    clearTokenCookie(res);
    await createActivityLogEntry({
      userId: createdUser.id,
      action: "Sign Up",
      details: "Created a new account",
    });

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

    if (error instanceof Error && error.message === "PROFILE_PIC_TOO_LARGE") {
      return res.status(413).json({
        message: "Profile photo is too large",
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
    await createActivityLogEntry({
      userId: authenticatedUser.id,
      action: "Login",
      details: "Logged into the system",
    });

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

export function checkAuthController(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  res.status(200).json(serializeAuthUser(authReq.user));
}

export function logoutController(_req: Request, res: Response) {
  clearTokenCookie(res);
  res.status(200).json({
    message: "Logged out successfully",
  });
}

export async function getSettingsProfileController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const settingsProfile = await getSettingsProfileById(userId);

    if (!settingsProfile) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(serializeSettingsProfile(settingsProfile));
  } catch (error) {
    console.error("Error in get settings profile controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateSettingsProfileController(
  req: Request,
  res: Response,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const payload = req.body as UpdateProfileInput;
    const updatedProfile = await updateSettingsProfile(userId, payload);
    await createActivityLogEntry({
      userId,
      action: "Update Profile",
      details: "Updated account profile details",
    });

    res.status(200).json(serializeSettingsProfile(updatedProfile));
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return res.status(400).json({
        message: "Full name and email are required",
      });
    }

    if (error instanceof Error && error.message === "INVALID_EMAIL_FORMAT") {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (error instanceof Error && error.message === "PROFILE_PIC_TOO_LARGE") {
      return res.status(413).json({
        message: "Profile photo is too large",
      });
    }

    console.error("Error in update settings profile controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function updateSettingsPasswordController(
  req: Request,
  res: Response,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const payload = req.body as UpdatePasswordInput;
    const passwordUpdatedAt = await updateSettingsPassword(userId, payload);
    await createActivityLogEntry({
      userId,
      action: "Change Password",
      details: "Updated account password",
    });

    res.status(200).json({
      message: "Password updated successfully",
      passwordUpdatedAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    if (error instanceof Error && error.message === "PASSWORD_MISMATCH") {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    if (error instanceof Error && error.message === "PASSWORD_TOO_SHORT") {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (error instanceof Error && error.message === "INVALID_CURRENT_PASSWORD") {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.error("Error in update settings password controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function deleteSettingsAccountController(
  req: Request,
  res: Response,
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await createActivityLogEntry({
      userId,
      action: "Delete Account",
      details: "Deleted account",
    });

    await deleteAccountById(userId);
    clearTokenCookie(res);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.error("Error in delete account controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
