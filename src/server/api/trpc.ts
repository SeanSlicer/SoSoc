import { initTRPC, TRPCError } from "@trpc/server";
import { parse } from "cookie";
import superjson from "superjson";
import { ZodError } from "zod";
import { verifyAuth } from "~/../lib/client/auth";
import { prisma } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
    resHeaders: new Headers(),
    db: prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

function extractToken(ctx: Context) {
  return parse(ctx.headers.get("cookie") ?? "")["user-token"];
}

const isAuthenticated = t.middleware(({ ctx, next }) => {
  const token = extractToken(ctx);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });

  let payload: ReturnType<typeof verifyAuth>;
  try {
    payload = verifyAuth(token);
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  }

  return next({
    ctx: {
      ...ctx,
      userId: payload.sub,
      role: payload.role,
      adminId: payload.imp, // defined only when an admin is impersonating
    },
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  const token = extractToken(ctx);
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });

  let payload: ReturnType<typeof verifyAuth>;
  try {
    payload = verifyAuth(token);
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  }

  if (payload.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }

  return next({
    ctx: { ...ctx, userId: payload.sub, role: payload.role, adminId: payload.imp },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const userProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
