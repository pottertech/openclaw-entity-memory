type CandidateEdge = {
  xid: string;
  conflictKey: string | null;
  authorityRank: number;
  confidence: number;
  validFrom: string | null;
  validTo: string | null;
  createdAt: string;
  conflictStatus: string;
};

export class ConflictResolutionService {
  choosePreferredEdges(edges: CandidateEdge[]): CandidateEdge[] {
    const grouped = new Map<string, CandidateEdge[]>();
    const passthrough: CandidateEdge[] = [];

    for (const edge of edges) {
      if (!edge.conflictKey) {
        passthrough.push(edge);
        continue;
      }

      const group = grouped.get(edge.conflictKey) ?? [];
      group.push(edge);
      grouped.set(edge.conflictKey, group);
    }

    const winners: CandidateEdge[] = [];

    for (const [, group] of grouped) {
      const eligible = group.filter((edge) => edge.conflictStatus === "active");

      if (eligible.length === 0) {
        continue;
      }

      eligible.sort((a, b) => {
        if (b.authorityRank !== a.authorityRank) {
          return b.authorityRank - a.authorityRank;
        }

        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      winners.push(eligible[0]);
    }

    return [...passthrough, ...winners];
  }
}