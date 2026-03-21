import { Router } from "express";
import {
  getJudgeAccessContextController,
  submitJudgeAccessScoreController,
} from "../controllers/judgeAccessController.ts";

const router = Router();

router.get("/judge-access/context", getJudgeAccessContextController);
router.post("/judge-access/score", submitJudgeAccessScoreController);

export default router;
