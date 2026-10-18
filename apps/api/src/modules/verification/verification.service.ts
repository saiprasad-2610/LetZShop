import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, MerchantDocumentType, MerchantDocumentStatus } from '@prisma/client';
import {
  BusinessType,
  BusinessVerificationStatus,
  AdminBusinessVerification,
  AdminMerchantDocument,
  getBusinessDocumentRequirements,
  calculateOverallVerificationStatus,
} from '@simply/api-contracts';
import { MailService } from '../notifications/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/i;
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function maskPan(pan?: string | null): string | null {
  if (!pan || pan.length !== 10) return pan || null;
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
}

export function maskGstin(gstin?: string | null): string | null {
  if (!gstin || gstin.length !== 15) return gstin || null;
  return `${gstin.slice(0, 7)}****${gstin.slice(-3)}`;
}

export function maskOwnerId(id?: string | null): string | null {
  if (!id) return null;
  const digits = id.replace(/\D/g, '');
  const last4 = digits.length >= 4 ? digits.slice(-4) : id.slice(-4);
  return `•••• ${last4}`;
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly storageRoot: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly mailService: MailService,
  ) {
    const baseStorage = path.resolve(process.env.MEDIA_STORAGE_LOCAL_ROOT || './media-storage');
    this.storageRoot = path.resolve(baseStorage, 'private-documents');
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
  }

  public async getVerification(tenantId: string): Promise<AdminBusinessVerification> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');

    const documents = await this.prisma.merchantDocument.findMany({
      where: { tenantId, isCurrent: true },
      orderBy: { createdAt: 'desc' },
    });

    const businessType = (tenant.businessType as BusinessType) || 'SOLE_PROPRIETORSHIP';
    const requirements = getBusinessDocumentRequirements(businessType, Boolean(tenant.gstRegistered));
    const overallStatus = calculateOverallVerificationStatus(
      requirements,
      documents.map((d) => ({
        type: d.type as any,
        status: d.status as any,
      })),
    );

    return {
      businessType,
      gstRegistered: Boolean(tenant.gstRegistered),
      gstin: tenant.gstin || null,
      panNumberMasked: maskPan(tenant.panNumber),
      udyamNumber: tenant.udyamNumber || null,
      overallStatus,
      requirements,
      documents: documents.map((d) => this.mapDocument(d)),
    };
  }

  public async updateProfile(
    tenantId: string,
    actorId: string,
    data: {
      businessType?: string;
      gstRegistered?: boolean;
      gstin?: string;
      panNumber?: string;
      udyamNumber?: string;
    },
  ): Promise<AdminBusinessVerification> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');

    const updateData: any = {};

    if (data.businessType) {
      const validTypes: BusinessType[] = [
        'SOLE_PROPRIETORSHIP',
        'PARTNERSHIP',
        'LLP',
        'PRIVATE_LIMITED',
        'PUBLIC_LIMITED',
        'OTHER',
      ];
      if (!validTypes.includes(data.businessType as BusinessType)) {
        throw new BadRequestException(`Invalid business type: ${data.businessType}`);
      }
      updateData.businessType = data.businessType;
    }

    if (typeof data.gstRegistered === 'boolean') {
      updateData.gstRegistered = data.gstRegistered;
    }

    if (data.gstin !== undefined) {
      if (data.gstin && data.gstin.trim()) {
        const normalized = data.gstin.trim().toUpperCase();
        if (!GSTIN_REGEX.test(normalized)) {
          throw new BadRequestException('Invalid GSTIN format. Expected 15-character alphanumeric format.');
        }
        updateData.gstin = normalized;
      } else {
        updateData.gstin = null;
      }
    }

    if (data.panNumber !== undefined) {
      if (data.panNumber && data.panNumber.trim()) {
        const normalized = data.panNumber.trim().toUpperCase();
        if (!PAN_REGEX.test(normalized)) {
          throw new BadRequestException('Invalid PAN format. Expected standard 10-character Indian PAN.');
        }
        updateData.panNumber = normalized;
      } else {
        updateData.panNumber = null;
      }
    }

    if (data.udyamNumber !== undefined) {
      if (data.udyamNumber && data.udyamNumber.trim()) {
        const normalized = data.udyamNumber.trim().toUpperCase();
        updateData.udyamNumber = normalized;
      } else {
        updateData.udyamNumber = null;
      }
    }

    // Update tenant and recompute overall status
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    const documents = await this.prisma.merchantDocument.findMany({
      where: { tenantId, isCurrent: true },
    });

    const requirements = getBusinessDocumentRequirements(
      (updatedTenant.businessType as BusinessType) || 'SOLE_PROPRIETORSHIP',
      Boolean(updatedTenant.gstRegistered),
    );
    const overallStatus = calculateOverallVerificationStatus(
      requirements,
      documents.map((d) => ({
        type: d.type as any,
        status: d.status as any,
      })),
    );

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { businessVerificationStatus: overallStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'BUSINESS_VERIFICATION_PROFILE_UPDATED',
        entityType: 'Tenant',
        entityId: tenantId,
        tenantId,
        metadata: {
          businessType: updatedTenant.businessType,
          gstRegistered: updatedTenant.gstRegistered,
          overallStatus,
        },
      },
    });

    return this.getVerification(tenantId);
  }

  public async uploadDocument(
    tenantId: string,
    actorId: string,
    data: {
      type: string;
      documentNumber?: string;
      filename: string;
      mimeType: string;
      base64Data: string;
    },
  ): Promise<{ document: AdminMerchantDocument; verification: AdminBusinessVerification }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Merchant not found.');

    const validTypes = Object.values(MerchantDocumentType);
    if (!validTypes.includes(data.type as MerchantDocumentType)) {
      throw new BadRequestException(`Invalid document type: ${data.type}`);
    }
    const docType = data.type as MerchantDocumentType;

    if (!data.base64Data) {
      throw new BadRequestException('Document file data (base64) is required.');
    }

    const buffer = Buffer.from(data.base64Data, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty.');
    }
    if (buffer.length > MAX_DOCUMENT_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${(buffer.length / (1024 * 1024)).toFixed(1)}MB exceeds maximum limit of 10MB.`,
      );
    }

    // Binary magic byte validation
    const detected = this.detectFileFormat(buffer);
    if (!detected) {
      throw new BadRequestException(
        'Unsupported file format. Please upload a valid PDF, JPEG, or PNG document.',
      );
    }

    // Validate and mask document numbers based on type
    let maskedNumber: string | null = null;
    if (data.documentNumber && data.documentNumber.trim()) {
      const rawNumber = data.documentNumber.trim().toUpperCase();
      if (docType === 'PAN') {
        if (!PAN_REGEX.test(rawNumber)) {
          throw new BadRequestException('Invalid PAN format (e.g. ABCDE1234F).');
        }
        maskedNumber = maskPan(rawNumber);
      } else if (docType === 'GST_CERTIFICATE') {
        if (!GSTIN_REGEX.test(rawNumber)) {
          throw new BadRequestException('Invalid GSTIN format (e.g. 27ABCDE1234F1Z5).');
        }
        maskedNumber = maskGstin(rawNumber);
      } else if (docType === 'OWNER_ID') {
        maskedNumber = maskOwnerId(rawNumber);
      } else if (docType === 'UDYAM') {
        maskedNumber = rawNumber;
      } else {
        maskedNumber = rawNumber;
      }
    }

    // Write file to private storage directory
    const tenantDir = path.resolve(this.storageRoot, tenantId);
    if (!tenantDir.startsWith(this.storageRoot)) {
      throw new ForbiddenException('Invalid tenant path.');
    }
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const uniqueId = crypto.randomUUID();
    const safeFilename = `${uniqueId}${detected.extension}`;
    const absoluteFilePath = path.resolve(tenantDir, safeFilename);

    if (!absoluteFilePath.startsWith(tenantDir)) {
      throw new ForbiddenException('Directory traversal prevented.');
    }

    await fs.promises.writeFile(absoluteFilePath, buffer);
    const storageKey = `private-documents/${tenantId}/${safeFilename}`;

    // Transaction: archive previous document of same type and save new current document
    const resultDoc = await this.prisma.$transaction(async (tx) => {
      const existingDoc = await tx.merchantDocument.findFirst({
        where: { tenantId, type: docType, isCurrent: true },
      });

      if (existingDoc) {
        await tx.merchantDocument.update({
          where: { id: existingDoc.id },
          data: { isCurrent: false },
        });
      }

      const newDoc = await tx.merchantDocument.create({
        data: {
          tenantId,
          type: docType,
          documentNumberMasked: maskedNumber,
          storageKey,
          originalFilename: data.filename || `document${detected.extension}`,
          mimeType: detected.mimeType,
          fileSizeBytes: buffer.length,
          status: MerchantDocumentStatus.PENDING_REVIEW,
          isCurrent: true,
        },
      });

      // Update tenant document number if provided
      if (docType === 'PAN' && data.documentNumber) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { panNumber: data.documentNumber.trim().toUpperCase() },
        });
      } else if (docType === 'UDYAM' && data.documentNumber) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { udyamNumber: data.documentNumber.trim().toUpperCase() },
        });
      } else if (docType === 'GST_CERTIFICATE' && data.documentNumber) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: { gstin: data.documentNumber.trim().toUpperCase() },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: existingDoc ? 'DOCUMENT_REPLACED' : 'DOCUMENT_UPLOADED',
          entityType: 'MerchantDocument',
          entityId: newDoc.id,
          tenantId,
          metadata: {
            documentType: docType,
            previousDocumentId: existingDoc?.id || null,
            filename: data.filename,
            fileSize: buffer.length,
          },
        },
      });

      return newDoc;
    });

    // Recompute overall verification status
    const currentDocs = await this.prisma.merchantDocument.findMany({
      where: { tenantId, isCurrent: true },
    });
    const requirements = getBusinessDocumentRequirements(
      (tenant.businessType as BusinessType) || 'SOLE_PROPRIETORSHIP',
      Boolean(tenant.gstRegistered),
    );
    const overallStatus = calculateOverallVerificationStatus(
      requirements,
      currentDocs.map((d) => ({
        type: d.type as any,
        status: d.status as any,
      })),
    );

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { businessVerificationStatus: overallStatus },
    });

    const verification = await this.getVerification(tenantId);
    return {
      document: this.mapDocument(resultDoc),
      verification,
    };
  }

  public async getDocumentStream(
    documentId: string,
    requesterTenantId?: string,
    isAdmin = false,
  ): Promise<{ filePath: string; mimeType: string; filename: string; document: AdminMerchantDocument }> {
    const document = await this.prisma.merchantDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Document not found.');

    // Security & IDOR check: Merchant A cannot view Merchant B document
    if (!isAdmin && requesterTenantId && document.tenantId !== requesterTenantId) {
      throw new ForbiddenException('Access denied. You do not have permission to view this document.');
    }

    const baseStorage = path.resolve(process.env.MEDIA_STORAGE_LOCAL_ROOT || './media-storage');
    const relativeKey = document.storageKey.replace(/^[\\\/]+/, '');
    const absolutePath = path.resolve(baseStorage, relativeKey);

    if (!absolutePath.startsWith(baseStorage) || !fs.existsSync(absolutePath)) {
      throw new NotFoundException('Document file missing or not found on storage.');
    }

    // Record sensitive view audit
    await this.prisma.auditLog.create({
      data: {
        actorId: isAdmin ? 'ADMIN' : requesterTenantId || 'MERCHANT',
        action: isAdmin ? 'DOCUMENT_VIEWED_BY_ADMIN' : 'DOCUMENT_DOWNLOADED',
        entityType: 'MerchantDocument',
        entityId: document.id,
        tenantId: document.tenantId,
        metadata: {
          documentType: document.type,
          filename: document.originalFilename,
        },
      },
    });

    return {
      filePath: absolutePath,
      mimeType: document.mimeType,
      filename: document.originalFilename,
      document: this.mapDocument(document),
    };
  }

  public async reviewDocument(
    adminId: string,
    tenantId: string,
    documentId: string,
    data: {
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
      adminNote?: string;
    },
  ): Promise<{ document: AdminMerchantDocument; verification: AdminBusinessVerification }> {
    const document = await this.prisma.merchantDocument.findFirst({
      where: { id: documentId, tenantId },
    });
    if (!document) throw new NotFoundException('Document not found for this merchant.');

    if (data.status === 'REJECTED' && !data.rejectionReason?.trim()) {
      throw new BadRequestException('A rejection reason is required when rejecting a document.');
    }

    const newStatus =
      data.status === 'VERIFIED'
        ? MerchantDocumentStatus.VERIFIED
        : MerchantDocumentStatus.REJECTED;

    const updatedDoc = await this.prisma.merchantDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        rejectionReason: data.status === 'REJECTED' ? data.rejectionReason?.trim() : null,
        adminNote: data.adminNote?.trim() || null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });

    // Recalculate overall status
    const currentDocs = await this.prisma.merchantDocument.findMany({
      where: { tenantId, isCurrent: true },
    });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        memberships: {
          where: { role: 'SELLER_OWNER', isActive: true },
          include: { user: true },
        },
      },
    });

    const requirements = getBusinessDocumentRequirements(
      (tenant?.businessType as BusinessType) || 'SOLE_PROPRIETORSHIP',
      Boolean(tenant?.gstRegistered),
    );
    const overallStatus = calculateOverallVerificationStatus(
      requirements,
      currentDocs.map((d) => ({
        type: d.type as any,
        status: d.status as any,
      })),
    );

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { businessVerificationStatus: overallStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: data.status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
        entityType: 'MerchantDocument',
        entityId: documentId,
        tenantId,
        metadata: {
          documentType: document.type,
          status: data.status,
          rejectionReason: data.rejectionReason || null,
        },
      },
    });

    // Notify merchant owner via email if available
    const ownerEmail = tenant?.memberships?.[0]?.user?.email;
    if (ownerEmail) {
      const subject =
        data.status === 'VERIFIED'
          ? `Document Verified: ${document.type} for ${tenant?.name || 'your store'}`
          : `Action Required: Document Needs Changes (${document.type})`;
      const message =
        data.status === 'VERIFIED'
          ? `Your business document "${document.originalFilename}" (${document.type}) has been successfully reviewed and verified by LetzShop Administration.`
          : `Your business document "${document.originalFilename}" (${document.type}) could not be verified for the following reason:\n\n${data.rejectionReason}\n\nPlease visit Seller Settings > Business Verification to re-upload a clear and valid copy.`;

      this.mailService
        .sendAdminMerchantEmail(ownerEmail, subject, message, tenant?.name || 'Merchant')
        .catch((err) => {
          this.logger.warn(`Failed to dispatch document review email: ${err.message}`);
        });
    }

    const verification = await this.getVerification(tenantId);
    return {
      document: this.mapDocument(updatedDoc),
      verification,
    };
  }

  private detectFileFormat(buffer: Buffer): { mimeType: string; extension: string } | null {
    if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return { mimeType: 'application/pdf', extension: '.pdf' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', extension: '.jpg' };
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { mimeType: 'image/png', extension: '.png' };
    }
    return null;
  }

  private mapDocument(d: any): AdminMerchantDocument {
    return {
      id: d.id,
      tenantId: d.tenantId,
      type: d.type,
      documentNumberMasked: d.documentNumberMasked,
      storageKey: d.storageKey,
      originalFilename: d.originalFilename,
      mimeType: d.mimeType,
      fileSizeBytes: d.fileSizeBytes,
      status: d.status,
      isCurrent: d.isCurrent,
      rejectionReason: d.rejectionReason,
      adminNote: d.adminNote,
      uploadedAt: d.uploadedAt.toISOString(),
      reviewedAt: d.reviewedAt ? d.reviewedAt.toISOString() : null,
      reviewedById: d.reviewedById,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
