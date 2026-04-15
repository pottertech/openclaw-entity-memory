export type KuzuBootstrapStatement = {
  name: string;
  statement: string;
};

export function buildKuzuBootstrapStatements(): KuzuBootstrapStatement[] {
  return [
    {
      name: "create_entity_table",
      statement: `
        CREATE NODE TABLE IF NOT EXISTS Entity(
          xid STRING,
          tenant_id STRING,
          entity_type STRING,
          canonical_name STRING,
          status STRING,
          PRIMARY KEY (xid)
        );
      `,
    },
    {
      name: "create_depends_on_table",
      statement: `
        CREATE REL TABLE IF NOT EXISTS DEPENDS_ON(
          FROM Entity TO Entity,
          xid STRING,
          tenant_id STRING,
          confidence DOUBLE,
          authority_tier STRING,
          conflict_key STRING,
          conflict_status STRING,
          valid_from STRING,
          valid_to STRING,
          last_observed_at STRING
        );
      `,
    },
    {
      name: "create_affected_by_table",
      statement: `
        CREATE REL TABLE IF NOT EXISTS AFFECTED_BY(
          FROM Entity TO Entity,
          xid STRING,
          tenant_id STRING,
          confidence DOUBLE,
          authority_tier STRING,
          conflict_key STRING,
          conflict_status STRING,
          valid_from STRING,
          valid_to STRING,
          last_observed_at STRING
        );
      `,
    },
    {
      name: "create_leads_table",
      statement: `
        CREATE REL TABLE IF NOT EXISTS LEADS(
          FROM Entity TO Entity,
          xid STRING,
          tenant_id STRING,
          confidence DOUBLE,
          authority_tier STRING,
          conflict_key STRING,
          conflict_status STRING,
          valid_from STRING,
          valid_to STRING,
          last_observed_at STRING
        );
      `,
    },
  ];
}