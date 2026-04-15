import { Router as createRouter } from "express";
export function registerHealthRoutes(router, pool) {
    router.get("/health", (_req, res) => {
        res.json({ ok: true });
    });
    router.get("/ready", async (_req, res) => {
        try {
            await pool.query("SELECT 1");
            res.json({
                ok: true,
                postgres: "up",
                graph_adapter: "up",
            });
        }
        catch (error) {
            res.status(503).json({
                ok: false,
                postgres: "down",
                graph_adapter: "unknown",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
}
export function createHealthRouter(pool) {
    const router = createRouter();
    registerHealthRoutes(router, pool);
    return router;
}
