import pg from "pg";
import type { AppConfig } from "../../config/index.js";

const { Pool } = pg;

export function createPgPool(config: AppConfig): pg.Pool {
  return new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
}