import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

import { env } from "~/env";

/**
 * Build explicit pg Pool config from DATABASE_URL.
 *
 * Supabase's PgBouncer pooler (port 6543) requires the username to be in the
 * format `postgres.PROJECT_REF`. Prisma v6 injected this automatically via the
 * `?pgbouncer=true` hint; with the raw pg adapter we have to do it ourselves.
 *
 * We pass fields explicitly (not connectionString) to avoid any URL re-encoding
 * of the dot in the username — a previous attempt using toString() failed on
 * Vercel with "Tenant or user not found".
 */
function buildPoolConfig(): PoolConfig {
  const pooler = new URL(env.DATABASE_URL.trim());
  const direct = new URL(env.DIRECT_URL.trim());

  let user = decodeURIComponent(pooler.username).trim();
  // Supabase pooler requires postgres.PROJECT_REF. Direct URL hostname is
  // either db.PROJECT_REF.supabase.co (legacy) or PROJECT_REF.supabase.co.
  if (pooler.hostname.includes("pooler.supabase.com") && !user.includes(".")) {
    const parts = direct.hostname.split(".");
    const projectRef = parts[0] === "db" ? parts[1] : parts[0];
    if (projectRef) user = `${user}.${projectRef}`;
  }

  return {
    host: pooler.hostname.trim(),
    port: pooler.port ? Number(pooler.port) : 5432,
    user,
    password: decodeURIComponent(pooler.password),
    database: pooler.pathname.replace(/^\//, "").trim() || "postgres",
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 1,
  };
}

const createPrismaClient = () => {
  const cfg = buildPoolConfig();
  if (env.NODE_ENV === "production") {
    // Diagnostic: appears once per cold start in Vercel logs. No password logged.
    console.log("[db] pool config", {
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      database: cfg.database,
      ssl: !!cfg.ssl,
    });
  }
  const pool = new Pool(cfg);
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
