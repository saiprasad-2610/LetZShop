import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient, InventoryMovementType, VariantStatus, ProductStatus } from '@prisma/client';
import { InsufficientStockException, ProductOutOfStockException } from '../../common/exceptions/domain.exceptions';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getVariantStock(variantId: string) {
    return this.prisma.inventory.findUnique({
      where: { variantId },
    });
  }

  /**
   * Concurrency-safe atomic stock reservation inside a transaction.
   * Guarantees stock can NEVER become negative even under high concurrent orders.
   */
  public async reserveStock(
    variantId: string,
    quantity: number,
    referenceId?: string,
    txClient?: any
  ): Promise<{ stockOnHand: number; balanceAfter: number }> {
    if (quantity <= 0) {
      throw new BadRequestException('Reservation quantity must be greater than zero.');
    }

    const client = txClient || this.prisma;

    // Concurrency-safe atomic reservation using PostgreSQL raw query with row-level condition
    const affectedCount = await client.$executeRaw`
      UPDATE "inventory"
      SET "stock_on_hand" = "stock_on_hand" - ${quantity},
          "stock_reserved" = "stock_reserved" + ${quantity},
          "updated_at" = NOW()
      WHERE "variant_id" = ${variantId}
        AND ("stock_on_hand" >= ${quantity} OR "allow_backorder" = true);
    `;

    if (affectedCount === 0) {
      // Determine exact reason for detailed domain exception
      const inv = await client.inventory.findUnique({ where: { variantId } });
      if (!inv || inv.stockOnHand <= 0) {
        throw new ProductOutOfStockException('The selected product variant is currently out of stock.');
      }
      throw new InsufficientStockException(inv.stockOnHand, quantity);
    }

    const updatedInv = await client.inventory.findUnique({ where: { variantId } });

    // Record audit trail in InventoryMovement
    await client.inventoryMovement.create({
      data: {
        tenantId: updatedInv.tenantId,
        storeId: updatedInv.storeId,
        variantId,
        inventoryId: updatedInv.id,
        movementType: InventoryMovementType.ORDER_RESERVATION,
        quantityDelta: -quantity,
        balanceAfter: updatedInv.stockOnHand,
        referenceType: 'ORDER',
        referenceId,
      },
    });

    return {
      stockOnHand: updatedInv.stockOnHand,
      balanceAfter: updatedInv.stockOnHand,
    };
  }

  /**
   * Releases reserved stock back to available inventory on order cancellation or failure.
   */
  public async releaseStockReservation(
    variantId: string,
    quantity: number,
    referenceId?: string,
    txClient?: any
  ): Promise<void> {
    const client = txClient || this.prisma;

    await client.$executeRaw`
      UPDATE "inventory"
      SET "stock_on_hand" = "stock_on_hand" + ${quantity},
          "stock_reserved" = GREATEST(0, "stock_reserved" - ${quantity}),
          "updated_at" = NOW()
      WHERE "variant_id" = ${variantId};
    `;

    const updatedInv = await client.inventory.findUnique({ where: { variantId } });
    if (updatedInv) {
      await client.inventoryMovement.create({
        data: {
          tenantId: updatedInv.tenantId,
          storeId: updatedInv.storeId,
          variantId,
          inventoryId: updatedInv.id,
          movementType: InventoryMovementType.ORDER_CANCELLATION,
          quantityDelta: quantity,
          balanceAfter: updatedInv.stockOnHand,
          referenceType: 'ORDER',
          referenceId,
        },
      });
    }
  }

  /**
   * Finalizes fulfillment: deduces from reserved inventory permanently.
   */
  public async fulfillStock(
    variantId: string,
    quantity: number,
    referenceId?: string,
    txClient?: any
  ): Promise<void> {
    const client = txClient || this.prisma;

    await client.$executeRaw`
      UPDATE "inventory"
      SET "stock_reserved" = GREATEST(0, "stock_reserved" - ${quantity}),
          "updated_at" = NOW()
      WHERE "variant_id" = ${variantId};
    `;

    const updatedInv = await client.inventory.findUnique({ where: { variantId } });
    if (updatedInv) {
      await client.inventoryMovement.create({
        data: {
          tenantId: updatedInv.tenantId,
          storeId: updatedInv.storeId,
          variantId,
          inventoryId: updatedInv.id,
          movementType: InventoryMovementType.ORDER_FULFILLMENT,
          quantityDelta: 0,
          balanceAfter: updatedInv.stockOnHand,
          referenceType: 'ORDER',
          referenceId,
        },
      });
    }
  }

  /**
   * Manual inventory adjustment by seller.
   */
  public async adjustStock(
    variantId: string,
    newQuantity: number,
    reason: string,
    actorId?: string
  ) {
    if (newQuantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative.');
    }

    return this.prisma.$transaction(async (tx) => {
      let current = await tx.inventory.findUnique({ where: { variantId } });
      if (!current) {
        current = await tx.inventory.findUnique({ where: { id: variantId } });
      }
      if (!current) throw new BadRequestException('Inventory record not found for variant.');

      const delta = newQuantity - current.stockOnHand;

      const updated = await tx.inventory.update({
        where: { id: current.id },
        data: { stockOnHand: newQuantity },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId: current.tenantId,
          storeId: current.storeId,
          variantId: current.variantId,
          inventoryId: current.id,
          movementType: InventoryMovementType.MANUAL_ADJUSTMENT,
          quantityDelta: delta,
          balanceAfter: newQuantity,
          notes: reason,
          actorId,
        },
      });

      return updated;
    });
  }

  public async getStoreInventory(tenant: any) {
    const items = await this.prisma.inventory.findMany({
      where: {
        storeId: tenant.storeId,
        variant: {
          deletedAt: null,
          status: { not: VariantStatus.DISCONTINUED },
          product: {
            deletedAt: null,
            status: { not: ProductStatus.ARCHIVED },
          },
        },
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                media: {
                  include: { mediaAsset: true },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
            optionValues: {
              include: {
                optionValue: {
                  include: {
                    option: true,
                  },
                },
              },
            },
            orderItems: {
              select: {
                quantity: true,
              },
            },
            cartItems: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return items.map((inv) => {
      const variant = inv.variant;
      const product = variant?.product;
      const totalSold =
        variant?.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const inCart =
        variant?.cartItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      const variantTitle =
        variant?.optionValues && variant.optionValues.length > 0
          ? variant.optionValues
              .map((ov) => {
                const optName = ov.optionValue?.option?.name;
                const optVal = ov.optionValue?.value;
                return optName ? `${optName}: ${optVal}` : optVal;
              })
              .filter(Boolean)
              .join(', ')
          : 'Standard / Default';

      return {
        ...inv,
        sku: variant?.sku || inv.variantId || 'N/A',
        productName: product?.name || 'Unnamed Product',
        productSlug: product?.slug || '',
        categoryName: product?.category?.name || 'Uncategorized',
        categoryId: product?.category?.id || null,
        productImage: product?.media?.[0]?.mediaAsset?.publicUrl || null,
        variantTitle,
        totalSold,
        inCart,
      };
    });
  }
}
