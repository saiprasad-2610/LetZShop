import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../packages/db');

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.product.findMany({
      where: { name: 'Classic Cotton Shirt' },
      include: { variants: true }
    });
    console.log('Found existing products:', existing.length);
    for (const p of existing) {
      await prisma.productVariantOptionValue.deleteMany({
        where: { variant: { productId: p.id } }
      });
      await prisma.inventory.deleteMany({
        where: { variant: { productId: p.id } }
      });
      await prisma.productMedia.deleteMany({
        where: { productId: p.id }
      });
      await prisma.productVariant.deleteMany({
        where: { productId: p.id }
      });
      await prisma.productOption.deleteMany({
        where: { productId: p.id }
      });
      await prisma.product.delete({
        where: { id: p.id }
      });
    }

    // Also delete any dangling variants with CCS-
    const dangling = await prisma.productVariant.deleteMany({
      where: { sku: { startsWith: 'CCS-' } }
    });
    console.log('Cleaned up dangling CCS- variants:', dangling.count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
