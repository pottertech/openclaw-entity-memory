import pg from "pg";
const { Pool } = pg;
export function createPgPool(config) {
    return new Pool({
        connectionString: config.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30_000,
    });
}
