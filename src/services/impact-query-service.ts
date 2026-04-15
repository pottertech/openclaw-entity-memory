import { EntityService } from "./entity-service.js";
import { EdgeRepository } from "../db/postgres/repositories/edge-repository.js";
import { EntityRepository } from "../db/postgres/repositories/entity-repository.js";
import { AccessAwareTraversalService } from "./access-aware-traversal-service.js";
import { AuthorityService } from "./authority-service.js";
import { ProvenanceService } from "./provenance-service.js";

export class ImpactQueryService {
  constructor(
    private readonly entityService: EntityService,
    private readonly entityRepository: EntityRepository,
    private readonly traversalService: AccessAwareTraversalService,
    private readonly edgeRepository: EdgeRepository,
    private readonly authorityService: AuthorityService,
    private readonly provenanceService: ProvenanceService,
  ) {}

  async query(request: {
    tenantId: string;
    source: { name?: string; xid?: string };
    targetTypes?: string[];
    maxDepth?: number;
    asOf?: string;
    actor?: { subjectType?: string; subjectId?: string };
    minAuthorityTier?: string;
  }): Promise<{
    source: { xid: string; canonicalName: string; entityType: string };
    affected: Array<{
      entity: { xid: string; canonicalName: string; entityType: string };
      path: Array<{ from: string; edge: string; to: string }>;
      evidence: Array<{ edgeXid: string; documentXid: string | null; chunkXid: string | null }>;
    }>;
    explanation: {
      exclusions: Array<{
        kind: "edge" | "entity" | "path" | "document" | "evidence";
        id: string;
        reason:
          | "entity_acl_denied"
          | "edge_acl_deny"
          | "document_acl_denied"
          | "authority_below_threshold"
          | "temporal_window_excluded"
          | "conflict_loser"
          | "missing_entity"
          | "missing_evidence"
          | "unknown";
        detail?: string;
      }>;
    };
  }> {
    const maxDepth = request.maxDepth ?? 3;
    const minAuthorityRank = await this.authorityService.getMinimumRank(
      request.minAuthorityTier,
    );

    const sourceXid =
      request.source.xid ??
      (request.source.name
        ? (await this.entityService.resolveEntity(
            request.tenantId,
            request.source.name,
            request.actor,
          ))?.match.xid
        : undefined);

    if (!sourceXid) {
      throw new Error("could not resolve source entity");
    }

    const sourceEntity = await this.entityRepository.getByXid(request.tenantId, sourceXid);
    if (!sourceEntity) {
      throw new Error("source entity not found");
    }

    const allEntities = await this.entityRepository.listByTenant(request.tenantId);
    const targetTypes = new Set(request.targetTypes ?? []);

    const affected: Array<{
      entity: { xid: string; canonicalName: string; entityType: string };
      path: Array<{ from: string; edge: string; to: string }>;
      evidence: Array<{ edgeXid: string; documentXid: string | null; chunkXid: string | null }>;
    }> = [];

    const explanationExclusions = [...this.traversalService.getExplanations()];

    for (const entity of allEntities) {
      if (entity.xid === sourceXid) {
        continue;
      }

      if (targetTypes.size > 0 && !targetTypes.has(entity.entityType)) {
        continue;
      }

      const forwardPath = await this.traversalService.findPathByResolvedIds({
        tenantId: request.tenantId,
        fromXid: entity.xid,
        toXid: sourceXid,
        maxDepth,
        asOf: request.asOf,
        minAuthorityRank,
        actor: request.actor,
      });

      if (!forwardPath) {
        continue;
      }

      const evidence: Array<{
        edgeXid: string;
        documentXid: string | null;
        chunkXid: string | null;
      }> = [];

      for (const hop of forwardPath) {
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

      affected.push({
        entity: {
          xid: entity.xid,
          canonicalName: entity.canonicalName,
          entityType: entity.entityType,
        },
        path: forwardPath.map((hop) => ({
          from: hop.from,
          edge: hop.edge,
          to: hop.to,
        })),
        evidence,
      });
    }

    return {
      source: {
        xid: sourceEntity.xid,
        canonicalName: sourceEntity.canonicalName,
        entityType: sourceEntity.entityType,
      },
      affected,
      explanation: {
        exclusions: explanationExclusions,
      },
    };
  }
}