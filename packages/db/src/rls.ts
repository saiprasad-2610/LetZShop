import { PrismaClient } from '@prisma/client';

/**
 * PostgreSQL Row-Level Security (RLS) Helper.
 * Serves as Defense-in-Depth alongside Application Tenant Guards and Service-Level Scoping.
 */
export async function setTenantContext(prisma: PrismaClient, tenantId: string): Promise<void> {
  // Sets session variable 'app.current_tenant_id' for RLS policies
  await prisma.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}';`);
}

/**
 * SQL script generator to apply PostgreSQL Row-Level Security policies on tenant-isolated tables.
 */
export const RLS_TABLES = [
  'stores',
  'categories',
  'products',
  'product_variants',
  'inventory',
  'customers',
  'orders',
  'enquiries',
  'merchant_payment_accounts',
  'merchant_shipping_accounts',
  'audit_logs',
];

export function generateRlsSql(): string {
  return RLS_TABLES.map((table) => `
    ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS tenant_isolation_policy ON "${table}";
    CREATE POLICY tenant_isolation_policy ON "${table}"
      AS PERMISSIVE
      FOR ALL
      TO PUBLIC
      USING (
        current_setting('app.current_tenant_id', true) = '' OR 
        current_setting('app.current_tenant_id', true) IS NULL OR
        tenant_id = current_setting('app.current_tenant_id', true)
      )
      WITH CHECK (
        current_setting('app.current_tenant_id', true) = '' OR 
        current_setting('app.current_tenant_id', true) IS NULL OR
        tenant_id = current_setting('app.current_tenant_id', true)
      );
  `).join('\n');
}
