import type { Request, Response } from "express";
import { listActivityLogs } from "../services/activityLogService.ts";

export async function listActivityLogsController(_req: Request, res: Response) {
  try {
    const activityLogs = await listActivityLogs();
    res.status(200).json(activityLogs);
  } catch (error) {
    console.error("Error in list activity logs controller:", error);
    res.status(500).json({
      message: "Failed to load activity logs",
    });
  }
}
