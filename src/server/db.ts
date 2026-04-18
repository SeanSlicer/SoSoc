import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "~/env";

/**
 * Strip Prisma-specific query params that pg doesn't understand and would
 * cause the connection to be rejected by PgBouncer or Postgres.
 */
function cleanConnectionString(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.delete("connection_limit");
  return parsed.toString();
}

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: cleanConnectionString(env.DATABASE_URL),
    // Supabase requires SSL in production; rejectUnauthorized: false accepts
    // the self-signed cert used by the PgBouncer pooler.
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
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
