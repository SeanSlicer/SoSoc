import { userRouter } from "~/server/api/routers/user";
import { postRouter } from "~/server/api/routers/post";
import { notificationRouter } from "~/server/api/routers/notification";
import { adminRouter } from "~/server/api/routers/admin";
import { messagesRouter } from "~/server/api/routers/messages";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  user: userRouter,
  post: postRouter,
  notification: notificationRouter,
  admin: adminRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
