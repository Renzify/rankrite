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

export const db = drizzle({ client: pool, schema });
