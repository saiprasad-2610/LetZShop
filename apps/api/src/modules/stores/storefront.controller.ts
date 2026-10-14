import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient, ProductStatus } from '@prisma/client';
import { StoresService } from './stores.service';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { Public } from '../../common/decorators';
import { GuestCheckoutDto } from '../orders/dto/checkout.dto';
import { StoreSubscriptionRequiredException } from '../../common/exceptions/domain.exceptions';

@ApiTags('Public Storefront API')
@Public()
@Controller('storefront')
export class StorefrontController {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storesService: StoresService,
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService
  ) {}

  private async getStoreBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        themeConfiguration: { include: { themeDefinition: true } },
        sections: { where: { enabled: true }, orderBy: { position: 'asc' } },
        tenant: { include: { subscriptions: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!store) {
      throw new NotFoundException(`Store with slug '${slug}' not found.`);
    }

    return store;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get public storefront details by slug (subscription gated)' })
  async getStorefront(
    @Param('slug') slug: string,
    @Query('previewSecret') previewSecret?: string,
    @Query('preview') preview?: string,
    @Req() req?: any
  ) {
    return this.storesService.getPublicStorefront(slug, {
      previewSecret: previewSecret || (preview === 'true' ? 'true' : undefined),
      authenticatedUser: req?.user,
    });
  }

  @Get(':slug/categories')
  @ApiOperation({ summary: 'List public store categories' })
  async getCategories(@Param('slug') slug: string) {
    const store = await this.getStoreBySlug(slug);
    const categories = await this.prisma.category.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        mediaAssetId: true,
        sortOrder: true,
      },
    });
    return { categories };
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'List public store products' })
  async getProducts(
    @Param('slug') slug: string,
    @Query('category') categorySlug?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const store = await this.getStoreBySlug(slug);
    const skip = (Math.max(1, page) - 1) * Math.min(50, limit);

    const where: any = {
      storeId: store.id,
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    };

    if (categorySlug) {
      const cat = await this.prisma.category.findFirst({
        where: { storeId: store.id, slug: categorySlug, isActive: true },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Math.min(50, limit),
        include: {
          category: { select: { id: true, name: true, slug: true } },
          media: {
            orderBy: { sortOrder: 'asc' },
            include: {
              mediaAsset: true,
              optionValue: { include: { option: true } },
              variant: true,
            },
          },
          attributes: { orderBy: { sortOrder: 'asc' } },
          documents: { orderBy: { sortOrder: 'asc' } },
          options: {
            include: {
              values: {
                include: { media: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          variants: {
            where: { deletedAt: null },
            include: {
              inventory: true,
              optionValues: {
                include: {
                  optionValue: {
                    include: { option: true },
                  },
                },
              },
              media: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':slug/products/:productSlug')
  @ApiOperation({ summary: 'Get single public product by slug' })
  async getProductBySlug(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string
  ) {
    const store = await this.getStoreBySlug(slug);
    const product = await this.prisma.product.findFirst({
      where: {
        storeId: store.id,
        slug: productSlug,
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        category: true,
        media: {
          orderBy: { sortOrder: 'asc' },
          include: {
            mediaAsset: true,
            optionValue: { include: { option: true } },
            variant: true,
          },
        },
        attributes: { orderBy: { sortOrder: 'asc' } },
        documents: { orderBy: { sortOrder: 'asc' } },
        options: {
          include: {
            values: {
              include: { media: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
          include: {
            inventory: true,
            optionValues: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
            media: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productSlug}' not found.`);
    }

    return { product };
  }

  @Get(':slug/search')
  @ApiOperation({ summary: 'Search public store products' })
  async searchProducts(
    @Param('slug') slug: string,
    @Query('q') query: string
  ) {
    const store = await this.getStoreBySlug(slug);
    if (!query || query.trim().length === 0) {
      return { products: [] };
    }

    const products = await this.prisma.product.findMany({
      where: {
        storeId: store.id,
        status: ProductStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { deletedAt: null }, include: { inventory: true }, take: 1 },
      },
      take: 20,
    });

    return { products };
  }

  // ============================================================================
  // CANONICAL CART
  // ============================================================================

  @Post(':slug/cart')
  @ApiOperation({ summary: 'Initialize or retrieve guest cart for store' })
  async initCart(
    @Param('slug') slug: string,
    @Body('guestToken') guestToken?: string
  ) {
    const store = await this.getStoreBySlug(slug);
    return this.cartService.getOrCreateCart(store.id, guestToken);
  }

  @Get(':slug/cart/:token')
  @ApiOperation({ summary: 'Get cart by guest token or cart ID' })
  async getCart(
    @Param('slug') slug: string,
    @Param('token') token: string
  ) {
    // If token starts with guest_, look up cart by guestToken
    if (token.startsWith('guest_')) {
      const cart = await this.prisma.cart.findUnique({
        where: { guestToken: token },
      });
      if (!cart) throw new NotFoundException('Cart not found.');
      return this.cartService.getCart(cart.id);
    }
    return this.cartService.getCart(token);
  }

  @Post(':slug/cart/:token/items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItemToCart(
    @Param('slug') slug: string,
    @Param('token') token: string,
    @Body() body: { variantId: string; quantity: number }
  ) {
    let cartId = token;
    if (token.startsWith('guest_')) {
      const cart = await this.prisma.cart.findUnique({
        where: { guestToken: token },
      });
      if (!cart) throw new NotFoundException('Cart not found.');
      cartId = cart.id;
    }
    return this.cartService.addItem(cartId, body.variantId, body.quantity || 1);
  }

  @Patch(':slug/cart/:token/items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateCartItem(
    @Param('slug') slug: string,
    @Param('token') token: string,
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number
  ) {
    let cartId = token;
    if (token.startsWith('guest_')) {
      const cart = await this.prisma.cart.findUnique({
        where: { guestToken: token },
      });
      if (!cart) throw new NotFoundException('Cart not found.');
      cartId = cart.id;
    }

    // itemId can be variantId or item id
    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        OR: [{ id: itemId }, { variantId: itemId }],
      },
    });
    if (!item) throw new NotFoundException('Cart item not found.');

    return this.cartService.updateItemQuantity(cartId, item.variantId, quantity);
  }

  @Delete(':slug/cart/:token/items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeCartItem(
    @Param('slug') slug: string,
    @Param('token') token: string,
    @Param('itemId') itemId: string
  ) {
    let cartId = token;
    if (token.startsWith('guest_')) {
      const cart = await this.prisma.cart.findUnique({
        where: { guestToken: token },
      });
      if (!cart) throw new NotFoundException('Cart not found.');
      cartId = cart.id;
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        cartId,
        OR: [{ id: itemId }, { variantId: itemId }],
      },
    });
    if (!item) throw new NotFoundException('Cart item not found.');

    return this.cartService.removeItem(cartId, item.variantId);
  }

  // ============================================================================
  // CHECKOUT
  // ============================================================================

  @Post(':slug/checkout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guest-first atomic checkout for store' })
  async checkout(
    @Param('slug') slug: string,
    @Body() dto: GuestCheckoutDto
  ) {
    const store = await this.getStoreBySlug(slug);

    // Gating check: Must have active subscription and be LIVE!
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        tenantId: store.tenantId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() },
      },
    });
    if (!activeSub || store.status !== 'LIVE' || !store.isPubliclyAccessible) {
      throw new StoreSubscriptionRequiredException(
        'Store cannot accept public orders without an active subscription.'
      );
    }

    dto.storeId = store.id;
    return this.ordersService.createGuestOrder(dto);
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  @Get(':slug/orders/:orderNumber/track')
  @ApiOperation({ summary: 'Secure guest order tracking with cryptographic tracking token' })
  async trackOrder(
    @Param('slug') slug: string,
    @Param('orderNumber') orderNumber: string,
    @Query('t') token?: string
  ) {
    if (!token) {
      throw new BadRequestException('Tracking token is required to view order status.');
    }
    return this.ordersService.trackOrder(orderNumber, token);
  }
}
