import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient, ProductStatus, VariantStatus } from '@prisma/client';
import { CreateProductDto } from './dto/catalog.dto';
import { TenantContext } from '@simply/types';
import { normalizeSlug } from '@simply/validation';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaClient) {}

  public async createProduct(
    tenant: TenantContext,
    dto: CreateProductDto,
    actorId?: string
  ) {
    const slug = normalizeSlug(dto.slug);

    // Verify slug uniqueness within store
    const existing = await this.prisma.product.findFirst({
      where: { storeId: tenant.storeId, slug, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Product slug "${slug}" already exists in this store.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Product root
      const product = await tx.product.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          description: dto.description,
          mode: dto.mode as any,
          status: ProductStatus.PUBLISHED,
          minOrderQuantity: dto.minOrderQuantity || 1,
          leadTimeDays: dto.leadTimeDays,
          brochureUrl: dto.brochureUrl,
          specifications: dto.specifications,
          enquiryCtaText: dto.enquiryCtaText || 'Request Quotation',
        },
      });

      // 2. Create Options and Option Values
      const optionValueMap = new Map<string, string>(); // valueString -> OptionValueId

      for (let i = 0; i < dto.options.length; i++) {
        const optDto = dto.options[i];
        const opt = await tx.productOption.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            productId: product.id,
            name: optDto.name,
            type: optDto.type as any,
            sortOrder: i,
          },
        });

        for (let j = 0; j < optDto.values.length; j++) {
          const valDto = optDto.values[j];
          const optVal = await tx.productOptionValue.create({
            data: {
              optionId: opt.id,
              value: valDto.value,
              colorHex: valDto.colorHex,
              sortOrder: j,
            },
          });
          optionValueMap.set(valDto.value, optVal.id);
        }
      }

      // 3. Create Variants & Initial Inventory
      for (let i = 0; i < dto.variants.length; i++) {
        const varDto = dto.variants[i];

        // Check SKU uniqueness within store
        const existingSku = await tx.productVariant.findFirst({
          where: { storeId: tenant.storeId, sku: varDto.sku, deletedAt: null },
        });
        if (existingSku) {
          throw new ConflictException(`SKU "${varDto.sku}" already exists in this store.`);
        }

        const variant = await tx.productVariant.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            productId: product.id,
            sku: varDto.sku,
            barcode: varDto.barcode,
            pricePaise: varDto.pricePaise,
            compareAtPricePaise: varDto.compareAtPricePaise,
            status: VariantStatus.ACTIVE,
            sortOrder: i,
          },
        });

        // Link variant to option values
        for (const valString of varDto.optionValues) {
          const optValId = optionValueMap.get(valString);
          if (optValId) {
            await tx.productVariantOptionValue.create({
              data: {
                variantId: variant.id,
                optionValueId: optValId,
              },
            });
          }
        }

        // Initialize inventory
        await tx.inventory.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            variantId: variant.id,
            stockOnHand: varDto.initialStock,
            stockReserved: 0,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: product.id,
          metadata: { name: product.name, slug: product.slug, variantCount: dto.variants.length },
        },
      });

      return product;
    });
  }

  public async getProducts(
    tenant: TenantContext,
    params: { search?: string; categoryId?: string; page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
      deletedAt: null,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: params.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { deletedAt: null },
            include: { inventory: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  public async getProductById(tenant: TenantContext, productId: string) {
    // Strictly scoped by tenantId & storeId for tenant isolation
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.tenantId,
        storeId: tenant.storeId,
        deletedAt: null,
      },
      include: {
        category: true,
        media: { orderBy: { sortOrder: 'asc' } },
        options: { include: { values: { orderBy: { sortOrder: 'asc' } } } },
        variants: {
          where: { deletedAt: null },
          include: {
            inventory: true,
            optionValues: { include: { optionValue: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found in this store.`);
    }

    return product;
  }

  public async deleteProduct(tenant: TenantContext, productId: string, actorId?: string) {
    const product = await this.getProductById(tenant, productId);

    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.product.update({
        where: { id: product.id },
        data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
      });

      await tx.productVariant.updateMany({
        where: { productId: product.id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'PRODUCT_DELETED',
          entityType: 'Product',
          entityId: product.id,
          metadata: { name: product.name, slug: product.slug },
        },
      });

      return deleted;
    });
  }

  public async updateProduct(
    tenant: TenantContext,
    productId: string,
    dto: Partial<CreateProductDto>,
    actorId?: string
  ) {
    const product = await this.getProductById(tenant, productId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          name: dto.name ?? product.name,
          description: dto.description ?? product.description,
          mode: (dto.mode as any) ?? product.mode,
          categoryId: dto.categoryId ?? product.categoryId,
          minOrderQuantity: dto.minOrderQuantity ?? product.minOrderQuantity,
          leadTimeDays: dto.leadTimeDays ?? product.leadTimeDays,
          brochureUrl: dto.brochureUrl ?? product.brochureUrl,
          specifications: (dto.specifications as any) ?? product.specifications,
          enquiryCtaText: dto.enquiryCtaText ?? product.enquiryCtaText,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'PRODUCT_UPDATED',
          entityType: 'Product',
          entityId: product.id,
          metadata: { name: updated.name },
        },
      });

      return updated;
    });
  }

  public async duplicateProduct(tenant: TenantContext, productId: string, actorId?: string) {
    const original = await this.getProductById(tenant, productId);

    const baseSlug = `${original.slug}-copy`;
    let newSlug = baseSlug;
    let counter = 1;
    while (await this.prisma.product.findFirst({ where: { storeId: tenant.storeId, slug: newSlug } })) {
      newSlug = `${baseSlug}-${counter++}`;
    }

    return this.prisma.$transaction(async (tx) => {
      const duplicated = await tx.product.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          categoryId: original.categoryId,
          name: `${original.name} (Copy)`,
          slug: newSlug,
          description: original.description,
          mode: original.mode,
          status: ProductStatus.DRAFT,
          minOrderQuantity: original.minOrderQuantity,
          leadTimeDays: original.leadTimeDays,
          brochureUrl: original.brochureUrl,
          specifications: original.specifications || undefined,
          enquiryCtaText: original.enquiryCtaText,
        },
      });

      // Clone variants
      for (const v of original.variants) {
        const newSku = `${v.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
        const newVariant = await tx.productVariant.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            productId: duplicated.id,
            sku: newSku,
            barcode: v.barcode,
            pricePaise: v.pricePaise,
            compareAtPricePaise: v.compareAtPricePaise,
            status: VariantStatus.ACTIVE,
            sortOrder: v.sortOrder,
          },
        });

        // Initialize inventory
        await tx.inventory.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            variantId: newVariant.id,
            stockOnHand: v.inventory?.stockOnHand || 0,
            stockReserved: 0,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'PRODUCT_DUPLICATED',
          entityType: 'Product',
          entityId: duplicated.id,
          metadata: { originalId: original.id, newName: duplicated.name },
        },
      });

      return duplicated;
    });
  }

  public async getCategories(tenant: TenantContext) {
    return this.prisma.category.findMany({
      where: { storeId: tenant.storeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  public async createCategory(tenant: TenantContext, dto: { name: string; description?: string }) {
    const baseSlug = normalizeSlug(dto.name);
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.category.findFirst({ where: { storeId: tenant.storeId, slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    return this.prisma.category.create({
      data: {
        tenantId: tenant.tenantId,
        storeId: tenant.storeId,
        name: dto.name,
        slug,
        description: dto.description,
      },
    });
  }
}
