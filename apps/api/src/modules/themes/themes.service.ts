import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@simply/types';

@Injectable()
export class ThemesService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getBranding(tenant: TenantContext) {
    const branding = await this.prisma.storeBranding.findUnique({
      where: { storeId: tenant.storeId },
    });
    return branding;
  }

  public async updateBranding(
    tenant: TenantContext,
    dto: {
      primaryColor?: string;
      accentColor?: string;
      fontHeading?: string;
      fontBody?: string;
      announcement?: string;
      logoUrl?: string;
    }
  ) {
    return this.prisma.storeBranding.upsert({
      where: { storeId: tenant.storeId },
      update: dto,
      create: {
        storeId: tenant.storeId,
        ...dto,
      },
    });
  }

  public async getSections(tenant: TenantContext) {
    return this.prisma.storeSection.findMany({
      where: { storeId: tenant.storeId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  public async getAvailableThemes() {
    return this.prisma.theme.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  public async getStoreThemeConfig(tenant: TenantContext, client?: any) {
    const db = client || this.prisma;
    const [branding, sections, themeConfigs, defaultTheme] = await Promise.all([
      db.storeBranding.findUnique({ where: { storeId: tenant.storeId } }),
      db.storeSection.findMany({ where: { storeId: tenant.storeId }, orderBy: { sortOrder: 'asc' } }),
      db.storeThemeConfig.findMany({ where: { storeId: tenant.storeId }, include: { theme: true } }),
      db.theme.findFirst({ where: { isDefault: true } }),
    ]);

    const activeConfig = themeConfigs[0];
    const activeTheme = activeConfig?.theme || defaultTheme;

    return {
      activeTheme,
      configJson: activeConfig?.configJson || activeTheme?.configJson || {},
      branding,
      sections,
    };
  }

  public async updateStoreThemeConfig(
    tenant: TenantContext,
    dto: {
      themeCode?: string;
      configJson?: any;
      branding?: {
        primaryColor?: string;
        accentColor?: string;
        fontHeading?: string;
        fontBody?: string;
        announcement?: string;
        logoUrl?: string;
      };
      sections?: Array<{
        id?: string;
        sectionType: string;
        title?: string;
        sortOrder: number;
        isEnabled: boolean;
        configJson?: any;
      }>;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update branding if provided
      if (dto.branding) {
        await tx.storeBranding.upsert({
          where: { storeId: tenant.storeId },
          update: dto.branding,
          create: {
            storeId: tenant.storeId,
            ...dto.branding,
          },
        });
      }

      // 2. Update active theme config if provided
      if (dto.themeCode) {
        const theme = await tx.theme.findUnique({ where: { code: dto.themeCode } });
        if (theme) {
          await tx.storeThemeConfig.upsert({
            where: {
              storeId_themeId: {
                storeId: tenant.storeId,
                themeId: theme.id,
              },
            },
            update: {
              configJson: dto.configJson || theme.configJson || {},
            },
            create: {
              storeId: tenant.storeId,
              themeId: theme.id,
              configJson: dto.configJson || theme.configJson || {},
            },
          });
        }
      }

      // 3. Update sections if provided
      if (dto.sections && dto.sections.length > 0) {
        for (const sec of dto.sections) {
          if (sec.id) {
            await tx.storeSection.updateMany({
              where: { id: sec.id, storeId: tenant.storeId },
              data: {
                title: sec.title,
                sortOrder: sec.sortOrder,
                isEnabled: sec.isEnabled,
                configJson: sec.configJson,
              },
            });
          } else {
            await tx.storeSection.create({
              data: {
                storeId: tenant.storeId,
                sectionType: sec.sectionType,
                title: sec.title,
                sortOrder: sec.sortOrder,
                isEnabled: sec.isEnabled,
                configJson: sec.configJson,
              },
            });
          }
        }
      }

      return this.getStoreThemeConfig(tenant, tx);
    });
  }
}
