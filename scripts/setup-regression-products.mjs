import { PrismaClient, ProductStatus, VariantStatus, OptionType } from '../packages/db/node_modules/@prisma/client/index.js';
const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.findUnique({
    where: { slug: 'sk-general-stores' },
  });

  if (!store) throw new Error('Store sk-general-stores not found');

  const tenantId = store.tenantId;
  const storeId = store.id;

  // 1. Size-only Product: "Classic Denim Jeans"
  let sizeOnly = await prisma.product.findFirst({
    where: { storeId, slug: 'classic-denim-jeans', deletedAt: null },
  });

  if (!sizeOnly) {
    sizeOnly = await prisma.product.create({
      data: {
        tenantId,
        storeId,
        name: 'Classic Denim Jeans',
        slug: 'classic-denim-jeans',
        status: ProductStatus.PUBLISHED,
        mode: 'SELL_ONLINE',

        options: {
          create: {
            tenantId,
            storeId,
            name: 'Size',
            type: OptionType.SIZE,
            sortOrder: 0,
            values: {
              create: [
                { value: '30', sortOrder: 0 },
                { value: '32', sortOrder: 1 },
              ],
            },
          },
        },
      },
      include: { options: { include: { values: true } } },
    });

    const optVals = sizeOnly.options[0].values;
    for (const val of optVals) {
      const variant = await prisma.productVariant.create({
        data: {
          tenantId,
          storeId,
          productId: sizeOnly.id,
          sku: `JEANS-${val.value}`,
          pricePaise: 149900,
          status: VariantStatus.ACTIVE,
          optionValues: {
            create: { optionValueId: val.id },
          },
          inventory: {
            create: {
              tenantId,
              storeId,
              stockOnHand: 10,
              stockReserved: 0,
            },
          },
        },
      });
    }
    console.log('Created Size-only product: classic-denim-jeans');
  } else {
    console.log('Size-only product already exists: classic-denim-jeans');
  }

  // 2. Colour-only Product: "Vintage Leather Wallet"
  let colourOnly = await prisma.product.findFirst({
    where: { storeId, slug: 'vintage-leather-wallet', deletedAt: null },
  });

  if (!colourOnly) {
    colourOnly = await prisma.product.create({
      data: {
        tenantId,
        storeId,
        name: 'Vintage Leather Wallet',
        slug: 'vintage-leather-wallet',
        status: ProductStatus.PUBLISHED,
        mode: 'SELL_ONLINE',

        options: {
          create: {
            tenantId,
            storeId,
            name: 'Colour',
            type: OptionType.COLOUR,
            sortOrder: 0,
            values: {
              create: [
                { value: 'Brown', sortOrder: 0 },
                { value: 'Tan', sortOrder: 1 },
              ],
            },
          },
        },
      },
      include: { options: { include: { values: true } } },
    });

    const optVals = colourOnly.options[0].values;
    for (const val of optVals) {
      const variant = await prisma.productVariant.create({
        data: {
          tenantId,
          storeId,
          productId: colourOnly.id,
          sku: `WALLET-${val.value.toUpperCase()}`,
          pricePaise: 79900,
          status: VariantStatus.ACTIVE,
          optionValues: {
            create: { optionValueId: val.id },
          },
          inventory: {
            create: {
              tenantId,
              storeId,
              stockOnHand: 15,
              stockReserved: 0,
            },
          },
        },
      });
    }
    console.log('Created Colour-only product: vintage-leather-wallet');
  } else {
    console.log('Colour-only product already exists: vintage-leather-wallet');
  }
}

main().finally(() => prisma.$disconnect());
