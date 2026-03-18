import { drizzle } from "drizzle-orm/node-postgres";
import { Connection, Pool } from "pg";
import * as schema from "./schema.ts";
import { ENV } from "../lib/env.ts";

const { DATABASE_URL } = ENV;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}
const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on("connect", () => {
  console.log("Successfully connected to database");
});

pool.on("error", () => {
  console.error("Failed to connect to database");
});

async function ensureSettingsAndActivityLogSchema() {
  try {
    await pool.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS gender
    `);

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error("Failed to ensure settings/activity log schema:", error);
  }
}

void ensureSettingsAndActivityLogSchema();

export const db = drizzle({ client: pool, schema });
