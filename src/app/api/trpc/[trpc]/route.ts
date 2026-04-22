import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { applyCorsHeaders, corsPreflight } from "~/lib/server/cors";

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = async (req: NextRequest) => {
  const origin = req.headers.get("origin");

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    responseMeta({ ctx }) {
      if (ctx?.resHeaders) {
        return { headers: ctx.resHeaders };
      }
      return {};
    },
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

  applyCorsHeaders(response.headers, origin);
  return response;
};

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req.headers.get("origin"));
}

export { handler as GET, handler as POST };
