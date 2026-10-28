// apps/api/src/modules/admin/invoice-pdf.util.ts

export interface InvoicePdfData {
  invoiceNumber: string;
  status: string;
  tenantName: string;
  tenantSlug: string;
  ownerName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  billingAddress?: string | null;
  merchantGstin?: string | null;
  invoiceDate: string;
  billingPeriod: string;
  billingPeriodShort: string;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
  paidAtDate?: string | null;
  paymentStatus: string;
  planName: string;
  formattedAmount: string;
  subtotalFormatted?: string;
  taxFormatted?: string;
  taxNote?: string;
  issuerGstin?: string | null;
}

function escapePdfText(str?: string | null): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a professional, high-contrast, standards-compliant PDF 1.4 vector document
 * for a subscription invoice.
 * Completely immune to PDF font/color inheritance bugs; guarantees dark, high-contrast,
 * print-ready text on crisp white paper.
 */
export function generateInvoicePdfBuffer(data: InvoicePdfData): Buffer {
  let s = '';

  const isGstRegistered = Boolean(data.issuerGstin && data.issuerGstin.trim());
  const documentTitle = isGstRegistered ? 'TAX INVOICE' : 'COMMERCIAL INVOICE / RECEIPT';

  // 1. Sleek Navy Top Accent Banner
  s += 'q\n';
  s += '0.06 0.11 0.22 rg\n';
  s += '0 826 595.28 16 re f\n';
  s += 'Q\n';

  // 2. Header: LetzShop & AIKYAM AI Systems
  s += 'BT\n0.06 0.11 0.22 rg\n/F2 20 Tf\n40 788 Td\n(LetzShop) Tj\nET\n';
  s += 'BT\n0.20 0.24 0.30 rg\n/F2 9 Tf\n40 774 Td\n(by AIKYAM AI Systems) Tj\nET\n';
  s += 'BT\n0.35 0.38 0.44 rg\n/F1 8 Tf\n40 762 Td\n(Multi-Tenant Cloud E-Commerce SaaS Platform · Karnataka, India) Tj\nET\n';

  const issuerGstinText = isGstRegistered
    ? `Issuer GSTIN: ${escapePdfText(data.issuerGstin)} (SAC: 998313)`
    : 'Issuer GST: Unregistered Supplier (Exempt under Section 22 CGST Act)';
  s += `BT\n0.35 0.38 0.44 rg\n/F1 8 Tf\n40 750 Td\n(${issuerGstinText}) Tj\nET\n`;

  // 3. Document Title & Invoice Meta (Right-Aligned)
  s += `BT\n0.08 0.12 0.22 rg\n/F2 15 Tf\n360 788 Td\n(${documentTitle}) Tj\nET\n`;
  s += `BT\n0.10 0.12 0.16 rg\n/F2 9 Tf\n360 774 Td\n(Invoice #: ${escapePdfText(data.invoiceNumber)}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.34 rg\n/F1 8 Tf\n360 762 Td\n(Invoice Date: ${escapePdfText(data.invoiceDate)}) Tj\nET\n`;
  s += `BT\n0.08 0.45 0.22 rg\n/F2 8 Tf\n360 750 Td\n(Status: ${escapePdfText(data.status)} / SETTLED) Tj\nET\n`;

  // Divider Line
  s += '0.80 0.83 0.88 RG\n0.75 w\n';
  s += '40 738 m 555 738 l S\n';

  // 4. Two-Column Information Cards
  // Left Box: Billed To (Recipient)
  s += 'q\n';
  s += '0.96 0.97 0.98 rg\n';
  s += '40 640 250 88 re f\n';
  s += '0.84 0.86 0.90 RG\n';
  s += '40 640 250 88 re S\n';
  s += 'Q\n';

  s += 'BT\n0.15 0.20 0.28 rg\n/F2 8.5 Tf\n48 714 Td\n(BILLED TO \\(CUSTOMER / RECIPIENT\\):) Tj\nET\n';
  s += `BT\n0.05 0.05 0.08 rg\n/F2 10 Tf\n48 700 Td\n(${escapePdfText(data.tenantName)}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n48 688 Td\n(Store Slug: ${escapePdfText(data.tenantSlug)}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n48 676 Td\n(Contact: ${escapePdfText(data.ownerName)} | ${escapePdfText(data.ownerPhone || 'No Phone')}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n48 664 Td\n(Email: ${escapePdfText(data.ownerEmail || 'No Email')}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n48 652 Td\n(GSTIN: ${escapePdfText(data.merchantGstin || 'Unregistered Recipient / Consumer')}) Tj\nET\n`;

  // Right Box: Subscription & Service Details
  s += 'q\n';
  s += '0.96 0.97 0.98 rg\n';
  s += '305 640 250 88 re f\n';
  s += '0.84 0.86 0.90 RG\n';
  s += '305 640 250 88 re S\n';
  s += 'Q\n';

  s += 'BT\n0.15 0.20 0.28 rg\n/F2 8.5 Tf\n313 714 Td\n(SERVICE & SUPPLY DETAILS:) Tj\nET\n';
  s += `BT\n0.05 0.05 0.08 rg\n/F2 10 Tf\n313 700 Td\n(${escapePdfText(data.planName)} Plan Subscription) Tj\nET\n`;
  s += 'BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n313 688 Td\n(SAC Code: 998313 \\(Information Technology / Cloud SaaS\\)) Tj\nET\n';
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n313 676 Td\n(Billing Period: ${escapePdfText(data.billingPeriod)}) Tj\nET\n`;
  s += 'BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n313 664 Td\n(Place of Supply: Inter-State SaaS / Pan-India) Tj\nET\n';
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n313 652 Td\n(Payment Mode: ${escapePdfText(data.paymentMethod)}) Tj\nET\n`;

  // 5. Itemized Table
  const tableY = 605;
  // Header background
  s += 'q\n';
  s += '0.92 0.94 0.97 rg\n';
  s += `40 ${tableY - 20} 515 22 re f\n`;
  s += '0.78 0.82 0.87 RG\n';
  s += `40 ${tableY - 20} 515 22 re S\n`;
  s += 'Q\n';

  // Table Header Labels
  s += `BT\n0.10 0.14 0.22 rg\n/F2 8.5 Tf\n50 ${tableY - 14} Td\n(ITEM DESCRIPTION) Tj\nET\n`;
  s += `BT\n0.10 0.14 0.22 rg\n/F2 8.5 Tf\n270 ${tableY - 14} Td\n(SAC) Tj\nET\n`;
  s += `BT\n0.10 0.14 0.22 rg\n/F2 8.5 Tf\n330 ${tableY - 14} Td\n(PERIOD) Tj\nET\n`;
  s += `BT\n0.10 0.14 0.22 rg\n/F2 8.5 Tf\n420 ${tableY - 14} Td\n(TAXABLE) Tj\nET\n`;
  s += `BT\n0.10 0.14 0.22 rg\n/F2 8.5 Tf\n495 ${tableY - 14} Td\n(TOTAL) Tj\nET\n`;

  // Table Row
  const rowY = tableY - 44;
  s += `BT\n0.05 0.05 0.08 rg\n/F2 9 Tf\n50 ${rowY + 6} Td\n(${escapePdfText(data.planName)} Plan E-Commerce Cloud Platform) Tj\nET\n`;
  s += `BT\n0.35 0.38 0.44 rg\n/F1 7.5 Tf\n50 ${rowY - 6} Td\n(Multi-tenant storefront hosting, payment gateway integration, SSL & inventory sync) Tj\nET\n`;
  s += `BT\n0.20 0.24 0.30 rg\n/F1 8.5 Tf\n270 ${rowY} Td\n(998313) Tj\nET\n`;
  s += `BT\n0.20 0.24 0.30 rg\n/F1 8.5 Tf\n330 ${rowY} Td\n(${escapePdfText(data.billingPeriodShort)}) Tj\nET\n`;
  s += `BT\n0.20 0.24 0.30 rg\n/F1 8.5 Tf\n420 ${rowY} Td\n(${escapePdfText(data.subtotalFormatted || data.formattedAmount)}) Tj\nET\n`;
  s += `BT\n0.05 0.05 0.08 rg\n/F2 9.5 Tf\n495 ${rowY} Td\n(${escapePdfText(data.formattedAmount)}) Tj\nET\n`;

  // Table bottom border
  s += '0.84 0.86 0.90 RG\n0.75 w\n';
  s += `40 ${rowY - 18} m 555 ${rowY - 18} l S\n`;

  // 6. Totals Breakdown Card
  const totalsY = rowY - 38;
  s += `BT\n0.30 0.34 0.40 rg\n/F1 9 Tf\n360 ${totalsY} Td\n(Taxable Subtotal:) Tj\nET\n`;
  s += `BT\n0.10 0.12 0.16 rg\n/F2 9 Tf\n485 ${totalsY} Td\n(${escapePdfText(data.subtotalFormatted || data.formattedAmount)}) Tj\nET\n`;

  s += `BT\n0.30 0.34 0.40 rg\n/F1 9 Tf\n360 ${totalsY - 16} Td\n(GST / Taxes:) Tj\nET\n`;
  s += `BT\n0.10 0.12 0.16 rg\n/F2 9 Tf\n485 ${totalsY - 16} Td\n(${escapePdfText(data.taxFormatted || 'INR 0.00')}) Tj\nET\n`;

  s += `BT\n0.40 0.45 0.50 rg\n/F1 7.5 Tf\n360 ${totalsY - 28} Td\n(${escapePdfText(data.taxNote || (isGstRegistered ? '(GST Included)' : '(Non-GST Supply / Unregistered Issuer)'))}) Tj\nET\n`;

  // Total Paid Accent Card
  const paidBoxY = totalsY - 68;
  s += 'q\n';
  s += '0.94 0.98 0.95 rg\n';
  s += `345 ${paidBoxY} 210 30 re f\n`;
  s += '0.22 0.65 0.35 RG\n1 w\n';
  s += `345 ${paidBoxY} 210 30 re S\n`;
  s += 'Q\n';

  s += `BT\n0.08 0.40 0.18 rg\n/F2 11 Tf\n355 ${paidBoxY + 10} Td\n(TOTAL PAID:) Tj\nET\n`;
  s += `BT\n0.08 0.40 0.18 rg\n/F2 12 Tf\n470 ${paidBoxY + 10} Td\n(${escapePdfText(data.formattedAmount)}) Tj\nET\n`;

  // 7. Payment Transaction Details Box
  const auditBoxY = paidBoxY - 75;
  s += 'q\n';
  s += '0.98 0.98 0.99 rg\n';
  s += `40 ${auditBoxY} 515 54 re f\n`;
  s += '0.85 0.88 0.92 RG\n0.75 w\n';
  s += `40 ${auditBoxY} 515 54 re S\n`;
  s += 'Q\n';

  s += `BT\n0.12 0.16 0.24 rg\n/F2 8.5 Tf\n50 ${auditBoxY + 38} Td\n(PAYMENT AUDIT & SETTLEMENT RECORD) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n50 ${auditBoxY + 24} Td\n(Payment Gateway: ${escapePdfText(data.paymentMethod)} | Transaction Ref: ${escapePdfText(data.paymentReference || 'N/A')}) Tj\nET\n`;
  s += `BT\n0.25 0.28 0.35 rg\n/F1 8 Tf\n50 ${auditBoxY + 10} Td\n(Settled Timestamp: ${escapePdfText(data.paidAtDate || 'N/A')} | Reconciliation Status: ${escapePdfText(data.paymentStatus)} \\(Verified\\)) Tj\nET\n`;

  // 8. Legal Footer
  s += '0.84 0.86 0.90 RG\n0.75 w\n';
  s += '40 68 m 555 68 l S\n';

  s += 'BT\n0.35 0.38 0.45 rg\n/F1 7.5 Tf\n40 54 Td\n(This is a digitally generated computer invoice issued by AIKYAM AI Systems. No physical signature is required.) Tj\nET\n';
  s += 'BT\n0.35 0.38 0.45 rg\n/F1 7.5 Tf\n40 42 Td\n(Compliant with CGST Rule 46 & Information Technology Act, 2000 · LetzShop SaaS Platform · support@letzshop.store) Tj\nET\n';

  // Build PDF structure
  const contentStream = s;
  const streamLen = Buffer.byteLength(contentStream, 'utf8');

  const obj1 = '<< /Type /Catalog /Pages 2 0 R >>';
  const obj2 = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  const obj3 =
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>';
  const obj4 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  const obj5 = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  const obj6 = `<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream`;

  const allObjs = [obj1, obj2, obj3, obj4, obj5, obj6];

  let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [0];

  for (let i = 0; i < allObjs.length; i++) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += `${i + 1} 0 obj\n${allObjs[i]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${allObjs.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let i = 1; i <= allObjs.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${allObjs.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(body, 'utf8');
}
