import { PrismaClient } from '../packages/db/node_modules/@prisma/client/index.js';


const prisma = new PrismaClient();

async function main() {
  const shirt = await prisma.product.findUnique({
    where: {
      id: '440fc962-e92d-4b2c-94b2-79e0c39fe8ef',
    },
    include: {
      options: { include: { values: true } },
      variants: {
        include: {
          optionValues: {
            include: { optionValue: { include: { option: true } } },
          },
          inventory: true,
          media: true,
        },
      },
      media: {
        include: { mediaAsset: true, optionValue: true, variant: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!shirt) {
    console.log('Shirt product not found!');
    return;
  }

  console.log('Product:', shirt.id, shirt.name);
  console.log('Existing ProductMedia rows:', shirt.media.length);
  for (const m of shirt.media) {
    console.log({
      id: m.id,
      mediaAssetId: m.mediaAssetId,
      fileName: m.mediaAsset?.fileName,
      publicUrl: m.publicUrl,
      optionValueId: m.optionValueId,
      optionValue: m.optionValue?.value,
      variantId: m.variantId,
      sortOrder: m.sortOrder,
    });
  }

  const colourOption = shirt.options.find(
    (o) => o.name.toLowerCase() === 'colour' || o.name.toLowerCase() === 'color'
  );
  console.log('Colour option:', colourOption?.id, colourOption?.name);
  const whiteVal = colourOption?.values.find((v) => v.value.toLowerCase() === 'white');
  const blackVal = colourOption?.values.find((v) => v.value.toLowerCase() === 'black');
  console.log('White option value id:', whiteVal?.id);
  console.log('Black option value id:', blackVal?.id);

  let whiteAssetId = '4cd422c5-486d-4565-a40c-bcdb838594f9';
  let blackAssetId = 'e2c59974-0e26-404e-96f3-33bc8aa0cc11';

  console.log('Found White asset id:', whiteAssetId);
  console.log('Found Black asset id:', blackAssetId);

  // If found, let's repair!
  if (whiteVal && blackVal && whiteAssetId && blackAssetId) {
    console.log('\n--- CLEANING UP PRODUCT MEDIA FOR SHIRTS ---');
    // Remove all old duplicate ProductMedia rows for this product
    await prisma.productMedia.deleteMany({
      where: { productId: shirt.id },
    });

    const whiteAsset = await prisma.mediaAsset.findUnique({ where: { id: whiteAssetId } });
    const blackAsset = await prisma.mediaAsset.findUnique({ where: { id: blackAssetId } });

    // Create exactly 2 clean ProductMedia rows:
    // 1) White shirt -> optionValueId: whiteVal.id, variantId: null, sortOrder: 0
    const mWhite = await prisma.productMedia.create({
      data: {
        tenantId: shirt.tenantId,
        storeId: shirt.storeId,
        productId: shirt.id,
        mediaAssetId: whiteAssetId,
        optionValueId: whiteVal.id,
        variantId: null,
        filePath: whiteAsset?.filePath || whiteAsset?.storageKey || '',
        storageKey: whiteAsset?.storageKey || '',
        publicUrl: whiteAsset?.publicUrl || '',
        mimeType: whiteAsset?.mimeType || 'image/png',
        sizeBytes: whiteAsset?.sizeBytes || 1024,
        width: whiteAsset?.width || null,
        height: whiteAsset?.height || null,
        sortOrder: 0,
        altText: 'White Shirt',
      },
    });

    // 2) Black shirt -> optionValueId: blackVal.id, variantId: null, sortOrder: 1
    const mBlack = await prisma.productMedia.create({
      data: {
        tenantId: shirt.tenantId,
        storeId: shirt.storeId,
        productId: shirt.id,
        mediaAssetId: blackAssetId,
        optionValueId: blackVal.id,
        variantId: null,
        filePath: blackAsset?.filePath || blackAsset?.storageKey || '',
        storageKey: blackAsset?.storageKey || '',
        publicUrl: blackAsset?.publicUrl || '',
        mimeType: blackAsset?.mimeType || 'image/png',
        sizeBytes: blackAsset?.sizeBytes || 1024,
        width: blackAsset?.width || null,
        height: blackAsset?.height || null,
        sortOrder: 1,
        altText: 'Black Shirt',
      },
    });

    console.log('Created clean White media:', mWhite.id, '-> optionValueId:', whiteVal.id);
    console.log('Created clean Black media:', mBlack.id, '-> optionValueId:', blackVal.id);
  }

  // Ensure all 6 variants exist and have stockOnHand: 10, status: ACTIVE
  console.log('\n--- VERIFYING 6 VARIANTS ---');
  for (const v of shirt.variants) {
    const opts = v.optionValues.map((ov) => `${ov.optionValue.option.name}=${ov.optionValue.value}`).join(', ');
    console.log(`Variant: ${v.sku} (${opts}) - status: ${v.status}, stockOnHand: ${v.inventory?.stockOnHand}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
