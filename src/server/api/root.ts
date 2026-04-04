import { userRouter } from "~/server/api/routers/user";
import { postRouter } from "~/server/api/routers/post";
import { notificationRouter } from "~/server/api/routers/notification";
import { adminRouter } from "~/server/api/routers/admin";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
  notification: notificationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
