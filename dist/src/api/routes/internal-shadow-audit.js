import { Router as createRouter } from "express";
import { z } from "zod";
const ShadowAuditWriteSchema = z.object({
    tenantId: z.string().min(1),
    queryClass: z.string().min(1),
    question: z.string().min(1),
    semanticJson: z.record(z.any()),
    hybridJson: z.record(z.any()),
    comparisonJson: z.record(z.any()),
    chosenPath: z.enum(["semantic", "hybrid"]),
    rollbackState: z.string().min(1),
});
export function createInternalShadowAuditRouter(shadowAuditService) {
    const router = createRouter();
    router.post("/internal/shadow-audit", async (req, res) => {
        const parsed = ShadowAuditWriteSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "invalid shadow audit payload",
                details: parsed.error.flatten(),
            });
            return;
        }
        await shadowAuditService.record(parsed.data);
        res.json({ ok: true });
    });
    return router;
}
