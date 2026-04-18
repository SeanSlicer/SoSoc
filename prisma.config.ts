import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Direct URL (bypasses PgBouncer) used by Prisma Migrate
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
