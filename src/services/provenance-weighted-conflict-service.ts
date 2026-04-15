type ProvenanceAwareEdge = {
  xid: string;
  conflictKey: string | null;
  authorityRank: number;
  confidence: number;
  visibleEvidenceCount: number;
  hiddenEvidenceCount: number;
  createdAt: string;
  conflictStatus: string;
};

export class ProvenanceWeightedConflictService {
  choosePreferredEdges(edges: ProvenanceAwareEdge[]): ProvenanceAwareEdge[] {
    const grouped = new Map<string, ProvenanceAwareEdge[]>();
    const passthrough: ProvenanceAwareEdge[] = [];

    for (const edge of edges) {
      if (!edge.conflictKey) {
        passthrough.push(edge);
        continue;
      }

      const group = grouped.get(edge.conflictKey) ?? [];
      group.push(edge);
      grouped.set(edge.conflictKey, group);
    }

    const winners: ProvenanceAwareEdge[] = [];

    for (const [, group] of grouped) {
      const eligible = group.filter((edge) => edge.conflictStatus === "active");

      if (eligible.length === 0) {
        continue;
      }

      eligible.sort((a, b) => {
        if (b.visibleEvidenceCount !== a.visibleEvidenceCount) {
          return b.visibleEvidenceCount - a.visibleEvidenceCount;
        }

        if (b.authorityRank !== a.authorityRank) {
          return b.authorityRank - a.authorityRank;
        }

        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }

        if (a.hiddenEvidenceCount !== b.hiddenEvidenceCount) {
          return a.hiddenEvidenceCount - b.hiddenEvidenceCount;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      winners.push(eligible[0]);
    }

    return [...passthrough, ...winners];
  }
}