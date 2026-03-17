import { Router } from "express";
import { listActivityLogsController } from "../controllers/activityLogController.ts";

const router = Router();

router.get("/activity-logs", listActivityLogsController);

export default router;
