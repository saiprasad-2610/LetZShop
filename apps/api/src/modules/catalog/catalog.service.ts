import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaClient, ProductStatus, VariantStatus, ProductMode } from '@prisma/client';
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
    // Mode & Price validation
    if (dto.mode === ProductMode.SELL_ONLINE || dto.mode === ProductMode.SELL_AND_ENQUIRY) {
      const hasVariantWithPrice =
        dto.variants &&
        dto.variants.length > 0 &&
        dto.variants.some((v) => v.pricePaise !== undefined && v.pricePaise !== null);
      if (!hasVariantWithPrice) {
        if (dto.pricePaise === undefined || dto.pricePaise === null || isNaN(dto.pricePaise)) {
          throw new BadRequestException('Price is required for products that can be sold online.');
        }
        if (dto.pricePaise < 0) {
          throw new BadRequestException('Price cannot be negative.');
        }
      }
    }

    // Enforce Product Media Limit: 1 to 3 images, at least 1 compulsory
    if (!dto.mediaAssetIds || !Array.isArray(dto.mediaAssetIds) || dto.mediaAssetIds.length < 1) {
      throw new BadRequestException('Every product needs at least one image.');
    }
    if (dto.mediaAssetIds.length > 3) {
      throw new BadRequestException('A maximum of 3 images is allowed per product.');
    }

    // Derive unique slug within store
    let baseSlug = normalizeSlug(dto.slug || dto.name);
    if (!baseSlug) baseSlug = 'product';
    let slug = baseSlug;
    let counter = 1;
    while (
      await this.prisma.product.findFirst({
        where: { storeId: tenant.storeId, slug, deletedAt: null },
      })
    ) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Validate category belongs to this store if provided
    if (dto.categoryId) {
      const categoryExists = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId: tenant.storeId },
      });
      if (!categoryExists) {
        throw new BadRequestException(`Category with ID "${dto.categoryId}" does not exist in this store.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Product root
      const product = await tx.product.create({
        data: {
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          categoryId: dto.categoryId ? dto.categoryId : null,
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

      let baseVariantId: string | null = null;

      // 2. Create Options and Option Values if provided
      const optionValueMap = new Map<string, string>(); // valueString -> OptionValueId

      if (dto.options && dto.options.length > 0) {
        if (dto.options.length > 3) {
          throw new BadRequestException('A maximum of 3 option dimensions is supported.');
        }
        let totalCombos = 1;
        const optNames = new Set<string>();
        for (const opt of dto.options) {
          const trimmedName = (opt.name || '').trim();
          if (!trimmedName) {
            throw new BadRequestException('Option name is required.');
          }
          if (optNames.has(trimmedName.toLowerCase())) {
            throw new BadRequestException(`Duplicate option name "${trimmedName}".`);
          }
          optNames.add(trimmedName.toLowerCase());

          if (!opt.values || opt.values.length === 0) {
            throw new BadRequestException(`Option "${opt.name}" must have at least one value.`);
          }
          if (opt.values.length > 20) {
            throw new BadRequestException(`Option "${opt.name}" exceeds the limit of 20 values.`);
          }
          const valSet = new Set<string>();
          for (const valDto of opt.values) {
            const vTrim = (valDto.value || '').trim();
            if (!vTrim) {
              throw new BadRequestException(`Empty option value in option "${opt.name}".`);
            }
            if (valSet.has(vTrim.toLowerCase())) {
              throw new BadRequestException(`Duplicate value "${vTrim}" in option "${opt.name}".`);
            }
            valSet.add(vTrim.toLowerCase());
          }
          totalCombos *= opt.values.length;
        }

        if (totalCombos > 100) {
          throw new BadRequestException(
            `This combination would create ${totalCombos} variants. Reduce option values to continue.`
          );
        }

        for (let i = 0; i < dto.options.length; i++) {
          const optDto = dto.options[i];
          const opt = await tx.productOption.create({
            data: {
              tenantId: tenant.tenantId,
              storeId: tenant.storeId,
              productId: product.id,
              name: optDto.name.trim(),
              type: optDto.type as any,
              sortOrder: i,
            },
          });

          for (let j = 0; j < optDto.values.length; j++) {
            const valDto = optDto.values[j];
            const optVal = await tx.productOptionValue.create({
              data: {
                optionId: opt.id,
                value: valDto.value.trim(),
                colorHex: valDto.colorHex,
                sortOrder: j,
              },
            });
            optionValueMap.set(valDto.value.trim(), optVal.id);
          }
        }
      }

      // 3. Create Variants & Initial Inventory
      if (dto.variants && dto.variants.length > 0) {
        for (let i = 0; i < dto.variants.length; i++) {
          const varDto = dto.variants[i];

          // Check SKU uniqueness within store
          const existingSku = await tx.productVariant.findFirst({
            where: { storeId: tenant.storeId, sku: varDto.sku, deletedAt: null },
          });
          if (existingSku) {
            throw new ConflictException(`SKU "${varDto.sku}" already exists in this store.`);
          }

          const pricePaise =
            varDto.pricePaise ?? (product.mode === ProductMode.ENQUIRY_ONLY ? 0 : (dto.pricePaise ?? 0));
          const compareAtPaise = varDto.compareAtPricePaise ?? dto.compareAtPricePaise;
          const stockQty = varDto.stock ?? varDto.initialStock ?? 0;

          const variant = await tx.productVariant.create({
            data: {
              tenantId: tenant.tenantId,
              storeId: tenant.storeId,
              productId: product.id,
              sku: varDto.sku,
              barcode: varDto.barcode,
              pricePaise,
              compareAtPricePaise: compareAtPaise,
              status: varDto.status || VariantStatus.ACTIVE,
              sortOrder: i,
            },
          });

          if (i === 0) baseVariantId = variant.id;

          // Link variant to option values
          if (varDto.optionValues && Array.isArray(varDto.optionValues)) {
            for (const valString of varDto.optionValues) {
              const optValId = optionValueMap.get(valString.trim());
              if (optValId) {
                await tx.productVariantOptionValue.create({
                  data: {
                    variantId: variant.id,
                    optionValueId: optValId,
                  },
                });
              }
            }
          }

          // Initialize inventory
          await tx.inventory.create({
            data: {
              tenantId: tenant.tenantId,
              storeId: tenant.storeId,
              variantId: variant.id,
              stockOnHand: stockQty,
              stockReserved: 0,
            },
          });

          // Link variant media asset if provided
          if (varDto.mediaAssetId) {
            const asset = await tx.mediaAsset.findFirst({
              where: { id: varDto.mediaAssetId, tenantId: tenant.tenantId },
            });
            if (asset) {
              await tx.productMedia.create({
                data: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  productId: product.id,
                  variantId: variant.id,
                  mediaAssetId: asset.id,
                  storageKey: asset.storageKey,
                  publicUrl: asset.publicUrl,
                  filePath: asset.storageKey,
                  mimeType: asset.mimeType,
                  sizeBytes: asset.sizeBytes,
                  altText: asset.altText || `${product.name} - ${varDto.sku}`,
                  sortOrder: 100 + i,
                },
              });
            }
          }
        }
      } else {
        // Base single-product variant
        let sku = (dto.sku || '').trim().toUpperCase();
        if (!sku) {
          const prefix = slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'PROD';
          sku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        const existingSku = await tx.productVariant.findFirst({
          where: { storeId: tenant.storeId, sku, deletedAt: null },
        });
        if (existingSku) {
          if (dto.sku) {
            throw new ConflictException(`SKU "${dto.sku}" already exists in this store.`);
          }
          sku = `${sku}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const initialStock = dto.stock !== undefined ? dto.stock : 0;
        const basePrice = dto.pricePaise !== undefined ? dto.pricePaise : 0;
        const comparePrice = dto.compareAtPricePaise !== undefined ? dto.compareAtPricePaise : null;

        const baseVariant = await tx.productVariant.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            productId: product.id,
            sku,
            pricePaise: basePrice,
            compareAtPricePaise: comparePrice,
            status: VariantStatus.ACTIVE,
            sortOrder: 0,
          },
        });
        baseVariantId = baseVariant.id;

        await tx.inventory.create({
          data: {
            tenantId: tenant.tenantId,
            storeId: tenant.storeId,
            variantId: baseVariant.id,
            stockOnHand: initialStock,
            stockReserved: 0,
          },
        });
      }

      // 4. Attach Media Assets if provided
      if (dto.mediaAssetIds && dto.mediaAssetIds.length > 0) {
        for (let i = 0; i < dto.mediaAssetIds.length; i++) {
          const assetId = dto.mediaAssetIds[i];
          const asset = await tx.mediaAsset.findFirst({
            where: { id: assetId, tenantId: tenant.tenantId },
          });
          if (asset) {
            await tx.productMedia.create({
              data: {
                tenantId: tenant.tenantId,
                storeId: tenant.storeId,
                productId: product.id,
                variantId: baseVariantId,
                mediaAssetId: asset.id,
                storageKey: asset.storageKey,
                publicUrl: asset.publicUrl,
                filePath: asset.storageKey,
                mimeType: asset.mimeType,
                sizeBytes: asset.sizeBytes,
                altText: asset.altText || product.name,
                sortOrder: i,
              },
            });
          }
        }
      }

      // 5. Create Product Attributes if provided
      if (dto.attributes && Array.isArray(dto.attributes)) {
        for (let i = 0; i < dto.attributes.length; i++) {
          const attr = dto.attributes[i];
          if (attr.name && attr.value) {
            await tx.productAttribute.create({
              data: {
                productId: product.id,
                name: attr.name,
                value: attr.value,
                type: attr.type || 'TEXT',
                sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : i,
              },
            });
          }
        }
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: tenant.tenantId,
          storeId: tenant.storeId,
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: product.id,
          metadata: { name: product.name, slug: product.slug },
        },
      });

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { deletedAt: null },
            include: { inventory: true },
          },
          category: true,
        },
      });
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
      if (params.categoryId === 'uncategorized') {
        where.categoryId = null;
      } else {
        where.categoryId = params.categoryId;
      }
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
          category: true,
          media: { orderBy: { sortOrder: 'asc' } },
          attributes: { orderBy: { sortOrder: 'asc' } },
          documents: { orderBy: { sortOrder: 'asc' } },
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
        attributes: { orderBy: { sortOrder: 'asc' } },
        documents: { orderBy: { sortOrder: 'asc' } },
        options: { include: { values: { orderBy: { sortOrder: 'asc' } } } },
        variants: {
          where: { deletedAt: null },
          include: {
            inventory: true,
            optionValues: { include: { optionValue: { include: { option: true } } } },
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
        data: { deletedAt: new Date(), status: VariantStatus.DISCONTINUED },
      });

      await tx.inventory.updateMany({
        where: { variant: { productId: product.id } },
        data: { stockOnHand: 0 },
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

    if (dto.mediaAssetIds !== undefined) {
      if (!Array.isArray(dto.mediaAssetIds) || dto.mediaAssetIds.length < 1) {
        throw new BadRequestException('Every product needs at least one image.');
      }
      if (dto.mediaAssetIds.length > 3) {
        throw new BadRequestException('A maximum of 3 images is allowed per product.');
      }
    }

    if (dto.categoryId !== undefined && dto.categoryId) {
      const categoryExists = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, storeId: tenant.storeId },
      });
      if (!categoryExists) {
        throw new BadRequestException(`Category with ID "${dto.categoryId}" does not exist in this store.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: product.id },
        data: {
          name: dto.name ?? product.name,
          description: dto.description !== undefined ? dto.description : product.description,
          mode: (dto.mode as any) ?? product.mode,
          categoryId: dto.categoryId !== undefined ? (dto.categoryId || null) : product.categoryId,
          minOrderQuantity: dto.minOrderQuantity ?? product.minOrderQuantity,
          leadTimeDays: dto.leadTimeDays !== undefined ? dto.leadTimeDays : product.leadTimeDays,
          brochureUrl: dto.brochureUrl !== undefined ? (dto.brochureUrl || null) : product.brochureUrl,
          specifications: (dto.specifications as any) ?? product.specifications,
          enquiryCtaText: dto.enquiryCtaText ?? product.enquiryCtaText,
        },
      });

      // 2. Options and Variants update if provided
      if (dto.options !== undefined && dto.variants !== undefined) {
        // Validation: Combination safety
        if (dto.options && dto.options.length > 0) {
          if (dto.options.length > 3) {
            throw new BadRequestException('A maximum of 3 option dimensions is supported.');
          }
          let totalCombos = 1;
          const optNames = new Set<string>();
          for (const opt of dto.options) {
            const trimmedName = (opt.name || '').trim();
            if (!trimmedName) {
              throw new BadRequestException('Option name is required.');
            }
            if (optNames.has(trimmedName.toLowerCase())) {
              throw new BadRequestException(`Duplicate option name "${trimmedName}".`);
            }
            optNames.add(trimmedName.toLowerCase());

            if (!opt.values || opt.values.length === 0) {
              throw new BadRequestException(`Option "${opt.name}" must have at least one value.`);
            }
            if (opt.values.length > 20) {
              throw new BadRequestException(`Option "${opt.name}" exceeds the limit of 20 values.`);
            }
            const valSet = new Set<string>();
            for (const valDto of opt.values) {
              const vTrim = (valDto.value || '').trim();
              if (!vTrim) {
                throw new BadRequestException(`Empty option value in option "${opt.name}".`);
              }
              if (valSet.has(vTrim.toLowerCase())) {
                throw new BadRequestException(`Duplicate value "${vTrim}" in option "${opt.name}".`);
              }
              valSet.add(vTrim.toLowerCase());
            }
            totalCombos *= opt.values.length;
          }

          if (totalCombos > 100) {
            throw new BadRequestException(
              `This combination would create ${totalCombos} variants. Reduce option values to continue.`
            );
          }
        }

        // Recreate options transactionally
        await tx.productOption.deleteMany({ where: { productId: product.id } });
        const optionValueMap = new Map<string, string>();

        if (dto.options && dto.options.length > 0) {
          for (let i = 0; i < dto.options.length; i++) {
            const optDto = dto.options[i];
            const opt = await tx.productOption.create({
              data: {
                tenantId: tenant.tenantId,
                storeId: tenant.storeId,
                productId: product.id,
                name: optDto.name.trim(),
                type: optDto.type as any,
                sortOrder: i,
              },
            });

            for (let j = 0; j < optDto.values.length; j++) {
              const valDto = optDto.values[j];
              const optVal = await tx.productOptionValue.create({
                data: {
                  optionId: opt.id,
                  value: valDto.value.trim(),
                  colorHex: valDto.colorHex,
                  sortOrder: j,
                },
              });
              optionValueMap.set(valDto.value.trim(), optVal.id);
            }
          }
        }

        // Sync variants
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: product.id, deletedAt: null },
        });

        const touchedVariantIds = new Set<string>();

        if (dto.variants && dto.variants.length > 0) {
          for (let i = 0; i < dto.variants.length; i++) {
            const varDto = dto.variants[i];
            const matched = existingVariants.find(
              (v) => (varDto.id && v.id === varDto.id) || v.sku === varDto.sku
            );

            let variantId: string;
            const pricePaise =
              varDto.pricePaise ?? (product.mode === ProductMode.ENQUIRY_ONLY ? 0 : (dto.pricePaise ?? 0));
            const compareAtPaise = varDto.compareAtPricePaise ?? dto.compareAtPricePaise;
            const stockQty = varDto.stock ?? varDto.initialStock ?? 0;

            if (matched) {
              variantId = matched.id;
              await tx.productVariant.update({
                where: { id: matched.id },
                data: {
                  sku: varDto.sku,
                  pricePaise,
                  compareAtPricePaise: compareAtPaise,
                  status: varDto.status || VariantStatus.ACTIVE,
                  sortOrder: i,
                },
              });

              // Re-link option values
              await tx.productVariantOptionValue.deleteMany({ where: { variantId: matched.id } });
              if (varDto.optionValues && Array.isArray(varDto.optionValues)) {
                for (const valString of varDto.optionValues) {
                  const optValId = optionValueMap.get(valString.trim());
                  if (optValId) {
                    await tx.productVariantOptionValue.create({
                      data: { variantId: matched.id, optionValueId: optValId },
                    });
                  }
                }
              }

              // Update inventory
              await tx.inventory.upsert({
                where: { variantId: matched.id },
                create: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  variantId: matched.id,
                  stockOnHand: stockQty,
                  stockReserved: 0,
                },
                update: {
                  stockOnHand: stockQty,
                },
              });
            } else {
              // Check SKU uniqueness
              const existingSku = await tx.productVariant.findFirst({
                where: { storeId: tenant.storeId, sku: varDto.sku, deletedAt: null },
              });
              if (existingSku) {
                throw new ConflictException(`SKU "${varDto.sku}" already exists in this store.`);
              }

              const newVariant = await tx.productVariant.create({
                data: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  productId: product.id,
                  sku: varDto.sku,
                  pricePaise,
                  compareAtPricePaise: compareAtPaise,
                  status: varDto.status || VariantStatus.ACTIVE,
                  sortOrder: i,
                },
              });
              variantId = newVariant.id;

              if (varDto.optionValues && Array.isArray(varDto.optionValues)) {
                for (const valString of varDto.optionValues) {
                  const optValId = optionValueMap.get(valString.trim());
                  if (optValId) {
                    await tx.productVariantOptionValue.create({
                      data: { variantId: newVariant.id, optionValueId: optValId },
                    });
                  }
                }
              }

              await tx.inventory.create({
                data: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  variantId: newVariant.id,
                  stockOnHand: stockQty,
                  stockReserved: 0,
                },
              });
            }

            touchedVariantIds.add(variantId);

            // Link variant media if provided
            if (varDto.mediaAssetId) {
              const asset = await tx.mediaAsset.findFirst({
                where: { id: varDto.mediaAssetId, tenantId: tenant.tenantId },
              });
              if (asset) {
                const existingMedia = await tx.productMedia.findFirst({
                  where: { productId: product.id, mediaAssetId: asset.id },
                });
                if (existingMedia) {
                  await tx.productMedia.update({
                    where: { id: existingMedia.id },
                    data: { variantId },
                  });
                } else {
                  await tx.productMedia.create({
                    data: {
                      tenantId: tenant.tenantId,
                      storeId: tenant.storeId,
                      productId: product.id,
                      variantId,
                      mediaAssetId: asset.id,
                      storageKey: asset.storageKey,
                      publicUrl: asset.publicUrl,
                      filePath: asset.storageKey,
                      mimeType: asset.mimeType,
                      sizeBytes: asset.sizeBytes,
                      altText: asset.altText || `${product.name} - ${varDto.sku}`,
                      sortOrder: 100 + i,
                    },
                  });
                }
              }
            }
          }

          // Soft delete old variants not touched
          for (const ev of existingVariants) {
            if (!touchedVariantIds.has(ev.id)) {
              await tx.productVariant.update({
                where: { id: ev.id },
                data: { deletedAt: new Date(), status: VariantStatus.DISCONTINUED },
              });
              await tx.inventory.updateMany({
                where: { variantId: ev.id },
                data: { stockOnHand: 0 },
              });
            }
          }
        }
      } else {
        // Fallback: update variant price, stock or SKU if base fields are supplied
        if (
          dto.pricePaise !== undefined ||
          dto.compareAtPricePaise !== undefined ||
          dto.stock !== undefined ||
          dto.sku !== undefined
        ) {
          const firstVariant = await tx.productVariant.findFirst({
            where: { productId: product.id, deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          });
          if (firstVariant) {
            const varUpdate: any = {};
            if (dto.pricePaise !== undefined) varUpdate.pricePaise = dto.pricePaise;
            if (dto.compareAtPricePaise !== undefined) varUpdate.compareAtPricePaise = dto.compareAtPricePaise;
            if (dto.sku !== undefined && dto.sku.trim()) varUpdate.sku = dto.sku.trim();
            if (Object.keys(varUpdate).length > 0) {
              await tx.productVariant.update({
                where: { id: firstVariant.id },
                data: varUpdate,
              });
            }
            if (dto.stock !== undefined) {
              await tx.inventory.upsert({
                where: { variantId: firstVariant.id },
                create: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  variantId: firstVariant.id,
                  stockOnHand: dto.stock,
                  stockReserved: 0,
                },
                update: {
                  stockOnHand: dto.stock,
                },
              });
            }
          }
        }
      }

      // 3. Media sync
      if (dto.mediaAssetIds && Array.isArray(dto.mediaAssetIds)) {
        // Remove media associations no longer present in mediaAssetIds
        await tx.productMedia.deleteMany({
          where: {
            productId: product.id,
            mediaAssetId: { notIn: dto.mediaAssetIds },
          },
        });

        for (let i = 0; i < dto.mediaAssetIds.length; i++) {
          const assetId = dto.mediaAssetIds[i];
          const existingMedia = await tx.productMedia.findFirst({
            where: { productId: product.id, mediaAssetId: assetId },
          });
          if (existingMedia) {
            await tx.productMedia.update({
              where: { id: existingMedia.id },
              data: { sortOrder: i },
            });
          } else {
            const asset = await tx.mediaAsset.findFirst({
              where: { id: assetId, tenantId: tenant.tenantId },
            });
            if (asset) {
              await tx.productMedia.create({
                data: {
                  tenantId: tenant.tenantId,
                  storeId: tenant.storeId,
                  productId: product.id,
                  mediaAssetId: asset.id,
                  storageKey: asset.storageKey,
                  publicUrl: asset.publicUrl,
                  filePath: asset.storageKey,
                  mimeType: asset.mimeType,
                  sizeBytes: asset.sizeBytes,
                  altText: asset.altText || product.name,
                  sortOrder: i,
                },
              });
            }
          }
        }
      }

      // 4. Attributes
      if (dto.attributes && Array.isArray(dto.attributes)) {
        await tx.productAttribute.deleteMany({
          where: { productId: product.id },
        });
        for (let i = 0; i < dto.attributes.length; i++) {
          const attr = dto.attributes[i];
          if (attr.name && attr.value) {
            await tx.productAttribute.create({
              data: {
                productId: product.id,
                name: attr.name,
                value: attr.value,
                type: attr.type || 'TEXT',
                sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : i,
              },
            });
          }
        }
      }

      // 5. Audit Log
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

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          options: { include: { values: { orderBy: { sortOrder: 'asc' } } } },
          variants: {
            where: { deletedAt: null },
            include: { inventory: true, optionValues: { include: { optionValue: { include: { option: true } } } } },
          },
          category: true,
        },
      });
    });
  }

  public async addProductDocument(
    tenant: TenantContext,
    productId: string,
    data: {
      title: string;
      docType?: string;
      fileUrl: string;
      fileSizeMb?: number;
      mediaAssetId?: string;
      sortOrder?: number;
    }
  ) {
    await this.getProductById(tenant, productId);
    return this.prisma.productDocument.create({
      data: {
        tenantId: tenant.tenantId,
        storeId: tenant.storeId,
        productId,
        title: data.title,
        docType: data.docType || 'DATASHEET',
        fileUrl: data.fileUrl,
        fileSizeMb: data.fileSizeMb,
        mediaAssetId: data.mediaAssetId,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  public async removeProductDocument(
    tenant: TenantContext,
    productId: string,
    docId: string
  ) {
    await this.getProductById(tenant, productId);
    const existing = await this.prisma.productDocument.findFirst({
      where: { id: docId, productId, storeId: tenant.storeId },
    });
    if (!existing) {
      throw new NotFoundException('Product document not found in this store.');
    }
    return this.prisma.productDocument.delete({
      where: { id: docId },
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
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
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

  public async updateCategory(
    tenant: TenantContext,
    categoryId: string,
    dto: { name?: string; description?: string }
  ) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId: tenant.storeId },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const data: any = {};
    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = normalizeSlug(dto.name);
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  public async deleteCategory(tenant: TenantContext, categoryId: string) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId: tenant.storeId },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Unlink products so they become Uncategorized
      await tx.product.updateMany({
        where: { categoryId, storeId: tenant.storeId },
        data: { categoryId: null },
      });

      return tx.category.delete({
        where: { id: categoryId },
      });
    });
  }
}
