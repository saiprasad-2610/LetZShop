// apps/api/test/unit/production-bugs-001-005.spec.ts
import { normalizeBusinessName, isValidBusinessName } from '@simply/validation';
import {
  brandTextErrors,
  normalizeBrandText,
  FOOTER_DESCRIPTION_MAX,
} from '@simply/types';
import { generateInvoicePdfBuffer } from '../../src/modules/admin/invoice-pdf.util';

describe('LETZSHOP PRODUCTION BUG REGRESSION SUITE: BUG-001 through BUG-005', () => {
  // =========================================================================
  // BUG-001: Business Name Whitespace Normalization
  // =========================================================================
  describe('BUG-001: Business Name Normalization & Validation', () => {
    it('collapses repeated internal spaces into a single space and trims ends', () => {
      expect(normalizeBusinessName('  Ghar   Ka   Zaika  ')).toBe('Ghar Ka Zaika');
      expect(normalizeBusinessName('Ghar    Ka    Zaika')).toBe('Ghar Ka Zaika');
      expect(normalizeBusinessName('Shree   Ganesh   Traders')).toBe('Shree Ganesh Traders');
      expect(normalizeBusinessName('A   &   B   Enterprises')).toBe('A & B Enterprises');
    });

    it('normalizes tabs and mixed whitespace characters properly', () => {
      expect(normalizeBusinessName("Ghar\t\tKa\t\nZaika")).toBe('Ghar Ka Zaika');
    });

    it('preserves valid Unicode business names in Indian languages', () => {
      expect(normalizeBusinessName('  घर   का   स्वाद  ')).toBe('घर का स्वाद');
      expect(normalizeBusinessName('  श्री   गणेश   स्टोअर्स  ')).toBe('श्री गणेश स्टोअर्स');
    });

    it('returns empty string for spaces-only and triggers validation error', () => {
      const normalized = normalizeBusinessName('     ');
      expect(normalized).toBe('');
      expect(isValidBusinessName(normalized)).toBe(false);
      expect(isValidBusinessName('   ')).toBe(false);
    });

    it('validates normalized business names between 2 and 100 characters', () => {
      expect(isValidBusinessName(normalizeBusinessName('  Ghar   Ka   Zaika  '))).toBe(true);
      expect(isValidBusinessName('A')).toBe(false);
      expect(isValidBusinessName('A'.repeat(101))).toBe(false);
    });
  });

  // =========================================================================
  // BUG-003: Theme Configuration Empty Field Validation
  // =========================================================================
  describe('BUG-003: Theme Configuration Conditional & Optional Field Validation', () => {
    it('allows saving when announcement bar is disabled even if message is empty', () => {
      const config = {
        announcement: { enabled: false, text: '' },
      };
      const errors = brandTextErrors(config);
      expect(errors).toEqual([]);
    });

    it('requires a non-whitespace announcement message when announcement bar is enabled', () => {
      const configWithEmpty = {
        announcement: { enabled: true, text: '   ' },
      };
      const errors = brandTextErrors(configWithEmpty);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBe('Enter an announcement message or disable the announcement bar.');
    });

    it('passes validation when announcement bar is enabled with valid text', () => {
      const config = {
        announcement: { enabled: true, text: 'Free shipping on orders over ₹499' },
      };
      const errors = brandTextErrors(config);
      expect(errors).toEqual([]);
    });

    it('permits empty optional hero fields (heroBadge, heroTitle, heroSubtitle) without blocking', () => {
      const config = {
        pages: {
          home: {
            heroBadge: '',
            heroTitle: '',
            heroSubtitle: '',
          },
        },
      };
      const errors = brandTextErrors(config);
      expect(errors).toEqual([]);
    });
  });

  // =========================================================================
  // BUG-004: Professional Tax Invoice Redesign & Financial Accuracy
  // =========================================================================
  describe('BUG-004: Professional Tax Invoice & Readability', () => {
    const mockInvoiceData = {
      invoiceNumber: 'INV-2026-0001',
      status: 'PAID',
      tenantName: 'Ghar Ka Zaika',
      tenantSlug: 'ghar-ka-zaika',
      ownerName: 'Rajesh Sharma',
      ownerPhone: '+91 98765 43210',
      ownerEmail: 'rajesh@gharkazaika.in',
      billingAddress: '42 MG Road, Bangalore, Karnataka 560001',
      merchantGstin: '29ABCDE1234F1Z5',
      invoiceDate: '28 Oct 2026',
      billingPeriod: '28 Oct 2026 – 28 Nov 2026',
      billingPeriodShort: '28 Oct – 28 Nov 2026',
      currency: 'INR',
      paymentMethod: 'RAZORPAY',
      paymentReference: 'pay_RZP9876543210',
      paidAtDate: '28 Oct 2026, 14:30',
      paymentStatus: 'PAID',
      planName: 'Launch',
      formattedAmount: 'INR 1,178.82',
      subtotalFormatted: 'INR 999.00',
      taxFormatted: 'INR 179.82',
      taxNote: '(Includes 18% GST: CGST 9% + SGST 9%)',
    };

    it('generates a valid, standards-compliant PDF 1.4 buffer with dark readable typography', () => {
      const pdf = generateInvoicePdfBuffer(mockInvoiceData);
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(1000);

      const pdfString = pdf.toString('utf8');
      expect(pdfString).toContain('%PDF-1.4');
      expect(pdfString).toContain('%%EOF');
      // Confirms graphics state encapsulation (q / Q) to protect text color inheritance
      expect(pdfString).toContain('q\n');
      expect(pdfString).toContain('Q\n');
      // Confirms dark text colors are applied
      expect(pdfString).toContain('0.06 0.11 0.22 rg'); // Brand title
      expect(pdfString).toContain('LetzShop');
      expect(pdfString).toContain('AIKYAM AI Systems');
      expect(pdfString).toContain('INV-2026-0001');
      expect(pdfString).toContain('INR 1,178.82');
    });

    it('generates a TAX INVOICE with verified supplier GSTIN when issuer GSTIN is provided', () => {
      const pdf = generateInvoicePdfBuffer({
        ...mockInvoiceData,
        issuerGstin: '29AAACA9999P1Z8',
      });
      const pdfString = pdf.toString('utf8');
      expect(pdfString).toContain('TAX INVOICE');
      expect(pdfString).toContain('29AAACA9999P1Z8');
      expect(pdfString).toContain('SAC: 998313');
    });

    it('generates a COMMERCIAL INVOICE / RECEIPT without fabricating GSTIN when issuer GSTIN is absent (Scenario B)', () => {
      const pdf = generateInvoicePdfBuffer({
        ...mockInvoiceData,
        issuerGstin: null,
      });
      const pdfString = pdf.toString('utf8');
      expect(pdfString).toContain('COMMERCIAL INVOICE / RECEIPT');
      expect(pdfString).toContain('Unregistered Supplier');
      expect(pdfString).not.toContain('29AAACA9999P1Z8');
    });
  });

  // =========================================================================
  // BUG-005: Footer Brand Description 300-Character Limit & Backward Compatibility
  // =========================================================================
  describe('BUG-005: Footer Brand Description 300-Character Limit', () => {
    it('enforces FOOTER_DESCRIPTION_MAX = 300 in configuration limits', () => {
      expect(FOOTER_DESCRIPTION_MAX).toBe(300);
    });

    it('accepts descriptions up to 300 characters across English, Indian scripts and emojis', () => {
      // 300 ASCII characters
      expect(brandTextErrors({ footer: { description: 'A'.repeat(300) } })).toEqual([]);
      // Empty / optional
      expect(brandTextErrors({ footer: { description: '' } })).toEqual([]);
      // Hindi / Marathi unicode text
      const hindiText = 'शुद्ध देशी स्वाद और पारंपरिक गुणवत्ता '.repeat(10).slice(0, 300);
      expect(brandTextErrors({ footer: { description: hindiText } })).toEqual([]);
    });

    it('rejects descriptions exceeding 300 characters on API validation', () => {
      const overLimitConfig = {
        footer: { description: 'A'.repeat(301) },
      };
      const errors = brandTextErrors(overLimitConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('configJson.footer.description must be at most 300 characters');
    });

    it('preserves existing legacy descriptions over 300 characters without destructive truncation', () => {
      const legacyDescription = 'Pre-existing merchant bio text '.repeat(20); // ~600 chars
      const legacyConfig = {
        footer: { description: legacyDescription },
      };

      const normalized = normalizeBrandText(legacyConfig);
      // Confirms legacy description is NOT destructively truncated to 300
      expect(normalized.footer.description).toBe(legacyDescription);
      expect(normalized.footer.description.length).toBeGreaterThan(300);
    });
  });
});
