import { z } from "zod";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "qa", "production"]),
    // Data
    DATABASE_URL: z.string().min(1),
    //Auth
    JWT_SECRET_KEY: z.string().min(1),
    ADMIN_EMAIL: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // Data
    DATABASE_URL: process.env.DATABASE_URL,
    //Auth
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  },
});
