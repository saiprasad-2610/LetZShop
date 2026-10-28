import { visibleCategoryCount } from '../catalog/category-counts';
import { storeSlugBase, storeSlugCandidate, withUniqueStoreSlug } from './store-identity';
import { publicProduct } from './public-product';
import { normalizePublicMedia } from '../media/public-media-reference';
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, StoreStatus } from '@prisma/client';
import { normalizeSlug, isReservedSlug, normalizePhone, normalizeBusinessName, isValidBusinessName } from '@simply/validation';
import { SubscriptionVisibilityService } from '../subscriptions/subscription-visibility.service';
import { AuthenticatedUser, normalizeBrandText, normalizeThemeSocialLinks, normalizeSocialLinks } from '@simply/types';
import { OnboardMerchantDto } from './dto/onboard-merchant.dto';

export interface CreateStoreInput {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string;
}

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly visibilityService: SubscriptionVisibilityService
  ) {}

  public async createStore(input: CreateStoreInput, actorId?: string) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 100) throw new BadRequestException('Business name must contain 2–100 characters.');
    if (input.slug !== undefined && typeof input.slug !== 'string') throw new BadRequestException('Store slug must be a string.');
    const cleanSlug = normalizeSlug(input.slug || '');

    if (isReservedSlug(cleanSlug)) {
      throw new BadRequestException(`The slug "${cleanSlug}" is reserved by the platform. Please choose another.`);
    }

    return withUniqueStoreSlug(cleanSlug || input.name, (slug) => this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          tenantId: input.tenantId,
          name: input.name.trim(),
          slug,
          description: input.description,
          status: StoreStatus.DRAFT,
          isPubliclyAccessible: false,
        },
      });

      // Initialize default branding
      await tx.storeBranding.create({
        data: {
          storeId: store.id,
          primaryColor: '#1E3A8A',
          accentColor: '#D97706',
          fontHeading: 'Inter',
          fontBody: 'Inter',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId,
          tenantId: input.tenantId,
          storeId: store.id,
          action: 'STORE_CREATED',
          entityType: 'Store',
          entityId: store.id,
          metadata: { name: store.name, slug: store.slug },
        },
      });

      return store;
    }));
  }

  public async suggestSlug(name: string) {
    const base = storeSlugBase(name);
    for (let attempt = 0; attempt < 24; attempt++) {
      const slug = storeSlugCandidate(base, attempt);
      const [store, tenant] = await Promise.all([
        this.prisma.store.findUnique({ where: { slug }, select: { id: true } }),
        this.prisma.tenant.findUnique({ where: { slug }, select: { id: true } }),
      ]);
      if (!store && !tenant) return { slug, available: attempt === 0 && !isReservedSlug(normalizeSlug(name)), suggested: attempt > 0 || isReservedSlug(normalizeSlug(name)) };
    }
    throw new ConflictException('Please try checking the store URL again.');
  }

  public async getStoreByTenantId(tenantId: string) {
    const store = await this.prisma.store.findFirst({
      where: { tenantId, deletedAt: null },
      include: {
        branding: true,
        themeConfigs: { orderBy: { updatedAt: 'desc' } },
        sections: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
        shippingProfiles: true,
      },
    });

    if (!store) throw new NotFoundException('Store not found for this merchant.');
    return { ...store, publicVisibility: await this.visibilityService.getEffectivePublicStatus(store.id) };
  }

  public evaluatePublicVisibility(slug: string, options?: { previewSecret?: string; authenticatedUser?: AuthenticatedUser | null }) {
    return this.visibilityService.evaluateVisibility(slug, options);
  }

  public async getPublicStorefront(
    slug: string,
    options?: {
      previewSecret?: string;
      authenticatedUser?: AuthenticatedUser | null;
    }
  ) {
    // 1. Evaluate server-side visibility rules (strictly subscription-gated)
    const { store, isPreview } = await this.visibilityService.evaluateVisibility(slug, options);

    // 2. Fetch public storefront data
    const fullStore = await this.prisma.store.findUnique({
      where: { id: store.id },
      include: {
        branding: true,
        themeConfigs: { include: { theme: true }, orderBy: { updatedAt: 'desc' } },
        themeConfiguration: { include: { themeDefinition: true } },
        sections: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
        businessHours: { orderBy: { dayOfWeek: 'asc' } },
        categories: { where: { isActive: true, tenantId: store.tenantId }, orderBy: { sortOrder: 'asc' }, take: 100, include: { _count: { select: visibleCategoryCount(store.id, store.tenantId) } } },
        products: {
          take: 100,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          where: { status: 'PUBLISHED', deletedAt: null },
          include: {
            media: {
              include: {
                mediaAsset: true,
                optionValue: { include: { option: true } },
                variant: true,
              },
              orderBy: { sortOrder: 'asc' },
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
        },
      },
    });

    const paymentAccount = fullStore?.id
      ? await this.prisma.merchantPaymentAccount.findFirst({
          where: { storeId: fullStore.id },
        })
      : null;
    const paymentCaps = (paymentAccount?.capabilities as any) || {};
    const codEnabled = paymentCaps.codEnabled !== false;
    const razorpayConfigured = !!(
      paymentAccount?.keyId &&
      paymentAccount?.keySecretEncrypted &&
      paymentAccount?.isEnabled !== false &&
      !paymentAccount.keyId.includes('dummy') &&
      !paymentAccount.keyId.includes('mock')
    );

    const shippingProfile = fullStore?.id
      ? await this.prisma.shippingProfile.findFirst({
          where: { storeId: fullStore.id, isDefault: true },
        })
      : null;

    const activeThemeDef = fullStore?.themeConfiguration?.themeDefinition;
    const activeLegacyConfig = fullStore?.themeConfigs?.[0];
    const themeKey = activeThemeDef?.key || (activeLegacyConfig?.theme?.code ? activeLegacyConfig.theme.code.toUpperCase() : 'ATELIER');
    const themeVersion = activeThemeDef?.version || fullStore?.themeConfiguration?.themeVersion || '1.0.0';
    const themeJson = normalizePublicMedia(normalizeThemeSocialLinks(normalizeBrandText((fullStore?.themeConfiguration?.configuration as any) || (activeLegacyConfig?.configJson as any) || activeThemeDef?.defaultConfig || {})));

    const sanitizedBranding = {
      logoUrl: normalizePublicMedia({ logoUrl: fullStore?.branding?.logoUrl || null }).logoUrl,
      faviconUrl: normalizePublicMedia({ faviconUrl: fullStore?.branding?.faviconUrl || null }).faviconUrl,
      bannerUrl: themeJson?.pages?.home?.heroBannerUrl || (themeJson as any)?.branding?.bannerUrl || null,
      primaryColor: fullStore?.branding?.primaryColor || themeJson.palette?.primary || '#1C1917',
      accentColor: fullStore?.branding?.accentColor || themeJson.palette?.accent || '#D4AF37',
      fontHeading: fullStore?.branding?.fontHeading || themeJson.typography?.heading || 'Inter',
      fontBody: fullStore?.branding?.fontBody || themeJson.typography?.body || 'Inter',
      announcement: fullStore?.branding?.announcement || null,
    };

    const sanitizedStore = {
      id: fullStore?.id,
      name: fullStore?.name,
      slug: fullStore?.slug,
      description: fullStore?.description,
      status: fullStore?.status,
      defaultCurrency: fullStore?.defaultCurrency || 'INR',
      timezone: fullStore?.timezone || 'Asia/Kolkata',
      supportPhone: fullStore?.supportPhone,
      supportEmail: fullStore?.supportEmail,
      whatsappNumber: fullStore?.whatsappNumber,
      businessAddress: fullStore?.businessAddress,
      mapsUrl: fullStore?.mapsUrl,
      socialLinks: normalizeSocialLinks(fullStore?.socialLinks),
      fulfillmentMode: fullStore?.fulfillmentMode || 'DELIVERY',
      storefrontDefaultLocale: fullStore?.storefrontDefaultLocale || 'en-IN',
      enabledStorefrontLocales: fullStore?.enabledStorefrontLocales || ['en-IN', 'mr-IN', 'hi-IN'],
      businessHours: fullStore?.businessHours || [],
      branding: sanitizedBranding,
      sections: fullStore?.sections || [],
      paymentSettings: {
        codEnabled,
        razorpayEnabled: razorpayConfigured,
      },
      shippingSettings: {
        flatRatePaise: shippingProfile?.flatRatePaise ?? 0,
        freeShippingThresholdPaise: shippingProfile?.freeShippingThresholdPaise ?? null,
      },
    };

    return {
      store: sanitizedStore,
      branding: sanitizedBranding,
      theme: {
        key: themeKey,
        name: activeThemeDef?.name || themeKey,
        version: themeVersion,
        configuration: themeJson,
        capabilities: activeThemeDef?.capabilities || {},
      },
      themeConfig: {
        themeId: typeof themeKey === 'string' ? themeKey.toLowerCase() : 'atelier',
        ...themeJson,
        palette: {
          primary: fullStore?.branding?.primaryColor || themeJson.palette?.primary || '#1C1917',
          accent: fullStore?.branding?.accentColor || themeJson.palette?.accent || '#D4AF37',
          background: themeJson.palette?.background || '#FFFFFF',
        },
      },
      sections: fullStore?.sections || [],
      categories: (fullStore?.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        mediaAssetId: c.mediaAssetId,
        visibleProductCount: c._count.products,
        _count: c._count,
        sortOrder: c.sortOrder,
      })),
      products: (fullStore?.products || []).map(publicProduct),
      isPreview,
    };
  }

  public async onboardMerchant(
    user: AuthenticatedUser,
    input: OnboardMerchantDto
  ) {
    const normalizedName = normalizeBusinessName(input.businessName);
    if (!normalizedName || !isValidBusinessName(normalizedName)) {
      throw new BadRequestException('Business name is required and must be between 2 and 100 characters.');
    }

    // Duplicate onboarding prevention: Check if user already owns an active store
    const existingMembership = await this.prisma.tenantMembership.findFirst({
      where: {
        userId: user.userId,
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            stores: {
              where: { deletedAt: null },
              take: 1,
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (existingMembership?.tenant?.stores?.[0]) {
      return {
        tenant: existingMembership.tenant,
        store: existingMembership.tenant.stores[0],
      };
    }

    return withUniqueStoreSlug(normalizedName, (candidateSlug) => this.prisma.$transaction(async (tx) => {
      // Serialize duplicate setup requests for one account, while different merchants proceed independently.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.userId} FOR UPDATE`;
      const currentMembership = await tx.tenantMembership.findFirst({
        where: { userId: user.userId, isActive: true },
        include: { tenant: { include: { stores: { where: { deletedAt: null }, take: 1, orderBy: { createdAt: 'asc' } } } } },
      });
      if (currentMembership?.tenant.stores[0]) return { tenant: currentMembership.tenant, store: currentMembership.tenant.stores[0] };

      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: normalizedName,
          slug: candidateSlug,
          status: 'ACTIVE' as any,
        },
      });

      // 2. Create Tenant Membership for user
      await tx.tenantMembership.create({
        data: {
          userId: user.userId,
          tenantId: tenant.id,
          role: 'SELLER_OWNER' as any,
          isActive: true,
        },
      });

      // 3. Create Store in PRIVATE_PREVIEW
      const store = await tx.store.create({
        data: {
          tenantId: tenant.id,
          name: normalizedName,
          slug: candidateSlug,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
          supportPhone: input.contactPhone ? normalizePhone(input.contactPhone) : null,
          supportEmail: input.contactEmail || null,
          businessAddress: input.address || null,
        },
      });

      // 4. Create StoreBranding with business category and logo
      await tx.storeBranding.create({
        data: {
          storeId: store.id,
          logoUrl: input.logoUrl || null,
          primaryColor: '#1E3A8A',
          accentColor: '#D97706',
          fontHeading: 'Inter',
          fontBody: 'Inter',
          announcement: `Welcome to ${normalizedName}`,
        },
      });

      // 5. Create default sections so store never looks empty
      const defaultSections = [
        { sectionType: 'hero', title: `Welcome to ${normalizedName}`, sortOrder: 0, isEnabled: true },
        { sectionType: 'featured_products', title: 'Featured Products', sortOrder: 1, isEnabled: true },
        { sectionType: 'categories', title: 'Shop By Category', sortOrder: 2, isEnabled: true },
        { sectionType: 'about_business', title: 'About Our Business', sortOrder: 3, isEnabled: true },
        { sectionType: 'contact', title: 'Get In Touch', sortOrder: 4, isEnabled: true },
      ];

      for (const sec of defaultSections) {
        await tx.storeSection.create({
          data: {
            storeId: store.id,
            sectionType: sec.sectionType,
            title: sec.title,
            sortOrder: sec.sortOrder,
            isEnabled: sec.isEnabled,
          },
        });
      }

      // 6. Update user's active session to bind new tenant and store
      if (user.sessionId) {
        await tx.session.update({
          where: { id: user.sessionId },
          data: {
            tenantId: tenant.id,
            storeId: store.id,
          },
        });
      }

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.userId,
          tenantId: tenant.id,
          storeId: store.id,
          action: 'SELLER_ONBOARDED',
          entityType: 'Store',
          entityId: store.id,
          metadata: {
            businessName: normalizedName,
            category: input.category,
            slug: candidateSlug,
          },
        },
      });

      return {
        tenant,
        store,
      };
    }));
  }

  public async getStoreMetrics(tenantId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, tenantId, deletedAt: null },
      include: {
        branding: true,
        tenant: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const [
      orders,
      enquiries,
      customersCount,
      lowStockCount,
      activeSubscription,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { storeId },
        select: { id: true, totalPaise: true, status: true, paymentStatus: true, shipmentStatus: true },
      }),
      this.prisma.enquiry.findMany({
        where: { storeId },
        select: { id: true, status: true },
      }),
      this.prisma.customer.count({
        where: { storeId },
      }),
      this.prisma.inventory.count({
        where: {
          storeId,
          stockOnHand: { lte: 5 },
          variant: {
            deletedAt: null,
            status: 'ACTIVE',
            product: { deletedAt: null },
          },
        },
      }),
      this.prisma.subscription.findFirst({
        where: { tenantId, status: 'ACTIVE' },
      }),
    ]);

    const totalSalesPaise = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.totalPaise, 0);

    const newOrdersCount = orders.filter((o) => o.status === 'NEW').length;
    const newEnquiriesCount = enquiries.filter((e) => e.status === 'NEW').length;
    const paymentProblemsCount = orders.filter((o) => o.paymentStatus === 'FAILED').length;
    const shippingProblemsCount = orders.filter((o) => o.shipmentStatus === 'CANCELLED' || o.shipmentStatus === 'RTO').length;

    // Determine current live status
    let currentStatus: string = store.status;
    if (activeSubscription) {
      if (new Date() > new Date(activeSubscription.currentPeriodEnd)) {
        currentStatus = 'EXPIRED';
      }
    } else if (store.status === StoreStatus.LIVE) {
      currentStatus = 'EXPIRED';
    }

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: currentStatus,
        isPubliclyAccessible: store.isPubliclyAccessible,
        paidThrough: activeSubscription?.currentPeriodEnd || null,
        planName: activeSubscription?.planId || 'None',
        branding: store.branding,
      },
      metrics: {
        totalSalesPaise,
        totalOrders: orders.length,
        totalEnquiries: enquiries.length,
        totalCustomers: customersCount,
      },
      needsAttention: {
        newOrders: newOrdersCount,
        newEnquiries: newEnquiriesCount,
        lowStock: lowStockCount,
        paymentProblems: paymentProblemsCount,
        shippingProblems: shippingProblemsCount,
      },
    };
  }
}
