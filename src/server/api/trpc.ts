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

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const token = parse(ctx.headers.get("cookie") ?? "")["user-token"];

  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not signed in" });
  }

  let verifiedToken: ReturnType<typeof verifyAuth>;
  try {
    verifiedToken = verifyAuth(token);
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expired" });
  }

  return next({ ctx: { ...ctx, userId: verifiedToken.sub } });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const userProcedure = t.procedure.use(isAuthenticated);
