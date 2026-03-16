import { Router } from "express";
import {
  loginController,
  logoutController,
  signupController,
} from "../controllers/authController.ts";

const router = Router();

router.post("/auth/signup", signupController);
router.post("/auth/login", loginController);
router.post("/auth/logout", logoutController);

export default router;
