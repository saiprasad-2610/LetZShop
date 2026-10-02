import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, StoreStatus } from '@prisma/client';
import { normalizeSlug, isReservedSlug } from '@simply/validation';
import { SubscriptionVisibilityService } from '../subscriptions/subscription-visibility.service';
import { AuthenticatedUser } from '@simply/types';

export interface CreateStoreInput {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
}

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly visibilityService: SubscriptionVisibilityService
  ) {}

  public async createStore(input: CreateStoreInput, actorId?: string) {
    const cleanSlug = normalizeSlug(input.slug);

    if (isReservedSlug(cleanSlug)) {
      throw new BadRequestException(`The slug "${cleanSlug}" is reserved by the platform. Please choose another.`);
    }

    const existing = await this.prisma.store.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      throw new ConflictException(`Store slug "${cleanSlug}" is already taken.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          tenantId: input.tenantId,
          name: input.name,
          slug: cleanSlug,
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
    });
  }

  public async getStoreByTenantId(tenantId: string) {
    const store = await this.prisma.store.findFirst({
      where: { tenantId, deletedAt: null },
      include: {
        branding: true,
        themeConfigs: true,
        sections: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
        shippingProfiles: true,
      },
    });

    if (!store) throw new NotFoundException('Store not found for this merchant.');
    return store;
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
        themeConfigs: { include: { theme: true } },
        sections: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
        categories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        products: {
          where: { status: 'PUBLISHED', deletedAt: null },
          include: {
            media: { orderBy: { sortOrder: 'asc' } },
            options: { include: { values: { orderBy: { sortOrder: 'asc' } } } },
            variants: {
              where: { status: 'ACTIVE', deletedAt: null },
              include: {
                inventory: true,
                optionValues: {
                  include: {
                    optionValue: {
                      include: { option: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const activeThemeConfig = fullStore?.themeConfigs?.[0];
    const themeCode = activeThemeConfig?.theme?.code || 'atelier';
    const themeJson = (activeThemeConfig?.configJson as any) || {};

    return {
      store: fullStore,
      products: fullStore?.products || [],
      categories: fullStore?.categories || [],
      themeConfig: {
        themeId: themeCode,
        ...themeJson,
        palette: {
          primary: fullStore?.branding?.primaryColor || themeJson.palette?.primary || '#1C1917',
          accent: fullStore?.branding?.accentColor || themeJson.palette?.accent || '#D4AF37',
          background: themeJson.palette?.background || '#FFFFFF',
        },
      },
      isPreview,
    };
  }

  public async onboardMerchant(
    user: AuthenticatedUser,
    input: {
      businessName: string;
      category: string;
      logoUrl?: string;
      contactPhone?: string;
      contactEmail?: string;
      address?: string;
    }
  ) {
    if (!input.businessName || !input.businessName.trim()) {
      throw new BadRequestException('Business name is required.');
    }

    const baseSlug = normalizeSlug(input.businessName);
    let candidateSlug = isReservedSlug(baseSlug) ? `${baseSlug}-store` : baseSlug;

    // Ensure unique slug
    let counter = 1;
    while (await this.prisma.store.findUnique({ where: { slug: candidateSlug } })) {
      candidateSlug = `${baseSlug}-${counter++}`;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.businessName,
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
          name: input.businessName,
          slug: candidateSlug,
          status: StoreStatus.PRIVATE_PREVIEW,
          isPubliclyAccessible: false,
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
          announcement: `Welcome to ${input.businessName}`,
        },
      });

      // 5. Create default sections so store never looks empty
      const defaultSections = [
        { sectionType: 'hero', title: `Welcome to ${input.businessName}`, sortOrder: 0, isEnabled: true },
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
            businessName: input.businessName,
            category: input.category,
            slug: candidateSlug,
          },
        },
      });

      return {
        tenant,
        store,
      };
    });
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
        where: { storeId, stockOnHand: { lte: 5 } },
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
