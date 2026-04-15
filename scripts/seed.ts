import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { loadConfig } from "../src/config/index.js";

const { Client } = pg;

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new Client({
    connectionString: config.databaseUrl,
  });

  await client.connect();

  try {
    const seedPath = path.resolve(
      process.cwd(),
      "tests/fixtures/seed_alice_atlas_pg.sql",
    );

    const sql = await fs.readFile(seedPath, "utf8");
    await client.query(sql);

    console.log("seed applied");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});