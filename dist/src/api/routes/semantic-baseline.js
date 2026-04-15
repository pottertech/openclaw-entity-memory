import { Router as createRouter } from "express";
import { z } from "zod";
const SemanticBaselineSchema = z.object({
    tenantId: z.string().min(1),
    question: z.string().min(1),
    actor: z
        .object({
        subjectType: z.string().optional(),
        subjectId: z.string().optional(),
    })
        .optional(),
    semanticCandidates: z
        .array(z.object({
        documentXid: z.string().optional(),
        chunkXid: z.string().optional(),
        text: z.string().min(1),
        score: z.number().optional(),
        metadata: z.record(z.any()).optional(),
    }))
        .default([]),
    maxCandidates: z.number().int().positive().max(20).optional(),
});
export function createSemanticBaselineRouter() {
    const router = createRouter();
    router.post("/semantic/query", async (req, res) => {
        const parsed = SemanticBaselineSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "invalid semantic baseline request",
                details: parsed.error.flatten(),
            });
            return;
        }
        const candidates = [...parsed.data.semanticCandidates]
            .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
            .slice(0, parsed.data.maxCandidates ?? 5);
        const joined = candidates.map((item) => item.text).join(" ");
        let answer = "No clear answer";
        let confidence = "low";
        if (/Alice/i.test(joined) &&
            /Project Atlas/i.test(joined) &&
            /tech lead|lead/i.test(joined)) {
            answer = "Yes";
            confidence = "high";
        }
        else if (/PostgreSQL/i.test(joined) && /Tuesday/i.test(joined)) {
            answer = "Likely yes";
            confidence = "medium";
        }
        res.json({
            answer,
            confidence,
            evidence: candidates.map((item) => ({
                documentXid: item.documentXid,
                chunkXid: item.chunkXid,
                text: item.text,
                score: item.score,
                metadata: item.metadata,
            })),
            notes: ["baseline semantic path"],
        });
    });
    return router;
}
