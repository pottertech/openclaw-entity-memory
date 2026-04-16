import { z } from "zod";
const BoolFromString = (defaults) => z.preprocess((v) => String(v ?? "") === "true", z.boolean().default(defaults));
const EnvSchema = z.object({
    PORT: z.coerce.number().int().positive().default(4017),
    DATABASE_URL: z.string().min(1),
    NODE_ENV: z.string().default("development"),
    DEFAULT_TENANT_ID: z.string().min(1).default("tenant_default"),
    LOG_LEVEL: z.string().default("info"),
    GRAPH_BACKEND: z.string().default("in-memory"),
    GRAPH_MAX_PATHS: z.coerce.number().int().positive().default(5),
    ENABLE_OUTAGE_IMPACT_ACTIVE: BoolFromString(false),
    ENTITY_MEMORY_ROLLBACK_ENABLED: BoolFromString(true),
});
export function loadConfig() {
    const parsed = EnvSchema.parse(process.env);
    return {
        port: parsed.PORT,
        databaseUrl: parsed.DATABASE_URL,
        nodeEnv: parsed.NODE_ENV,
        defaultTenantId: parsed.DEFAULT_TENANT_ID,
        logLevel: parsed.LOG_LEVEL,
        graphBackend: parsed.GRAPH_BACKEND,
        graphMaxPaths: parsed.GRAPH_MAX_PATHS,
        enableOutageImpactActive: parsed.ENABLE_OUTAGE_IMPACT_ACTIVE,
        entityMemoryRollbackEnabled: parsed.ENTITY_MEMORY_ROLLBACK_ENABLED,
    };
}
