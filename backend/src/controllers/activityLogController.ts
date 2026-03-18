import type { Request, Response } from "express";
import { listActivityLogsByUser } from "../services/activityLogService.ts";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

export async function listActivityLogsController(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const activityLogs = await listActivityLogsByUser(userId);
    res.status(200).json(activityLogs);
  } catch (error) {
    console.error("Error in list activity logs controller:", error);
    res.status(500).json({
      message: "Failed to load activity logs",
    });
  }
}
