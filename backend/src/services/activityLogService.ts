import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { activityLog, user } from "../db/schema.ts";

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

  await db.insert(activityLog).values({
    userId: normalizedUserId,
    action,
    details,
  });
}

export async function listActivityLogs(limit = 200): Promise<ActivityLogItem[]> {
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

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp,
    user: row.fullName || row.email || "System",
  }));
}
