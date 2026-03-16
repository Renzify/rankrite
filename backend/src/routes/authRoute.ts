import { Router } from "express";
import {
  checkAuthController,
  loginController,
  logoutController,
  signupController,
} from "../controllers/authController.ts";
import { protectRoute } from "../middlewares/authMiddleware.ts";

const router = Router();

router.get("/auth/check", protectRoute, checkAuthController);
router.post("/auth/signup", signupController);
router.post("/auth/login", loginController);
router.post("/auth/logout", logoutController);

export default router;
