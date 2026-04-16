import { DefaultSemanticBridge } from "../query/semantic-bridge.js";
import { PathScorer } from "../query/path-scorer.js";
const CAPITALIZED_PHRASE_REGEX = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
export class HybridQueryService {
    entityService;
    traversalService;
    edgeRepository;
    authorityService;
    provenanceService;
    semanticBridge = new DefaultSemanticBridge();
    pathScorer = new PathScorer();
    constructor(entityService, traversalService, edgeRepository, authorityService, provenanceService) {
        this.entityService = entityService;
        this.traversalService = traversalService;
        this.edgeRepository = edgeRepository;
        this.authorityService = authorityService;
        this.provenanceService = provenanceService;
    }
    async query(request) {
        const minAuthorityRank = await this.authorityService.getMinimumRank(request.minAuthorityTier);
        const normalizedCandidates = this.semanticBridge.normalizeCandidates((request.semanticCandidates ?? []).map((item) => ({
            documentXid: item.documentXid,
            chunkXid: item.chunkXid,
            text: item.text,
        })));
        const candidateNames = this.extractCandidateNames(request.question, normalizedCandidates.map((item) => item.text));
        const resolved = [];
        for (const candidate of candidateNames) {
            const match = await this.entityService.resolveEntity(request.tenantId, candidate, request.actor);
            if (!match) {
                continue;
            }
            if (!resolved.some((item) => item.xid === match.match.xid)) {
                resolved.push({
                    xid: match.match.xid,
                    entityType: match.match.entityType,
                    canonicalName: match.match.canonicalName,
                });
            }
        }
        // Multi-path search with scoring
        const candidatePaths = [];
        for (let i = 0; i < resolved.length; i += 1) {
            for (let j = i + 1; j < resolved.length; j += 1) {
                const paths = await this.traversalService.findTopPathsByResolvedIds({
                    tenantId: request.tenantId,
                    fromXid: resolved[i].xid,
                    toXid: resolved[j].xid,
                    maxDepth: 4,
                    maxResults: 5,
                    asOf: request.asOf,
                    minAuthorityRank,
                    actor: request.actor,
                });
                for (const path of paths) {
                    const scoredHops = [];
                    for (const hop of path) {
                        const visible = await this.provenanceService.getVisibleEdgeProvenance({
                            tenantId: request.tenantId,
                            edgeXid: hop.edgeXid,
                            actor: request.actor,
                        });
                        const authorityRank = visible.provenance[0]?.edgeAuthorityTier === "critical"
                            ? 40
                            : visible.provenance[0]?.edgeAuthorityTier === "high"
                                ? 30
                                : visible.provenance[0]?.edgeAuthorityTier === "standard"
                                    ? 20
                                    : 10;
                        scoredHops.push({
                            edgeXid: hop.edgeXid,
                            edgeType: hop.edge,
                            from: hop.from,
                            to: hop.to,
                            edgeAuthorityRank: authorityRank,
                            evidenceVisibleCount: visible.provenance.length,
                            evidenceHiddenCount: visible.exclusions.length,
                            confidence: hop.score ?? 1,
                        });
                    }
                    candidatePaths.push({
                        rawPath: path,
                        scored: this.pathScorer.scorePath(scoredHops),
                    });
                }
            }
        }
        const bestScored = this.pathScorer.chooseBest(candidatePaths.map((item) => item.scored));
        const bestPath = bestScored
            ? candidatePaths.find((item) => item.scored.totalScore === bestScored.totalScore)?.rawPath ?? null
            : null;
        const evidence = [];
        const explanationExclusions = [
            ...this.traversalService.getExplanations(),
        ];
        if (bestPath) {
            for (const hop of bestPath) {
                const visible = await this.provenanceService.getVisibleEdgeProvenance({
                    tenantId: request.tenantId,
                    edgeXid: hop.edgeXid,
                    actor: request.actor,
                });
                for (const ev of visible.provenance) {
                    evidence.push({
                        edgeXid: hop.edgeXid,
                        documentXid: ev.documentXid,
                        chunkXid: ev.chunkXid,
                    });
                }
                explanationExclusions.push(...visible.exclusions);
            }
        }
        return {
            answer: bestPath ? "Yes" : "No clear relationship path found",
            confidence: bestPath ? "high" : "low",
            entities: resolved,
            path: (bestPath ?? []).map((hop) => ({
                from: hop.from,
                edge: hop.edge,
                to: hop.to,
            })),
            evidence,
            filtersApplied: {
                tenantId: request.tenantId,
                acl: true,
                asOf: request.asOf ?? null,
                minAuthorityTier: request.minAuthorityTier ?? null,
                pathScore: bestScored?.totalScore ?? null,
                visibleEvidenceCount: bestScored?.visibleEvidenceCount ?? 0,
                hiddenEvidenceCount: bestScored?.hiddenEvidenceCount ?? 0,
            },
            explanation: {
                exclusions: explanationExclusions,
            },
        };
    }
    extractCandidateNames(question, candidateTexts) {
        const results = new Set();
        for (const text of [question, ...candidateTexts]) {
            const matches = text.match(CAPITALIZED_PHRASE_REGEX) ?? [];
            for (const match of matches) {
                const trimmed = match.trim();
                if (trimmed.length >= 2) {
                    results.add(trimmed);
                }
            }
        }
        return [...results];
    }
}
