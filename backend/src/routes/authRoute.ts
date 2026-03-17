import { Router } from "express";
import {
  checkAuthController,
  getSettingsProfileController,
  loginController,
  logoutController,
  signupController,
  updateSettingsPasswordController,
  updateSettingsProfileController,
} from "../controllers/authController.ts";
import { protectRoute } from "../middlewares/authMiddleware.ts";

const router = Router();

router.get("/auth/check", protectRoute, checkAuthController);
router.get("/auth/settings", protectRoute, getSettingsProfileController);
router.put("/auth/settings/profile", protectRoute, updateSettingsProfileController);
router.put(
  "/auth/settings/password",
  protectRoute,
  updateSettingsPasswordController,
);
router.post("/auth/signup", signupController);
router.post("/auth/login", loginController);
router.post("/auth/logout", logoutController);

export default router;
