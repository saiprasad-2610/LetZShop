import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext, brandTextErrors, normalizeBrandText } from '@simply/types';

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
      faviconUrl?: string;
      bannerUrl?: string;
    }
  ) {
    const announcementErrors = brandTextErrors(dto.announcement === undefined ? {} : { announcement: { text: dto.announcement } });
    if (announcementErrors.length) throw new BadRequestException(announcementErrors);
    const validData: any = {};
    if (dto.primaryColor !== undefined) validData.primaryColor = dto.primaryColor;
    if (dto.accentColor !== undefined) validData.accentColor = dto.accentColor;
    if (dto.fontHeading !== undefined) validData.fontHeading = dto.fontHeading;
    if (dto.fontBody !== undefined) validData.fontBody = dto.fontBody;
    if (dto.announcement !== undefined) validData.announcement = dto.announcement;
    if (dto.logoUrl !== undefined) validData.logoUrl = dto.logoUrl;
    if (dto.faviconUrl !== undefined) validData.faviconUrl = dto.faviconUrl;

    return this.prisma.storeBranding.upsert({
      where: { storeId: tenant.storeId },
      update: validData,
      create: {
        storeId: tenant.storeId,
        ...validData,
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
      db.storeThemeConfig.findMany({ where: { storeId: tenant.storeId }, include: { theme: true }, orderBy: { updatedAt: 'desc' } }),
      db.theme.findFirst({ where: { isDefault: true } }),
    ]);

    const activeConfig = themeConfigs[0];
    const activeTheme = activeConfig?.theme || defaultTheme;

    return {
      activeTheme,
      configJson: normalizeBrandText(activeConfig?.configJson || activeTheme?.configJson || {}),
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
    const errors = [
      ...brandTextErrors(dto.configJson),
      ...brandTextErrors(dto.branding?.announcement === undefined ? {} : { announcement: { text: dto.branding.announcement } }),
    ];
    if (errors.length) throw new BadRequestException(errors);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update branding if provided
      if (dto.branding) {
        const validBranding: any = {};
        if (dto.branding.primaryColor !== undefined) validBranding.primaryColor = dto.branding.primaryColor;
        if (dto.branding.accentColor !== undefined) validBranding.accentColor = dto.branding.accentColor;
        if (dto.branding.fontHeading !== undefined) validBranding.fontHeading = dto.branding.fontHeading;
        if (dto.branding.fontBody !== undefined) validBranding.fontBody = dto.branding.fontBody;
        if (dto.branding.announcement !== undefined) validBranding.announcement = dto.branding.announcement;
        if (dto.branding.logoUrl !== undefined) validBranding.logoUrl = dto.branding.logoUrl;

        await tx.storeBranding.upsert({
          where: { storeId: tenant.storeId },
          update: validBranding,
          create: {
            storeId: tenant.storeId,
            ...validBranding,
          },
        });
      }

      // 2. Update active theme config if provided
      if (dto.themeCode) {
        let theme = await tx.theme.findUnique({ where: { code: dto.themeCode } });
        if (!theme) {
          const capitalizedName = dto.themeCode.charAt(0).toUpperCase() + dto.themeCode.slice(1);
          theme = await tx.theme.create({
            data: {
              code: dto.themeCode,
              name: capitalizedName,
              isDefault: false,
              configJson: dto.configJson || {},
            },
          });
        }
        if (theme) {
          await tx.storeThemeConfig.upsert({
            where: {
              storeId_themeId: {
                storeId: tenant.storeId,
                themeId: theme.id,
              },
            },
            update: {
              configJson: normalizeBrandText(dto.configJson || theme.configJson || {}),
              updatedAt: new Date(),
            },
            create: {
              storeId: tenant.storeId,
              themeId: theme.id,
              configJson: normalizeBrandText(dto.configJson || theme.configJson || {}),
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
