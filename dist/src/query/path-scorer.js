export class PathScorer {
    scorePath(hops) {
        if (hops.length === 0) {
            return {
                hops,
                totalScore: 0,
                visibleEvidenceCount: 0,
                hiddenEvidenceCount: 0,
                averageAuthorityRank: 0,
                averageConfidence: 0,
            };
        }
        const visibleEvidenceCount = hops.reduce((sum, hop) => sum + hop.evidenceVisibleCount, 0);
        const hiddenEvidenceCount = hops.reduce((sum, hop) => sum + hop.evidenceHiddenCount, 0);
        const averageAuthorityRank = hops.reduce((sum, hop) => sum + hop.edgeAuthorityRank, 0) / hops.length;
        const averageConfidence = hops.reduce((sum, hop) => sum + hop.confidence, 0) / hops.length;
        const evidenceScore = visibleEvidenceCount * 5 - hiddenEvidenceCount * 3;
        const authorityScore = averageAuthorityRank * 2;
        const confidenceScore = averageConfidence * 10;
        const pathLengthPenalty = Math.max(0, hops.length - 1) * 1.5;
        const totalScore = evidenceScore + authorityScore + confidenceScore - pathLengthPenalty;
        return {
            hops,
            totalScore,
            visibleEvidenceCount,
            hiddenEvidenceCount,
            averageAuthorityRank,
            averageConfidence,
        };
    }
    chooseBest(paths) {
        if (paths.length === 0) {
            return null;
        }
        const ordered = [...paths].sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            if (b.visibleEvidenceCount !== a.visibleEvidenceCount) {
                return b.visibleEvidenceCount - a.visibleEvidenceCount;
            }
            if (b.averageAuthorityRank !== a.averageAuthorityRank) {
                return b.averageAuthorityRank - a.averageAuthorityRank;
            }
            return b.averageConfidence - a.averageConfidence;
        });
        return ordered[0];
    }
}
