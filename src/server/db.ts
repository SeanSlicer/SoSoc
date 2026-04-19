import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { env } from "~/env";

/**
 * Build a pg-compatible connection string from DATABASE_URL.
 *
 * Supabase's PgBouncer pooler (port 6543) requires the username to be in the
 * format `postgres.PROJECT_REF`. Prisma v6 injected this automatically via the
 * `?pgbouncer=true` hint; with the raw pg adapter we have to do it ourselves.
 * We extract the project ref from DIRECT_URL which always contains it.
 *
 * Also strips Prisma-specific params that pg doesn't understand.
 */
function buildConnectionString(): string {
  const pooler = new URL(env.DATABASE_URL);
  const direct = new URL(env.DIRECT_URL);

  // Strip Prisma-only params
  pooler.searchParams.delete("pgbouncer");
  pooler.searchParams.delete("connection_limit");

  // Fix username for Supabase pooler: postgres → postgres.PROJECT_REF
  // Direct URL format: db.PROJECT_REF.supabase.co
  if (pooler.hostname.includes("pooler.supabase.com") && !pooler.username.includes(".")) {
    const projectRef = direct.hostname.split(".")[1]; // "db.PROJECT_REF.supabase.co"
    if (projectRef) pooler.username = `${pooler.username}.${projectRef}`;
  }

  return pooler.toString();
}

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: buildConnectionString(),
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 1,
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
