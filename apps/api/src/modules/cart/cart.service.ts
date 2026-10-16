import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getOrCreateCart(storeId: string, guestToken?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found.');

    const cleanToken = guestToken?.trim();

    if (cleanToken) {
      const existing = await this.prisma.cart.findUnique({
        where: { guestToken: cleanToken },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { media: { orderBy: { sortOrder: 'asc' } } },
                  },
                  optionValues: { include: { optionValue: true } },
                },
              },
            },
          },
        },
      });

      if (existing) {
        // If expired, refresh expiration by 30 days
        if (existing.expiresAt <= new Date()) {
          const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await this.prisma.cart.update({
            where: { id: existing.id },
            data: { expiresAt: newExpires },
          });
          existing.expiresAt = newExpires;
        }

        const subtotalPaise = existing.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPricePaise,
          0
        );
        const itemCount = existing.items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...existing,
          cart: existing,
          subtotalPaise,
          itemCount,
        };
      }
    }

    const assignedToken = cleanToken || `guest_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const created = await this.prisma.cart.create({
      data: {
        tenantId: store.tenantId,
        storeId: store.id,
        guestToken: assignedToken,
        expiresAt,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { media: { orderBy: { sortOrder: 'asc' } } },
                },
                optionValues: { include: { optionValue: true } },
              },
            },
          },
        },
      },
    });

    return {
      ...created,
      cart: created,
      subtotalPaise: 0,
      itemCount: 0,
    };
  }

  public async addItem(cartId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException('Cart not found or expired.');

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant || variant.deletedAt !== null) {
      throw new NotFoundException('Product variant not found.');
    }

    // Verify stock availability
    if (variant.inventory && variant.inventory.stockOnHand < quantity && !variant.inventory.allowBackorder) {
      throw new BadRequestException('Insufficient stock available for this variant.');
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          unitPricePaise: variant.pricePaise,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId,
          variantId,
          quantity,
          unitPricePaise: variant.pricePaise,
        },
      });
    }

    return this.getCart(cartId);
  }

  public async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    media: {
                      include: { optionValue: true },
                      orderBy: { sortOrder: 'asc' },
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
                media: true,
              },
            },
          },
        },
      },
    });

    if (!cart) throw new NotFoundException('Cart not found.');

    const subtotalPaise = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPricePaise,
      0
    );
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...cart,
      cart,
      subtotalPaise,
      itemCount,
    };
  }

  public async updateItemQuantity(cartId: string, variantId: string, quantity: number) {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return this.removeItem(cartId, variantId);
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant) throw new NotFoundException('Variant not found.');

    if (variant.inventory && variant.inventory.stockOnHand < qty && !variant.inventory.allowBackorder) {
      throw new BadRequestException('Insufficient stock available for this quantity.');
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      update: { quantity: qty },
      create: {
        cartId,
        variantId,
        quantity: qty,
        unitPricePaise: variant.pricePaise,
      },
    });

    return this.getCart(cartId);
  }

  public async removeItem(cartId: string, variantId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { cartId, variantId },
    });

    return this.getCart(cartId);
  }
}
