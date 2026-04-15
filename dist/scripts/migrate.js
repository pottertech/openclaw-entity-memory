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
        const migrationsDir = path.resolve(process.cwd(), "src/db/postgres/migrations");
        const files = await fs.readdir(migrationsDir);
        const sorted = files
            .filter((f) => f.endsWith(".sql"))
            .sort();
        for (const file of sorted) {
            const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
            await client.query(sql);
            console.log(`applied: ${file}`);
        }
        console.log("all migrations applied");
    }
    finally {
        await client.end();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
