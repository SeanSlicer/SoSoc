import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI doesn't auto-load .env — load it manually so DIRECT_URL is available
config();

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Direct URL (bypasses PgBouncer) used by Prisma Migrate
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
