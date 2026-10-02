import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, EnquiryStatus, ProductMode } from '@prisma/client';
import { TenantContext } from '@simply/types';
import { normalizePhone, isValidIndianPhone } from '@simply/validation';

export interface CreateEnquiryInput {
  storeId: string;
  productId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  companyName?: string;
  message: string;
  requestedQuantity?: number;
}

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaClient) {}

  public async createEnquiry(input: CreateEnquiryInput) {
    const store = await this.prisma.store.findUnique({ where: { id: input.storeId } });
    if (!store) throw new NotFoundException('Store not found.');

    const cleanPhone = normalizePhone(input.customerPhone);
    if (!isValidIndianPhone(cleanPhone)) {
      throw new BadRequestException('Please provide a valid Indian mobile number.');
    }

    if (input.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: input.productId } });
      if (!product || product.storeId !== store.id) {
        throw new NotFoundException('Product not found in this store.');
      }
      if (product.mode === ProductMode.SELL_ONLINE) {
        throw new BadRequestException('This product is configured for direct online purchase only.');
      }
      if (input.requestedQuantity && input.requestedQuantity < product.minOrderQuantity) {
        throw new BadRequestException(`Minimum order quantity for this item is ${product.minOrderQuantity}.`);
      }
    }

    return this.prisma.enquiry.create({
      data: {
        tenantId: store.tenantId,
        storeId: store.id,
        productId: input.productId,
        customerName: input.customerName,
        customerPhone: cleanPhone,
        customerEmail: input.customerEmail,
        companyName: input.companyName,
        message: input.message,
        requestedQuantity: input.requestedQuantity || 1,
        status: EnquiryStatus.NEW,
      },
    });
  }

  public async getEnquiries(tenant: TenantContext) {
    return this.prisma.enquiry.findMany({
      where: { tenantId: tenant.tenantId, storeId: tenant.storeId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }

  public async respondToEnquiry(
    tenant: TenantContext,
    enquiryId: string,
    quotationAmountPaise?: number,
    notes?: string,
    status?: EnquiryStatus
  ) {
    const enquiry = await this.prisma.enquiry.findFirst({
      where: { id: enquiryId, tenantId: tenant.tenantId, storeId: tenant.storeId },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    return this.prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        quotationAmountPaise,
        notes,
        status: status || EnquiryStatus.QUOTATION_SENT,
      },
    });
  }
}
