import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const shirts = await prisma.product.findUnique({
    where: { id: '440fc962-e92d-4b2c-94b2-79e0c39fe8ef' },
    include: {
      media: { include: { mediaAsset: true, optionValue: true } },
      options: { include: { values: { include: { media: true } } } },
      variants: { include: { media: true, optionValues: { include: { optionValue: true } } } },
    },
  });

  console.log('Shirts Product:');
  console.log('ID:', shirts?.id);
  console.log('Name:', shirts?.name);
  console.log('Slug:', shirts?.slug);
  console.log('Media count:', shirts?.media.length);
  for (const m of shirts?.media || []) {
    console.log({
      id: m.id,
      mediaAssetId: m.mediaAssetId,
      publicUrl: m.publicUrl,
      optionValueId: m.optionValueId,
      optionValue: m.optionValue?.value,
      assetUrl: m.mediaAsset?.publicUrl,
      fileName: m.mediaAsset?.fileName,
    });
  }

  console.log('\nOptions & Values:');
  for (const opt of shirts?.options || []) {
    console.log(`Option: ${opt.name} (${opt.id})`);
    for (const val of opt.values) {
      console.log(`  Value: ${val.value} (${val.id}), media count: ${val.media?.length}`);
      for (const vm of val.media || []) {
        console.log(`    Media: ${vm.id}, ${vm.publicUrl}`);
      }
    }
  }

  // Also check where 2d142af7 is referenced
  const pmRefs = await prisma.productMedia.findMany({
    where: { mediaAssetId: '2d142af7-fdaa-4b3b-844a-3b6ec58f5986' },
    include: { product: true }
  });
  console.log('\nProductMedia referencing 2d142af7:', pmRefs.map(r => ({ id: r.id, prod: r.product.name, slug: r.product.slug })));

  const vmRefs = await prisma.productVariantMedia.findMany({
    where: { mediaAssetId: '2d142af7-fdaa-4b3b-844a-3b6ec58f5986' },
    include: { variant: { include: { product: true } } }
  });
  console.log('VariantMedia referencing 2d142af7:', vmRefs.map(r => ({ id: r.id, prod: r.variant.product.name, sku: r.variant.sku })));


  // Check all MediaAssets
  const allMa = await prisma.mediaAsset.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log('\nRecent MediaAssets:');
  for (const a of allMa) {
    console.log(a.id, a.fileName, a.publicUrl);
  }
}

main().finally(() => prisma.$disconnect());
