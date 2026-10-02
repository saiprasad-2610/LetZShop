import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getOrCreateCart(storeId: string, guestToken?: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found.');

    if (guestToken) {
      const existing = await this.prisma.cart.findUnique({
        where: { guestToken },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true, optionValues: { include: { optionValue: true } } },
              },
            },
          },
        },
      });
      if (existing && existing.expiresAt > new Date()) {
        return existing;
      }
    }

    const newGuestToken = `guest_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.prisma.cart.create({
      data: {
        tenantId: store.tenantId,
        storeId: store.id,
        guestToken: newGuestToken,
        expiresAt,
      },
      include: { items: true },
    });
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
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          unitPricePaise: variant.pricePaise,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId,
        variantId,
        quantity,
        unitPricePaise: variant.pricePaise,
      },
    });
  }

  public async getCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                optionValues: { include: { optionValue: true } },
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

    return {
      cart,
      subtotalPaise,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  public async updateItemQuantity(cartId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(cartId, variantId);
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });
    if (!variant) throw new NotFoundException('Variant not found.');

    if (variant.inventory && variant.inventory.stockOnHand < quantity && !variant.inventory.allowBackorder) {
      throw new BadRequestException('Insufficient stock available for this quantity.');
    }

    return this.prisma.cartItem.update({
      where: { cartId_variantId: { cartId, variantId } },
      data: { quantity },
    });
  }

  public async removeItem(cartId: string, variantId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId, variantId },
    });
  }
}
