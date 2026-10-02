import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import path from 'path';

async function demoReset() {
  console.log('================================================================================');
  console.log('🔄 SIMPLY E-COMMERCE: DETERMINISTIC DEMO RESET (UDYOG DINDI PREP)');
  console.log('================================================================================\n');

  // CRITICAL SAFETY CHECK: NEVER RUN AGAINST PRODUCTION
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: demo:reset is STRICTLY FORBIDDEN in production environment!');
    console.error('   Aborting immediately to prevent accidental data modification.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log('🔒 1. Verifying environment: OK (NODE_ENV !== production)');

    console.log('🧹 2. Resetting transactional demo data (preserving schema & migrations)...');
    
    // Clean transactional entities
    await prisma.shipmentEvent.deleteMany({});
    await prisma.shipment.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.paymentTransaction.deleteMany({});
    await prisma.paymentOrder.deleteMany({});
    await prisma.orderStatusHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.enquiry.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.inventory.deleteMany({});

    console.log('🌱 3. Re-seeding official demo tenants, products, themes & inventory...');
    
    // Run packages/db seed script
    const result = spawnSync('pnpm', ['--filter', '@simply/db', 'seed'], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..'),
    });

    if (result.status !== 0) {
      throw new Error(`Seeding failed with exit code ${result.status}`);
    }

    console.log('\n================================================================================');
    console.log('✨ DEMO RESET COMPLETE:');
    console.log('   - 6 Demo Stores restored with full themes (Atelier, Pulse, Harvest, Foundry, Habitat, Local)');
    console.log('   - Inventories replenished to default quantities');
    console.log('   - Transactional carts/orders cleared for fresh demonstration');
    console.log('   - Ready for live demonstration!');
    console.log('================================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

demoReset().catch((err) => {
  console.error('Demo reset error:', err);
  process.exit(1);
});
