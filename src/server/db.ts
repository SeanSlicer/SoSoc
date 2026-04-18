import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "~/env";

const createPrismaClient = () => {
  // Use the direct URL (not the PgBouncer pooler) — the pooler requires the
  // username format postgres.PROJECT_REF which pg doesn't handle automatically.
  // Direct connections use plain postgres credentials and SSL.
  const pool = new Pool({
    connectionString: env.DIRECT_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 1, // one connection per serverless instance keeps Supabase within limits
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
