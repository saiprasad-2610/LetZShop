import { visibleCategoryCount } from '../catalog/category-counts';
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
import { Prisma, PrismaClient, ProductStatus } from '@prisma/client';
import { StoresService } from './stores.service';
import { publicProduct } from './public-product';
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

  private async getStoreBySlug(slug: string, req?: any) {
    const result = await this.storesService.evaluatePublicVisibility(slug, {
      previewSecret: req?.query?.previewSecret,
      authenticatedUser: req?.user,
    });
    return result.store;
  }

  private async getScopedCart(slug: string, token: string) {
    const store = await this.prisma.store.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
    if (!store) throw new NotFoundException('Store not found.');
    const cart = await this.prisma.cart.findFirst({
      where: { storeId: store.id, ...(token.startsWith('guest_') ? { guestToken: token } : { id: token }) },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException('Cart not found in this store.');
    return cart.id;
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
  async getCategories(@Param('slug') slug: string, @Req() req?: any) {
    const store = await this.getStoreBySlug(slug, req);
    const categories = await this.prisma.category.findMany({
      where: { storeId: store.id, tenantId: store.tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 100,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        mediaAssetId: true,
        sortOrder: true,
        _count: { select: visibleCategoryCount(store.id, store.tenantId) },
      },
    });
    return { categories: categories.map(c => ({ ...c, visibleProductCount: c._count.products })) };
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'List public store products' })
  async getProducts(
    @Param('slug') slug: string,
    @Query('category') categorySlug?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req?: any,
    @Query('q') query?: string,
    @Query('sort') sort?: string
  ) {
    const store = await this.getStoreBySlug(slug, req);
    const safePage = Number.isFinite(Number(page)) ? Math.min(100000, Math.max(1, Math.floor(Number(page)))) : 1;
    const safeLimit = Number.isFinite(Number(limit)) ? Math.min(50, Math.max(1, Math.floor(Number(limit)))) : 20;
    const skip = (safePage - 1) * safeLimit;

    const where: any = {
      storeId: store.id,
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
    };

    if (categorySlug) {
      const cat = await this.prisma.category.findFirst({
        where: { storeId: store.id, OR: [{ slug: categorySlug }, { id: categorySlug }], isActive: true },
      });
      where.categoryId = cat?.id || "__missing_category__";
    }

    const search = typeof query === 'string' ? query.trim().slice(0, 200) : '';
    const escapedSearch = search.replace(/[\\%_]/g, '\\$&');
    if (search) where.OR = [
      { name: { contains: escapedSearch, mode: 'insensitive' } },
      { description: { contains: escapedSearch, mode: 'insensitive' } },
      { category: { name: { contains: escapedSearch, mode: 'insensitive' } } },
    ];
    // Resolve only one bounded page of IDs for price order; no catalog-wide JS sort or N+1.
    let orderedIds: string[] | undefined;
    if (sort === 'price_asc' || sort === 'price_desc') {
      const direction = sort === 'price_asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      const categoryFilter = where.categoryId ? Prisma.sql`AND p.category_id = ${where.categoryId}` : Prisma.empty;
      const term = `%${escapedSearch}%`;
      const searchFilter = search ? Prisma.sql`AND (p.name ILIKE ${term} OR p.description ILIKE ${term} OR EXISTS (SELECT 1 FROM categories c WHERE c.id = p.category_id AND c.store_id = ${store.id} AND c.name ILIKE ${term}))` : Prisma.empty;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT p.id FROM products p LEFT JOIN LATERAL (
          SELECT v.price_paise FROM product_variants v WHERE v.product_id = p.id AND v.deleted_at IS NULL
          ORDER BY v.sort_order ASC, v.id ASC LIMIT 1
        ) price ON true
        WHERE p.store_id = ${store.id} AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
        ${categoryFilter} ${searchFilter}
        ORDER BY COALESCE(price.price_paise, 0) ${direction}, p.id ASC LIMIT ${safeLimit} OFFSET ${skip}
      `);
      orderedIds = rows.map(row => row.id);
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: orderedIds ? { ...where, id: { in: orderedIds } } : where,
        skip: orderedIds ? 0 : skip,
        take: safeLimit,
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
          translations: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: (orderedIds ? orderedIds.map(id => products.find(p => p.id === id)).filter((product): product is typeof products[number] => !!product) : products).map(publicProduct),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  @Get(':slug/products/:productSlug')
  @ApiOperation({ summary: 'Get single public product by slug' })
  async getProductBySlug(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
    @Req() req?: any
  ) {
    const store = await this.getStoreBySlug(slug, req);
    const product = await this.prisma.product.findFirst({
      where: {
        storeId: store.id,
        OR: [{ slug: productSlug }, { id: productSlug }],
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
        translations: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product '${productSlug}' not found.`);
    }

    return { product: publicProduct(product) };
  }

  @Get(':slug/search')
  @ApiOperation({ summary: 'Search public store products' })
  async searchProducts(
    @Param('slug') slug: string,
    @Query('q') query: string,
    @Req() req?: any
  ) {
    const store = await this.getStoreBySlug(slug, req);
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

    return { products: products.map(publicProduct) };
  }

  // ============================================================================
  // CANONICAL CART
  // ============================================================================

  @Post(':slug/cart')
  @ApiOperation({ summary: 'Initialize or retrieve guest cart for store' })
  async initCart(
    @Param('slug') slug: string,
    @Body('guestToken') guestToken?: string,
    @Req() req?: any
  ) {
    const store = await this.getStoreBySlug(slug, req);
    return this.cartService.getOrCreateCart(store.id, guestToken);
  }

  @Get(':slug/cart/:token')
  @ApiOperation({ summary: 'Get cart by guest token or cart ID' })
  async getCart(
    @Param('slug') slug: string,
    @Param('token') token: string
  ) {
    return this.cartService.getCart(await this.getScopedCart(slug, token));
  }

  @Post(':slug/cart/:token/items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItemToCart(
    @Param('slug') slug: string,
    @Param('token') token: string,
    @Body() body: { variantId: string; quantity: number }
  ) {
    const cartId = await this.getScopedCart(slug, token);
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
    const cartId = await this.getScopedCart(slug, token);

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
    const cartId = await this.getScopedCart(slug, token);

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
    @Body() dto: GuestCheckoutDto,
    @Req() req?: any
  ) {
    const store = await this.getStoreBySlug(slug, req);

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
    const store = await this.prisma.store.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
    const order = store && await this.prisma.order.findFirst({ where: { storeId: store.id, orderNumber }, select: { id: true } });
    if (!order) throw new NotFoundException('Order not found in this store.');
    return this.ordersService.trackOrder(orderNumber, token);
  }
}
