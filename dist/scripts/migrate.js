import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { loadConfig } from "../src/config/index.js";
const { Client } = pg;
async function main() {
    const config = loadConfig();
    const client = new Client({
        connectionString: config.databaseUrl,
    });
    await client.connect();
    try {
        const migrationPath = path.resolve(process.cwd(), "src/db/postgres/migrations/0001_init_entity_memory.sql");
        const sql = await fs.readFile(migrationPath, "utf8");
        await client.query(sql);
        console.log("migration applied");
    }
    finally {
        await client.end();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
