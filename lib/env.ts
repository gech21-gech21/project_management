import { z } from "zod";

const envSchema = z.object({
  // Database - Session Pooler
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),

  // NextAuth
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(1),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err) => err.path.join("."))
        .join(", ");

      console.error(
        `❌ Invalid environment variables: ${missingVars}`,
        error.issues,
      );

      if (process.env.NODE_ENV === "production") {
        throw new Error(`Missing environment variables: ${missingVars}`);
      } else {
        console.warn(
          `⚠️  Missing environment variables in development: ${missingVars}`,
        );
      }
    }

    return process.env as Env;
  }
}

export const env = validateEnv();

// Helper to check if Google OAuth is configured
export const isGoogleAuthConfigured = (): boolean => {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
};

// Helper to get database URL (with IPv4 fix)
export const getDatabaseUrl = (): string => {
  return env.DATABASE_URL;
};

// Helper to check if running in development
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === "development";
};

// Helper to check if running in production
export const isProduction = (): boolean => {
  return env.NODE_ENV === "production";
};
