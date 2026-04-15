import { Router as createRouter } from "express";
import fs from "node:fs/promises";
import path from "node:path";
export function createSourceHealthRouter() {
    const router = createRouter();
    router.get("/source-health/case-pack", async (_req, res) => {
        const casePackFile = process.env.REAL_CASE_PACK_FILE ??
            "tests/fixtures/generated-real-case-pack.json";
        const fullPath = path.resolve(process.cwd(), casePackFile);
        try {
            const stat = await fs.stat(fullPath);
            const raw = await fs.readFile(fullPath, "utf8");
            const json = JSON.parse(raw);
            res.json({
                ok: true,
                file: casePackFile,
                updatedAt: stat.mtime.toISOString(),
                caseCount: Array.isArray(json) ? json.length : 0,
            });
        }
        catch (error) {
            res.status(500).json({
                ok: false,
                file: casePackFile,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
    return router;
}
