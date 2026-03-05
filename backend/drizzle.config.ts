import { defineConfig } from "drizzle-kit";
import { ENV } from "./src/lib/env.ts";

const { DATABASE_URL } = ENV;

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL!,
  },
});
