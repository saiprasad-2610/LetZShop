import { VerificationService } from '../../src/modules/verification/verification.service';
import { PaymentsService } from '../../src/modules/payments/payments.service';
import { BadRequestException } from '@nestjs/common';
import { PaymentPurpose, PaymentProviderType, PaymentStatus, SubscriptionStatus } from '@prisma/client';

describe('Business Verification Persistence & Razorpay Tenant Scoping Regression Suite', () => {
  let mockPrisma: any;
  let mockMailService: any;
  let verificationService: VerificationService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      merchantDocument: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      plan: {
        findUnique: jest.fn(),
      },
      paymentOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
      },
      idempotencyKey: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockMailService = {
      sendAdminMerchantEmail: jest.fn().mockResolvedValue(true),
    };

    const mockStorageProvider = {
      upload: jest.fn(),
      getStream: jest.fn(),
      delete: jest.fn(),
    } as any;

    verificationService = new VerificationService(
      mockPrisma,
      mockMailService,
      mockStorageProvider
    );
  });

  describe('Priority 1: Verification Profile Persistence', () => {
    it('should retain existing PAN when client re-submits masked PAN string (ABCDE****F)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'ABCDE1234F',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        gstin: null,
        udyamNumber: null,
      });

      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'ABCDE1234F',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        gstin: null,
        udyamNumber: 'UDYAM-MH-01-1234567',
        verificationStatus: 'NOT_SUBMITTED',
        verificationRejectionReason: null,
        verifiedAt: null,
      });
      mockPrisma.merchantDocument.findMany.mockResolvedValue([]);

      const updated = await verificationService.updateProfile('tenant-123', 'actor-user-1', {
        panNumber: 'ABCDE****F', // Client submitted masked PAN back
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        udyamNumber: 'UDYAM-MH-01-1234567',
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          data: expect.objectContaining({
            udyamNumber: 'UDYAM-MH-01-1234567',
          }),
        })
      );
      // Ensure raw database PAN was not overwritten by asterisks
      const updateCall = mockPrisma.tenant.update.mock.calls[0][0];
      expect(updateCall.data.panNumber).toBeUndefined();
    });

    it('should update PAN when client supplies a new valid unmasked PAN', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'ABCDE1234F',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
      });

      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'XYZPK9876Q',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        verificationStatus: 'NOT_SUBMITTED',
        verificationRejectionReason: null,
        verifiedAt: null,
      });
      mockPrisma.merchantDocument.findMany.mockResolvedValue([]);

      await verificationService.updateProfile('tenant-123', 'actor-user-1', {
        panNumber: 'xyzpk9876q', // lower-case should be uppercased
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          data: expect.objectContaining({
            panNumber: 'XYZPK9876Q',
          }),
        })
      );
    });

    it('should reject invalid PAN format with BadRequestException', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        panNumber: null,
      });

      await expect(
        verificationService.updateProfile('tenant-123', 'actor-user-1', {
          panNumber: 'INVALID_PAN_123',
          businessType: 'SOLE_PROPRIETORSHIP',
          gstRegistered: false,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should automatically clear gstin when gstRegistered is set to false', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'ABCDE1234F',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: true,
        gstin: '27ABCDE1234F1Z5',
      });

      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-123',
        panNumber: 'ABCDE1234F',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        gstin: null,
        verificationStatus: 'NOT_SUBMITTED',
        verificationRejectionReason: null,
        verifiedAt: null,
      });
      mockPrisma.merchantDocument.findMany.mockResolvedValue([]);

      await verificationService.updateProfile('tenant-123', 'actor-user-1', {
        gstRegistered: false,
        gstin: '27ABCDE1234F1Z5', // Should be wiped because gstRegistered is false
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          data: expect.objectContaining({
            gstRegistered: false,
            gstin: null,
          }),
        })
      );
    });

    it('should validate valid Udyam number and persist it', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        udyamNumber: null,
      });

      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-123',
        udyamNumber: 'UDYAM-DL-01-0012345',
        verificationStatus: 'NOT_SUBMITTED',
        verificationRejectionReason: null,
        verifiedAt: null,
      });
      mockPrisma.merchantDocument.findMany.mockResolvedValue([]);

      await verificationService.updateProfile('tenant-123', 'actor-user-1', {
        udyamNumber: 'udyam-dl-01-0012345',
      });

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          data: expect.objectContaining({
            udyamNumber: 'UDYAM-DL-01-0012345',
          }),
        })
      );
    });

    it('should reject invalid Udyam number format', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
      });

      await expect(
        verificationService.updateProfile('tenant-123', 'actor-user-1', {
          udyamNumber: 'NOT-A-VALID-UDYAM',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should return masked PAN when getVerification is called', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-123',
        businessType: 'SOLE_PROPRIETORSHIP',
        gstRegistered: false,
        gstin: null,
        panNumber: 'ABCDE1234F',
        udyamNumber: 'UDYAM-MH-01-1234567',
        verificationStatus: 'NOT_SUBMITTED',
        verificationRejectionReason: null,
        verifiedAt: null,
      });
      mockPrisma.merchantDocument.findMany.mockResolvedValue([]);

      const profile = await verificationService.getVerification('tenant-123');

      expect(profile.panNumberMasked).toBe('ABCDE****F');
      expect(profile.udyamNumber).toBe('UDYAM-MH-01-1234567');
    });
  });

  describe('Priority 4: Razorpay Subscription Tenant Scoping & Amount Verification', () => {
    let paymentsService: PaymentsService;
    let mockRazorpayProvider: any;
    let mockSubscriptionService: any;
    let mockMockProvider: any;

    beforeEach(() => {
      mockRazorpayProvider = {
        createPaymentOrder: jest.fn().mockResolvedValue({
          providerOrderId: 'order_rzp_mock_123',
          keyId: 'rzp_test_key_123',
          amountPaise: 117882,
        }),
      };

      mockMockProvider = {} as any;
      mockSubscriptionService = {} as any;

      paymentsService = new PaymentsService(
        mockPrisma,
        mockMockProvider,
        mockRazorpayProvider,
        mockSubscriptionService
      );
    });

    it('should calculate authoritative Solopreneur amount: Base 99900 + 18% GST (17982) = 117882 paise (₹1,178.82)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-owner-1',
        slug: 'fresh-merchant',
        name: 'Fresh Organic Foods',
        stores: [{ id: 'store-1' }],
        memberships: [
          {
            role: 'SELLER_OWNER',
            isActive: true,
            user: {
              fullName: 'Aarav Patel',
              email: 'aarav@freshorganic.in',
              phone: '9876543210',
            },
          },
        ],
      });

      mockPrisma.plan.findUnique.mockResolvedValue({
        id: 'plan-solopreneur-1',
        code: 'SOLOPRENEUR_MONTHLY',
        name: 'Solopreneur',
        pricePaise: 99900,
        gstEnabled: true,
        gstPercent: 18,
        paymentType: 'PAYMENT_GATEWAY',
        status: 'ACTIVE',
        isPublic: true,
      });

      mockPrisma.paymentOrder.create.mockResolvedValue({
        id: 'po-1',
        providerOrderId: 'order_rzp_mock_123',
        amountPaise: 117882,
        currency: 'INR',
      });

      const res = await paymentsService.createPlatformSubscriptionPaymentOrder(
        'tenant-owner-1',
        'plan-solopreneur-1'
      );

      // Verify exact paise calculation
      expect(res.baseAmountPaise).toBe(99900);
      expect(res.taxPaise).toBe(17982);
      expect(res.amountPaise).toBe(117882); // ₹1,178.82

      // Verify authoritative prefill is extracted from tenant owner, NOT leaked from Nikita Yaldandi or any other user
      expect(res.prefill).toEqual({
        name: 'Aarav Patel',
        email: 'aarav@freshorganic.in',
        contact: '9876543210',
      });

      expect(mockRazorpayProvider.createPaymentOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-owner-1',
          amountPaise: 117882,
          purpose: PaymentPurpose.PLATFORM_SUBSCRIPTION,
        })
      );
    });

    it('should isolate Merchant A from Merchant B in prefill and never leak identity', async () => {
      // Merchant B creation
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-merchant-b',
        slug: 'store-b',
        name: 'Store B Goods',
        stores: [{ id: 'store-b-id' }],
        memberships: [
          {
            role: 'SELLER_OWNER',
            isActive: true,
            user: {
              fullName: 'Kiran Sharma',
              email: 'kiran@storeb.com',
              phone: '9123456789',
            },
          },
        ],
      });

      mockPrisma.plan.findUnique.mockResolvedValue({
        id: 'plan-starter-1',
        code: 'STARTER_MONTHLY',
        name: 'Starter Plan',
        pricePaise: 49900,
        gstEnabled: false,
        gstPercent: 0,
        paymentType: 'PAYMENT_GATEWAY',
        status: 'ACTIVE',
        isPublic: true,
      });

      mockPrisma.paymentOrder.create.mockResolvedValue({
        id: 'po-2',
        providerOrderId: 'order_rzp_mock_456',
        amountPaise: 49900,
        currency: 'INR',
      });

      const res = await paymentsService.createPlatformSubscriptionPaymentOrder(
        'tenant-merchant-b',
        'plan-starter-1'
      );

      expect(res.amountPaise).toBe(49900);
      expect(res.prefill.email).toBe('kiran@storeb.com');
      expect(res.prefill.name).toBe('Kiran Sharma');
      // Must not match Nikita Yaldandi or SaiRam Tea
      expect(res.prefill.email).not.toContain('nikita');
      expect(res.prefill.email).not.toContain('sairam');
    });
  });
});
