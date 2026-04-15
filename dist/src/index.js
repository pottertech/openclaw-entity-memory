import { createServer } from "./api/server.js";
import { loadConfig } from "./config/index.js";
async function main() {
    const config = loadConfig();
    const app = await createServer(config);
    app.listen(config.port, () => {
        console.log(JSON.stringify({
            level: "info",
            msg: "openclaw-entity-memory listening",
            port: config.port,
            env: config.nodeEnv,
        }));
    });
}
main().catch((error) => {
    console.error(JSON.stringify({
        level: "error",
        msg: "fatal startup error",
        error: error instanceof Error ? error.message : String(error),
    }));
    process.exit(1);
});
