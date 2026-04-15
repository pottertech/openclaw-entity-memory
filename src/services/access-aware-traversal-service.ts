import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import type { GraphAdapter, GraphEdge, GraphNode } from "../db/graph/adapter.js";
import { AclService } from "./acl-service.js";
import { EdgeAclService } from "./edge-acl-service.js";
import { ConflictResolutionService } from "./conflict-resolution-service.js";
import type { QueryExclusion } from "../types/explanations.js";

export class AccessAwareTraversalService {
  private exclusions: QueryExclusion[] = [];

  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly edgeRepository: EdgeRepository,
    private readonly graphAdapter: GraphAdapter,
    private readonly aclService: AclService,
    private readonly edgeAclService: EdgeAclService,
    private readonly conflictResolutionService: ConflictResolutionService,
  ) {}

  getExplanations(): QueryExclusion[] {
    return [...this.exclusions];
  }

  async refreshTenantGraph(input: {
    tenantId: string;
    asOf?: string;
    minAuthorityRank?: number;
    actor?: {
      subjectType?: string;
      subjectId?: string;
    };
  }): Promise<void> {
    this.exclusions = [];

    const rawEdges = await this.edgeRepository.getEdgesForTenantFiltered({
      tenantId: input.tenantId,
      asOf: input.asOf,
      minAuthorityRank: input.minAuthorityRank ?? 0,
    });

    // Record temporal/authority exclusions before conflict resolution
    const allTenantEdges = await this.edgeRepository.getAllEdgesForTenant(input.tenantId);
    const rawEdgeIds = new Set(rawEdges.map((edge) => edge.xid));

    for (const edge of allTenantEdges) {
      if (rawEdgeIds.has(edge.xid)) {
        continue;
      }

      if (input.asOf) {
        this.exclusions.push({
          kind: "edge",
          id: edge.xid,
          reason: "temporal_window_excluded",
        });
      } else if ((input.minAuthorityRank ?? 0) > 0) {
        this.exclusions.push({
          kind: "edge",
          id: edge.xid,
          reason: "authority_below_threshold",
        });
      }
    }

    const candidateEdges = rawEdges.map((edge) => ({
      ...edge,
      authorityRank: 0,
      conflictKey: (edge as any).conflict_key ?? null,
      conflictStatus: (edge as any).conflict_status ?? "active",
      createdAt: edge.created_at.toISOString(),
      confidence: Number(edge.confidence),
      validFrom: edge.valid_from ? edge.valid_from.toISOString() : null,
      validTo: edge.valid_to ? edge.valid_to.toISOString() : null,
    }));

    const winners = this.conflictResolutionService.choosePreferredEdges(candidateEdges);
    const winnerIds = new Set(winners.map((item) => item.xid));

    const visibleEdges: typeof rawEdges = [];

    for (const edge of rawEdges) {
      if (!winnerIds.has(edge.xid)) {
        this.exclusions.push({
          kind: "edge",
          id: edge.xid,
          reason: "conflict_loser",
        });
        continue;
      }

      const fromAllowed = await this.aclService.canReadEntity({
        tenantId: input.tenantId,
        subjectType: input.actor?.subjectType,
        subjectId: input.actor?.subjectId,
        entityXid: edge.from_entity_xid,
      });

      if (!fromAllowed) {
        this.exclusions.push({
          kind: "entity",
          id: edge.from_entity_xid,
          reason: "entity_acl_denied",
        });
        continue;
      }

      const toAllowed = await this.aclService.canReadEntity({
        tenantId: input.tenantId,
        subjectType: input.actor?.subjectType,
        subjectId: input.actor?.subjectId,
        entityXid: edge.to_entity_xid,
      });

      if (!toAllowed) {
        this.exclusions.push({
          kind: "entity",
          id: edge.to_entity_xid,
          reason: "entity_acl_denied",
        });
        continue;
      }

      const edgeAcl = await this.edgeAclService.canTraverseEdge({
        tenantId: input.tenantId,
        edgeXid: edge.xid,
        actor: input.actor,
      });

      if (!edgeAcl.allowed) {
        this.exclusions.push({
          kind: "edge",
          id: edge.xid,
          reason: "edge_acl_deny",
          detail: edgeAcl.reason ?? undefined,
        });
        continue;
      }

      visibleEdges.push(edge);
    }

    const nodeIds = new Set<string>();
    for (const edge of visibleEdges) {
      nodeIds.add(edge.from_entity_xid);
      nodeIds.add(edge.to_entity_xid);
    }

    const nodes: GraphNode[] = [];
    for (const xid of nodeIds) {
      const entity = await this.entityRepository.getByXid(input.tenantId, xid);
      if (!entity) {
        this.exclusions.push({
          kind: "entity",
          id: xid,
          reason: "missing_entity",
        });
        continue;
      }

      nodes.push({
        xid: entity.xid,
        name: entity.canonicalName,
        type: entity.entityType,
      });
    }

    const graphEdges: GraphEdge[] = visibleEdges.map((edge) => ({
      xid: edge.xid,
      type: edge.edge_type,
      from: edge.from_entity_xid,
      to: edge.to_entity_xid,
    }));

    await this.graphAdapter.load(nodes, graphEdges);
  }

  async findPathByResolvedIds(input: {
    tenantId: string;
    fromXid: string;
    toXid: string;
    maxDepth?: number;
    asOf?: string;
    minAuthorityRank?: number;
    actor?: {
      subjectType?: string;
      subjectId?: string;
    };
  }): Promise<
    Array<{
      from: string;
      edge: string;
      to: string;
      edgeXid: string;
    }> | null
  > {
    await this.refreshTenantGraph(input);

    const path = await this.graphAdapter.findPath(
      input.fromXid,
      input.toXid,
      input.maxDepth ?? 4,
    );

    if (!path) {
      this.exclusions.push({
        kind: "path",
        id: `${input.fromXid}->${input.toXid}`,
        reason: "unknown",
        detail: "no visible traversable path found",
      });
      return null;
    }

    const hops: Array<{
      from: string;
      edge: string;
      to: string;
      edgeXid: string;
    }> = [];

    for (const hop of path) {
      const fromEntity = await this.entityRepository.getByXid(input.tenantId, hop.from);
      const toEntity = await this.entityRepository.getByXid(input.tenantId, hop.to);

      hops.push({
        from: fromEntity?.canonicalName ?? hop.from,
        edge: hop.edgeType,
        to: toEntity?.canonicalName ?? hop.to,
        edgeXid: hop.edgeXid,
      });
    }

    return hops;
  }
}