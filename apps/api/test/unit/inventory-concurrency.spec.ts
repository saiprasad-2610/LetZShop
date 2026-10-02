import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { PrismaClient, InventoryMovementType } from '@prisma/client';
import {
  InsufficientStockException,
  ProductOutOfStockException,
} from '../../src/common/exceptions/domain.exceptions';

describe('Inventory & Concurrency Strategy (Unit Tests)', () => {
  let inventoryService: InventoryService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $executeRaw: jest.fn(),
      inventory: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaClient, useValue: mockPrisma },
      ],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);
  });

  it('1. Successfully reserves stock when inventory is available', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1); // 1 row updated
    mockPrisma.inventory.findUnique.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      variantId: 'var-1',
      stockOnHand: 15,
      stockReserved: 5,
    });

    const result = await inventoryService.reserveStock('var-1', 5, 'order-101');
    expect(result.stockOnHand).toBe(15);
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        variantId: 'var-1',
        movementType: InventoryMovementType.ORDER_RESERVATION,
        quantityDelta: -5,
      }),
    });
  });

  it('2. Throws ProductOutOfStockException when stock on hand is 0', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(0); // 0 rows updated
    mockPrisma.inventory.findUnique.mockResolvedValue({
      id: 'inv-1',
      variantId: 'var-1',
      stockOnHand: 0,
      stockReserved: 0,
    });

    await expect(inventoryService.reserveStock('var-1', 2)).rejects.toThrow(
      ProductOutOfStockException
    );
  });

  it('3. Throws InsufficientStockException when requested > available', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(0);
    mockPrisma.inventory.findUnique.mockResolvedValue({
      id: 'inv-1',
      variantId: 'var-1',
      stockOnHand: 3,
      stockReserved: 0,
    });

    await expect(inventoryService.reserveStock('var-1', 10)).rejects.toThrow(
      InsufficientStockException
    );
  });

  it('4. Releasing stock reservation increments available stock and creates cancellation movement', async () => {
    mockPrisma.$executeRaw.mockResolvedValue(1);
    mockPrisma.inventory.findUnique.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      variantId: 'var-1',
      stockOnHand: 20,
    });

    await inventoryService.releaseStockReservation('var-1', 5, 'order-cancelled');

    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        variantId: 'var-1',
        movementType: InventoryMovementType.ORDER_CANCELLATION,
        quantityDelta: 5,
      }),
    });
  });

  it('5. Manual adjustment rejects negative stock levels', async () => {
    await expect(inventoryService.adjustStock('var-1', -10, 'Damaged stock')).rejects.toThrow(
      'Stock quantity cannot be negative.'
    );
  });
});
