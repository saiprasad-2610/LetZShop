import { PrismaClient, StoreStatus, ProductStatus, VariantStatus, OrderStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('🚀 Phase 4.5: Large Dataset Benchmark (10,000 Products across 100 Stores)...');

  const startTime = Date.now();

  // 1. Cleanup any previous benchmark run
  console.log('🧹 Cleaning previous benchmark artifacts...');
  await prisma.tenant.deleteMany({
    where: { slug: { startsWith: 'bench-tenant-' } },
  });

  console.log('🌱 Seeding temporary dataset: 100 tenants, 100 stores, 100 products/store = 10,000 products...');
  
  const BATCH_SIZE = 10; // 10 tenants per chunk
  const TOTAL_TENANTS = 100;
  const PRODUCTS_PER_STORE = 100;

  for (let t = 0; t < TOTAL_TENANTS; t += BATCH_SIZE) {
    const chunkPromises = [];
    for (let i = t + 1; i <= t + BATCH_SIZE && i <= TOTAL_TENANTS; i++) {
      const pad = String(i).padStart(3, '0');
      const tenantSlug = `bench-tenant-${pad}`;
      const storeSlug = `bench-store-${pad}`;

      chunkPromises.push((async () => {
        const tenant = await prisma.tenant.create({
          data: { name: `Benchmark Tenant ${pad}`, slug: tenantSlug },
        });

        const store = await prisma.store.create({
          data: {
            tenantId: tenant.id,
            name: `Benchmark Store ${pad}`,
            slug: storeSlug,
            status: StoreStatus.LIVE,
            isPubliclyAccessible: true,
          },
        });

        await prisma.storeBranding.create({
          data: {
            storeId: store.id,
            primaryColor: '#1E3A8A',
            accentColor: '#D97706',
            announcement: `Benchmark store ${pad} ready`,
          },
        });

        // 1 Customer
        const customer = await prisma.customer.create({
          data: {
            tenantId: tenant.id,
            storeId: store.id,
            phone: `+9199999${pad}00`,
            email: `bench${pad}@test.com`,
            fullName: `Customer ${pad}`,
          },
        });

        // 100 Products per store
        const productsData = [];
        for (let p = 1; p <= PRODUCTS_PER_STORE; p++) {
          const pPad = String(p).padStart(3, '0');
          productsData.push({
            tenantId: tenant.id,
            storeId: store.id,
            name: p % 2 === 0 ? `Linen Fabric Cloth ${pPad}` : `Cotton Silk Garment ${pPad}`,
            slug: `prod-${pPad}`,
            status: ProductStatus.PUBLISHED,
            description: `High performance product ${pPad} for benchmark test.`,
          });
        }
        await prisma.product.createMany({ data: productsData });

        // Retrieve created product IDs
        const createdProducts = await prisma.product.findMany({
          where: { storeId: store.id },
          select: { id: true, slug: true },
        });

        // Create variants & inventory
        const variantsData = createdProducts.map((cp, idx) => ({
          tenantId: tenant.id,
          storeId: store.id,
          productId: cp.id,
          sku: `SKU-${pad}-${idx + 1}`,
          pricePaise: (idx + 1) * 25000,
          status: VariantStatus.ACTIVE,
        }));
        await prisma.productVariant.createMany({ data: variantsData });

        // Create 2 sample orders per store
        for (let o = 1; o <= 2; o++) {
          await prisma.order.create({
            data: {
              tenantId: tenant.id,
              storeId: store.id,
              customerId: customer.id,
              orderNumber: `ORD-BENCH-${pad}-${o}`,
              status: OrderStatus.PLACED,
              paymentStatus: PaymentStatus.PAID,
              currency: 'INR',
              subtotalPaise: 50000,
              totalPaise: 50000,
              deliveryAddress: { line1: 'MG Road', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
            },
          });
        }
      })());
    }
    await Promise.all(chunkPromises);
    process.stdout.write(`... Created ${Math.min(t + BATCH_SIZE, TOTAL_TENANTS)} / ${TOTAL_TENANTS} stores\r`);
  }

  console.log(`\n✅ Temporary dataset populated in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

  // Verify counts
  const totalProducts = await prisma.product.count();
  const totalStores = await prisma.store.count();
  console.log(`📊 Current DB Totals: ${totalStores} Stores, ${totalProducts} Products`);

  // 2. Benchmark Queries
  console.log('\n⏱️ Benchmarking Core Query Latencies (50 iterations per endpoint with pagination):');

  async function measureQuery(name: string, fn: () => Promise<any>, iterations = 50) {
    const latencies: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now();
      await fn();
      const t1 = performance.now();
      latencies.push(t1 - t0);
    }
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(iterations * 0.5)].toFixed(2);
    const p95 = latencies[Math.floor(iterations * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(iterations * 0.99)].toFixed(2);
    const mean = (latencies.reduce((a, b) => a + b, 0) / iterations).toFixed(2);
    console.log(`  - ${name.padEnd(30)} | Mean: ${mean.padStart(6)}ms | p50: ${p50.padStart(6)}ms | p95: ${p95.padStart(6)}ms | p99: ${p99.padStart(6)}ms`);
    return { name, mean, p50, p95, p99 };
  }

  const sampleStore = await prisma.store.findFirst({ where: { slug: 'bench-store-050' } });
  const storeId = sampleStore!.id;

  // Q1: Public Storefront (store + branding + first 20 products)
  await measureQuery('Public Storefront Initial Load', async () => {
    return prisma.store.findUnique({
      where: { slug: 'bench-store-050' },
      include: {
        branding: true,
        products: {
          take: 20,
          where: { status: 'PUBLISHED' },
          include: { variants: true },
        },
      },
    });
  });

  // Q2: Catalog Search (Search "Linen" across 10,000 products with pagination)
  await measureQuery('Catalog Search (Linen, 20 items)', async () => {
    return prisma.product.findMany({
      where: {
        storeId,
        status: 'PUBLISHED',
        name: { contains: 'Linen', mode: 'insensitive' },
      },
      take: 20,
      skip: 0,
      include: { variants: true },
    });
  });

  // Q3: Seller Product Listing (Paginated 20 items)
  await measureQuery('Seller Product List (page 1)', async () => {
    return prisma.product.findMany({
      where: { storeId },
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: { variants: true },
    });
  });

  // Q4: Seller Order Listing (Paginated 20 items)
  await measureQuery('Seller Order List (page 1)', async () => {
    return prisma.order.findMany({
      where: { storeId },
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
  });

  // Q5: Admin Merchant Listing (Paginated 20 merchants)
  await measureQuery('Admin Merchant Listing (page 1)', async () => {
    return prisma.tenant.findMany({
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: { stores: true, _count: { select: { products: true, orders: true } } },
    });
  });

  // Q6: Admin Commerce Listing (Paginated 20 orders)
  await measureQuery('Admin Commerce Orders (page 1)', async () => {
    return prisma.order.findMany({
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, store: true },
    });
  });

  // 3. PostgreSQL EXPLAIN ANALYZE on Critical Queries
  console.log('\n🔍 EXPLAIN ANALYZE on PostgreSQL for Catalog Search:');
  const explainSearch: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT p.id, p.name, p.slug
    FROM "products" p
    WHERE p.store_id = '${storeId}'
      AND p.status = 'PUBLISHED'
      AND p.name ILIKE '%Linen%'
    ORDER BY p.created_at DESC
    LIMIT 20 OFFSET 0;
  `);
  explainSearch.forEach((row: any) => console.log('   ', row['QUERY PLAN']));

  console.log('\n🔍 EXPLAIN ANALYZE on PostgreSQL for Seller Orders:');
  const explainOrders: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT o.id, o.order_number, o.status, o.total_paise
    FROM "orders" o
    WHERE o.store_id = '${storeId}'
    ORDER BY o.created_at DESC
    LIMIT 20 OFFSET 0;
  `);
  explainOrders.forEach((row: any) => console.log('   ', row['QUERY PLAN']));

  // 4. Clean up temporary benchmark data
  console.log('\n🧹 Cleaning up temporary 10,000 product benchmark dataset...');
  await prisma.tenant.deleteMany({
    where: { slug: { startsWith: 'bench-tenant-' } },
  });
  console.log('✅ Temporary benchmark dataset cleaned up completely. Database returned to pristine demo state.');

  await prisma.$disconnect();
}

runBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  prisma.$disconnect();
  process.exit(1);
});
