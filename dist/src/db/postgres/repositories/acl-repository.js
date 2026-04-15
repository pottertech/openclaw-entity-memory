export class AclRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async hasAccess(input) {
        const result = await this.pool.query(`
      SELECT 1
      FROM acl_bindings
      WHERE tenant_id = $1
        AND subject_type = $2
        AND subject_id = $3
        AND resource_type = $4
        AND resource_id = $5
        AND permission = $6
      LIMIT 1
      `, [
            input.tenantId,
            input.subjectType,
            input.subjectId,
            input.resourceType,
            input.resourceId,
            input.permission,
        ]);
        return (result.rowCount ?? 0) > 0;
    }
}
