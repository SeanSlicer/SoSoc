import { initTRPC, TRPCError } from "@trpc/server";
import { parse } from "cookie";
import superjson from "superjson";
import { ZodError } from "zod";
import { verifyAuth } from "~/../lib/client/auth";
import { prisma } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
    resHeaders: new Headers(),
    db: prisma,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 */
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

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  return result;
});

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const cookieHeader = ctx.headers.get("cookie") ?? "";
  const parsedCookies = parse(cookieHeader);
  const token = parsedCookies["user-token"];

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing user token",
    });
  }

  const verifiedToken = verifyAuth(token);

  if (!verifiedToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid user token",
    });
  }

  return next({ ctx: { ...ctx, userId: verifiedToken.sub } });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(timingMiddleware);
export const userProcedure = t.procedure.use(isAuthenticated);
