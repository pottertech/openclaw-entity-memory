import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4017),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.string().default("development"),
  DEFAULT_TENANT_ID: z.string().min(1).default("tenant_default"),
  LOG_LEVEL: z.string().default("info"),
});

export type AppConfig = {
  port: number;
  databaseUrl: string;
  nodeEnv: string;
  defaultTenantId: string;
  logLevel: string;
};

export function loadConfig(): AppConfig {
  const parsed = EnvSchema.parse(process.env);

  return {
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    nodeEnv: parsed.NODE_ENV,
    defaultTenantId: parsed.DEFAULT_TENANT_ID,
    logLevel: parsed.LOG_LEVEL,
  };
}