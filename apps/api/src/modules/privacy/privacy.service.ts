import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, ConsentPurpose, DataSubjectRequestType, DataSubjectRequestStatus } from '@prisma/client';
import { normalizePhone } from '@simply/validation';

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaClient) {}

  public async recordConsent(input: {
    tenantId: string;
    storeId: string;
    customerId?: string;
    phone: string;
    purpose: ConsentPurpose;
    policyVersion?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const cleanPhone = normalizePhone(input.phone);
    return this.prisma.consentRecord.create({
      data: {
        tenantId: input.tenantId,
        storeId: input.storeId,
        customerId: input.customerId,
        phone: cleanPhone,
        purpose: input.purpose,
        policyVersion: input.policyVersion || 'v1.0',
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  public async createDataSubjectRequest(input: {
    tenantId: string;
    phone: string;
    email?: string;
    requestType: DataSubjectRequestType;
    reason?: string;
  }) {
    const cleanPhone = normalizePhone(input.phone);

    return this.prisma.dataSubjectRequest.create({
      data: {
        tenantId: input.tenantId,
        phone: cleanPhone,
        email: input.email,
        requestType: input.requestType,
        status: DataSubjectRequestStatus.PENDING,
        reason: input.reason,
      },
    });
  }

  /**
   * DPDPA Right to Access: Exports all personal data associated with a customer.
   */
  public async exportCustomerData(tenantId: string, phone: string) {
    const cleanPhone = normalizePhone(phone);

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: cleanPhone },
      include: {
        addresses: true,
        orders: {
          include: {
            items: true,
            statusHistory: true,
          },
        },
        consents: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('No customer records found matching this identifier.');
    }

    return {
      exportTimestamp: new Date().toISOString(),
      customerProfile: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        createdAt: customer.createdAt,
      },
      savedAddresses: customer.addresses,
      orderHistory: customer.orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        totalPaise: o.totalPaise,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({ name: i.productName, sku: i.sku, quantity: i.quantity })),
      })),
      consentRecords: customer.consents,
    };
  }

  /**
   * DPDPA Right to Erasure / Anonymization:
   * Masks personal identifiable information (PII) while preserving historical transaction totals
   * for statutory tax and accounting retention.
   */
  public async anonymizeCustomerData(tenantId: string, phone: string, actorId?: string) {
    const cleanPhone = normalizePhone(phone);

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId, phone: cleanPhone },
    });

    if (!customer) {
      throw new NotFoundException('Customer record not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Anonymize Customer record
      const anonymizedCustomer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          fullName: 'Anonymized Buyer',
          phone: `+910000000000_${customer.id.slice(0, 6)}`,
          email: null,
          notes: 'Customer data scrubbed per DPDPA erasure request',
        },
      });

      // 2. Anonymize Saved Addresses
      await tx.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: {
          addressLine1: '[REDACTED]',
          addressLine2: null,
          landmark: null,
          city: '[REDACTED]',
          state: '[REDACTED]',
          pincode: '000000',
        },
      });

      // 3. Mask Delivery Address in Past Orders while preserving financial metrics
      await tx.order.updateMany({
        where: { customerId: customer.id },
        data: {
          deliveryAddress: {
            fullName: 'Anonymized Buyer',
            phone: '+910000000000',
            addressLine1: '[REDACTED]',
            city: '[REDACTED]',
            state: '[REDACTED]',
            pincode: '000000',
          },
        },
      });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          tenantId,
          action: 'CUSTOMER_DATA_ANONYMIZED_DPDPA',
          entityType: 'Customer',
          entityId: customer.id,
          metadata: { originalPhonePrefix: cleanPhone.slice(0, 6) + 'XXXX' },
        },
      });

      return anonymizedCustomer;
    });
  }
}
