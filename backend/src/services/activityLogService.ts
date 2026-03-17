import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { activityLog, event, user } from "../db/schema.ts";

type CreateActivityLogInput = {
  userId?: string | null;
  action: string;
  details: string;
};

export type ActivityLogItem = {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: Date;
};

export async function createActivityLogEntry(
  input: CreateActivityLogInput,
): Promise<void> {
  const action = (input.action ?? "").trim();
  const details = (input.details ?? "").trim();
  const normalizedUserId = (input.userId ?? "").trim() || null;

  if (!action || !details) {
    return;
  }

  try {
    await db.insert(activityLog).values({
      userId: normalizedUserId,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to create activity log entry:", error);
  }
}

export async function listActivityLogs(limit = 200): Promise<ActivityLogItem[]> {
  try {
    const rows = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        details: activityLog.details,
        timestamp: activityLog.createdAt,
        fullName: user.fullName,
        email: user.email,
      })
      .from(activityLog)
      .leftJoin(user, eq(activityLog.userId, user.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    if (rows.length > 0) {
      return rows.map((row) => ({
        id: row.id,
        action: row.action,
        details: row.details,
        timestamp: row.timestamp,
        user: row.fullName || row.email || "System",
      }));
    }
  } catch (error) {
    console.error("Failed to list activity logs:", error);
  }

  try {
    const fallbackEventRows = await db
      .select({
        id: event.id,
        title: event.title,
        timestamp: event.createdAt,
        fullName: user.fullName,
        email: user.email,
      })
      .from(event)
      .leftJoin(user, eq(event.createdByUserId, user.id))
      .orderBy(desc(event.createdAt))
      .limit(limit);

    return fallbackEventRows.map((row) => ({
      id: row.id,
      action: "Create Event",
      details: `Created event: ${row.title}`,
      timestamp: row.timestamp,
      user: row.fullName || row.email || "System",
    }));
  } catch (error) {
    console.error("Failed to load fallback activity logs:", error);
    return [];
  }
}
