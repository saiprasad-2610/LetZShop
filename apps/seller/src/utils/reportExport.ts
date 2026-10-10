import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportExportOptions {
  storeName: string;
  storeSlug?: string;
  dateRangeText: string;
  supportPhone?: string;
  supportEmail?: string;
}

const formatRupees = (paise?: number): string => {
  if (typeof paise !== 'number') return '₹0.00';
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPdfRupees = (paise?: number): string => {
  if (typeof paise !== 'number') return 'Rs. 0.00';
  return `Rs. ${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDateStr = (dateVal: string | Date | undefined): string => {
  if (!dateVal) return '—';
  try {
    return new Date(dateVal).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateVal);
  }
};

/**
 * Export customized report data to real Excel (.xlsx) file
 */
export function exportReportToExcel(reportData: any, options: ReportExportOptions) {
  const wb = XLSX.utils.book_new();
  const type = reportData.type || 'sales';
  const records = reportData.records || [];
  const summary = reportData.summary || {};

  const cleanStore = (options.storeName || 'Store').replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = new Date().toISOString().slice(0, 10);
  const filename = `${cleanStore}_${type}_report_${now}.xlsx`;

  // Header metadata block
  const rows: any[][] = [
    [options.storeName.toUpperCase() + ' - BUSINESS REPORT'],
    [`Report Type: ${type.toUpperCase()} REPORT`, `Period: ${options.dateRangeText}`, `Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
  ];

  if (type === 'sales') {
    // KPI block
    rows.push(['EXECUTIVE SUMMARY']);
    rows.push([
      'Total Orders',
      summary.totalOrders ?? 0,
      'Total Revenue',
      formatRupees(summary.totalRevenuePaise),
      'Average Order Value',
      formatRupees(summary.avgOrderValuePaise),
    ]);
    rows.push([
      'Gross Sales',
      formatRupees(summary.totalGrossSalesPaise),
      'Discounts Given',
      formatRupees(summary.totalDiscountPaise),
      'Net Sales',
      formatRupees(summary.totalNetSalesPaise),
    ]);
    rows.push([
      'Taxes Collected',
      formatRupees(summary.totalTaxPaise),
      'Shipping Charges',
      formatRupees(summary.totalShippingPaise),
      'Paid Orders',
      `${summary.paidOrdersCount ?? 0} / ${summary.totalOrders ?? 0}`,
    ]);
    rows.push([]);

    // Data table
    rows.push([
      'Date',
      'Total Orders',
      'Gross Sales (₹)',
      'Discounts (₹)',
      'Net Sales (₹)',
      'Tax (₹)',
      'Shipping (₹)',
      'Total Revenue (₹)',
      'Paid Orders Count',
      'Paid Revenue (₹)',
    ]);

    for (const r of records) {
      rows.push([
        formatDateStr(r.date),
        r.ordersCount ?? 0,
        (r.grossSalesPaise || 0) / 100,
        (r.discountPaise || 0) / 100,
        (r.netSalesPaise || 0) / 100,
        (r.taxPaise || 0) / 100,
        (r.shippingPaise || 0) / 100,
        (r.totalPaise || 0) / 100,
        r.paidCount ?? 0,
        (r.paidTotalPaise || 0) / 100,
      ]);
    }

    // Totals row
    rows.push([
      'GRAND TOTAL',
      summary.totalOrders ?? 0,
      (summary.totalGrossSalesPaise || 0) / 100,
      (summary.totalDiscountPaise || 0) / 100,
      (summary.totalNetSalesPaise || 0) / 100,
      (summary.totalTaxPaise || 0) / 100,
      (summary.totalShippingPaise || 0) / 100,
      (summary.totalRevenuePaise || 0) / 100,
      summary.paidOrdersCount ?? 0,
      (summary.totalRevenuePaise || 0) / 100,
    ]);
  } else if (type === 'orders') {
    // Orders register
    rows.push(['EXECUTIVE SUMMARY']);
    rows.push([
      'Total Orders',
      summary.totalOrders ?? 0,
      'Total Revenue',
      formatRupees(summary.totalRevenuePaise),
      'Paid Orders',
      summary.paidOrdersCount ?? 0,
      'Pending Orders',
      summary.pendingOrdersCount ?? 0,
    ]);
    rows.push([]);

    rows.push([
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Status',
      'Payment Status',
      'Fulfillment Mode',
      'Items Count',
      'Items Summary',
      'Delivery City',
      'Pincode',
      'Subtotal (₹)',
      'Tax (₹)',
      'Shipping (₹)',
      'Discount (₹)',
      'Total Amount (₹)',
    ]);

    for (const r of records) {
      rows.push([
        r.orderNumber,
        new Date(r.date).toLocaleString('en-IN'),
        r.customerName,
        r.customerPhone,
        r.customerEmail,
        r.status,
        r.paymentStatus,
        r.fulfillmentMode || 'DELIVERY',
        r.itemsCount,
        r.itemsSummary,
        r.city,
        r.pincode,
        (r.subtotalPaise || 0) / 100,
        (r.taxPaise || 0) / 100,
        (r.shippingPaise || 0) / 100,
        (r.discountPaise || 0) / 100,
        (r.totalPaise || 0) / 100,
      ]);
    }

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      records.reduce((acc: number, r: any) => acc + (r.itemsCount || 0), 0),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      (summary.totalRevenuePaise || 0) / 100,
    ]);
  } else if (type === 'products') {
    rows.push(['EXECUTIVE SUMMARY']);
    rows.push([
      'Unique Products Sold',
      summary.totalProductsSold ?? 0,
      'Total Units Sold',
      summary.totalUnitsSold ?? 0,
      'Total Product Revenue',
      formatRupees(summary.totalProductRevenuePaise),
      'Top Product',
      summary.topProduct || '—',
    ]);
    rows.push([]);

    rows.push([
      'Product Name',
      'Variant',
      'SKU',
      'Units Sold',
      'Current Stock',
      'Avg Selling Price (₹)',
      'Total Revenue (₹)',
      'Orders Containing Product',
    ]);

    for (const r of records) {
      rows.push([
        r.productName,
        r.variantTitle,
        r.sku,
        r.unitsSold,
        r.currentStock,
        (r.avgSellingPricePaise || 0) / 100,
        (r.revenuePaise || 0) / 100,
        r.ordersCount,
      ]);
    }

    rows.push([
      'TOTAL',
      '',
      '',
      summary.totalUnitsSold ?? 0,
      '',
      '',
      (summary.totalProductRevenuePaise || 0) / 100,
      '',
    ]);
  } else if (type === 'customers') {
    rows.push(['EXECUTIVE SUMMARY']);
    rows.push([
      'Total Customers',
      summary.totalCustomers ?? 0,
      'Repeat Customers',
      summary.repeatCustomers ?? 0,
      'Total Spent',
      formatRupees(summary.totalSpentPaise),
      'Average Customer Value',
      formatRupees(summary.avgCustomerValuePaise),
    ]);
    rows.push([]);

    rows.push([
      'Customer Name',
      'Phone Number',
      'Email Address',
      'Guest Checkout',
      'Total Orders Placed',
      'Total Spend (₹)',
      'First Order Date',
      'Last Order Date',
    ]);

    for (const r of records) {
      rows.push([
        r.customerName,
        r.phone,
        r.email,
        r.isGuest ? 'Yes' : 'No',
        r.ordersCount,
        (r.totalSpentPaise || 0) / 100,
        formatDateStr(r.firstOrderDate),
        formatDateStr(r.lastOrderDate),
      ]);
    }

    rows.push([
      'TOTAL',
      '',
      '',
      '',
      records.reduce((acc: number, r: any) => acc + (r.ordersCount || 0), 0),
      (summary.totalSpentPaise || 0) / 100,
      '',
      '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set friendly column widths
  const colWidths = rows.reduce((acc: number[], row: any[]) => {
    row.forEach((cell, idx) => {
      const len = String(cell ?? '').length;
      acc[idx] = Math.max(acc[idx] || 12, Math.min(len + 3, 40));
    });
    return acc;
  }, []);
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  XLSX.utils.book_append_sheet(wb, ws, `${type.toUpperCase()} Report`);
  XLSX.writeFile(wb, filename);
}

/**
 * Export customized report to high-resolution, beautifully styled PDF
 */
export function exportReportToPdf(reportData: any, options: ReportExportOptions) {
  const type = reportData.type || 'sales';
  const records = reportData.records || [];
  const summary = reportData.summary || {};
  const isLandscape = type === 'orders';

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cleanStore = (options.storeName || 'Store').replace(/[^a-zA-Z0-9_-]/g, '_');
  const nowStr = new Date().toISOString().slice(0, 10);
  const filename = `${cleanStore}_${type}_report_${nowStr}.pdf`;

  // 1. Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 68, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(options.storeName || 'Merchant Store', 36, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Official Business Report • ${type.toUpperCase()}`, 36, 48);

  // Right Header metadata
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  const generatedText = `Generated: ${new Date().toLocaleString('en-IN')}`;
  doc.text(generatedText, pageWidth - 36, 30, { align: 'right' });
  doc.text(`Period: ${options.dateRangeText}`, pageWidth - 36, 46, { align: 'right' });

  // 2. Report Subheading & Contacts
  let currentY = 88;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  const titlesMap: Record<string, string> = {
    sales: 'Sales & Revenue Performance Report',
    orders: 'Detailed Itemized Orders Register',
    products: 'Product Catalog Sales & Stock Report',
    customers: 'Customer Lifetime Value & Activity Report',
  };
  doc.text(titlesMap[type] || 'Merchant Report', 36, currentY);

  if (options.supportPhone || options.supportEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const contactStr = [
      options.supportPhone ? `Phone: ${options.supportPhone}` : null,
      options.supportEmail ? `Email: ${options.supportEmail}` : null,
    ].filter(Boolean).join('  |  ');
    doc.text(contactStr, 36, currentY + 14);
    currentY += 12;
  }
  currentY += 18;

  // 3. Executive KPI Cards Banner
  const kpiBoxY = currentY;
  const kpiBoxHeight = 44;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(36, kpiBoxY, pageWidth - 72, kpiBoxHeight, 6, 6, 'FD');

  const availableWidth = pageWidth - 72;
  const colWidth = availableWidth / 4;

  let kpis: { label: string; value: string }[] = [];
  if (type === 'sales') {
    kpis = [
      { label: 'TOTAL REVENUE', value: formatPdfRupees(summary.totalRevenuePaise) },
      { label: 'TOTAL ORDERS', value: String(summary.totalOrders ?? 0) },
      { label: 'NET SALES', value: formatPdfRupees(summary.totalNetSalesPaise) },
      { label: 'AVG ORDER VALUE', value: formatPdfRupees(summary.avgOrderValuePaise) },
    ];
  } else if (type === 'orders') {
    kpis = [
      { label: 'TOTAL ORDERS', value: String(summary.totalOrders ?? 0) },
      { label: 'TOTAL REVENUE', value: formatPdfRupees(summary.totalRevenuePaise) },
      { label: 'PAID ORDERS', value: String(summary.paidOrdersCount ?? 0) },
      { label: 'AVG ORDER VALUE', value: formatPdfRupees(summary.avgOrderValuePaise) },
    ];
  } else if (type === 'products') {
    kpis = [
      { label: 'PRODUCTS SOLD', value: String(summary.totalProductsSold ?? 0) },
      { label: 'UNITS SOLD', value: String(summary.totalUnitsSold ?? 0) },
      { label: 'TOTAL REVENUE', value: formatPdfRupees(summary.totalProductRevenuePaise) },
      { label: 'TOP PRODUCT', value: String(summary.topProduct || '—').slice(0, 18) },
    ];
  } else {
    kpis = [
      { label: 'TOTAL CUSTOMERS', value: String(summary.totalCustomers ?? 0) },
      { label: 'REPEAT CUSTOMERS', value: String(summary.repeatCustomers ?? 0) },
      { label: 'TOTAL SPENT', value: formatPdfRupees(summary.totalSpentPaise) },
      { label: 'AVG VALUE / USER', value: formatPdfRupees(summary.avgCustomerValuePaise) },
    ];
  }

  kpis.forEach((kpi, idx) => {
    const x = 36 + idx * colWidth + 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(kpi.label, x, kpiBoxY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(kpi.value, x, kpiBoxY + 32);
  });

  currentY = kpiBoxY + kpiBoxHeight + 16;

  // 4. Data Table Configuration
  let head: string[][] = [];
  let body: (string | number)[][] = [];

  if (type === 'sales') {
    head = [[
      'Date',
      'Orders',
      'Gross Sales',
      'Discounts',
      'Net Sales',
      'Tax (GST)',
      'Shipping',
      'Paid Orders',
      'Total Revenue',
    ]];

    body = records.map((r: any) => [
      formatDateStr(r.date),
      r.ordersCount,
      formatPdfRupees(r.grossSalesPaise),
      formatPdfRupees(r.discountPaise),
      formatPdfRupees(r.netSalesPaise),
      formatPdfRupees(r.taxPaise),
      formatPdfRupees(r.shippingPaise),
      `${r.paidCount || 0} (${formatPdfRupees(r.paidTotalPaise)})`,
      formatPdfRupees(r.totalPaise),
    ]);

    // Foot row
    body.push([
      'GRAND TOTAL',
      summary.totalOrders ?? 0,
      formatPdfRupees(summary.totalGrossSalesPaise),
      formatPdfRupees(summary.totalDiscountPaise),
      formatPdfRupees(summary.totalNetSalesPaise),
      formatPdfRupees(summary.totalTaxPaise),
      formatPdfRupees(summary.totalShippingPaise),
      `${summary.paidOrdersCount ?? 0} paid`,
      formatPdfRupees(summary.totalRevenuePaise),
    ]);
  } else if (type === 'orders') {
    head = [[
      'Order #',
      'Date',
      'Customer',
      'Phone',
      'City',
      'Items',
      'Payment',
      'Status',
      'Total Amount',
    ]];

    body = records.map((r: any) => [
      `#${r.orderNumber}`,
      formatDateStr(r.date),
      r.customerName,
      r.customerPhone,
      r.city || '—',
      `${r.itemsCount} (${r.itemsSummary?.slice(0, 22) || ''})`,
      r.paymentStatus,
      r.status,
      formatPdfRupees(r.totalPaise),
    ]);

    body.push([
      'TOTAL',
      `${summary.totalOrders} orders`,
      '',
      '',
      '',
      '',
      `${summary.paidOrdersCount} Paid`,
      '',
      formatPdfRupees(summary.totalRevenuePaise),
    ]);
  } else if (type === 'products') {
    head = [[
      'Product Name',
      'Variant',
      'SKU',
      'Units Sold',
      'Current Stock',
      'Avg Price',
      'Orders Count',
      'Total Revenue',
    ]];

    body = records.map((r: any) => [
      r.productName,
      r.variantTitle,
      r.sku,
      r.unitsSold,
      String(r.currentStock),
      formatPdfRupees(r.avgSellingPricePaise),
      r.ordersCount,
      formatPdfRupees(r.revenuePaise),
    ]);

    body.push([
      'TOTAL',
      '',
      '',
      summary.totalUnitsSold ?? 0,
      '',
      '',
      '',
      formatPdfRupees(summary.totalProductRevenuePaise),
    ]);
  } else {
    head = [[
      'Customer Name',
      'Phone',
      'Email',
      'Orders',
      'First Order',
      'Last Order',
      'Total Spent',
    ]];

    body = records.map((r: any) => [
      r.customerName,
      r.phone,
      r.email,
      r.ordersCount,
      formatDateStr(r.firstOrderDate),
      formatDateStr(r.lastOrderDate),
      formatPdfRupees(r.totalSpentPaise),
    ]);

    body.push([
      'TOTAL',
      '',
      '',
      records.reduce((acc: number, r: any) => acc + (r.ordersCount || 0), 0),
      '',
      '',
      formatPdfRupees(summary.totalSpentPaise),
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head,
    body,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      // Align numeric and amount columns
      [head[0].length - 1]: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight the last Grand Total row
      if (data.row.index === body.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: 36, right: 36, top: 40, bottom: 40 },
    didDrawPage: (data) => {
      // Footer on all pages
      const pageNumber = data.pageNumber || 1;
      const totalPages = (doc as any).internal?.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `ShopOnGo Platform • Store: ${options.storeName} • Confidential`,
        36,
        pageHeight - 20
      );
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - 36,
        pageHeight - 20,
        { align: 'right' }
      );
    },
  });

  doc.save(filename);
}

/**
 * Print Report View: Opens a clean formatted window ready for browser printing
 */
export function printReportView(reportData: any, options: ReportExportOptions) {
  const type = reportData.type || 'sales';
  const records = reportData.records || [];
  const summary = reportData.summary || {};

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable report.');
    return;
  }

  let tableHeaderHtml = '';
  let tableRowsHtml = '';

  if (type === 'sales') {
    tableHeaderHtml = `
      <tr>
        <th>Date</th>
        <th>Orders</th>
        <th>Gross Sales</th>
        <th>Discounts</th>
        <th>Net Sales</th>
        <th>Tax</th>
        <th>Shipping</th>
        <th>Total Revenue</th>
      </tr>
    `;
    tableRowsHtml = records.map((r: any) => `
      <tr>
        <td>${formatDateStr(r.date)}</td>
        <td>${r.ordersCount}</td>
        <td>${formatRupees(r.grossSalesPaise)}</td>
        <td>${formatRupees(r.discountPaise)}</td>
        <td>${formatRupees(r.netSalesPaise)}</td>
        <td>${formatRupees(r.taxPaise)}</td>
        <td>${formatRupees(r.shippingPaise)}</td>
        <td><strong>${formatRupees(r.totalPaise)}</strong></td>
      </tr>
    `).join('') + `
      <tr class="total-row">
        <td><strong>GRAND TOTAL</strong></td>
        <td><strong>${summary.totalOrders ?? 0}</strong></td>
        <td><strong>${formatRupees(summary.totalGrossSalesPaise)}</strong></td>
        <td><strong>${formatRupees(summary.totalDiscountPaise)}</strong></td>
        <td><strong>${formatRupees(summary.totalNetSalesPaise)}</strong></td>
        <td><strong>${formatRupees(summary.totalTaxPaise)}</strong></td>
        <td><strong>${formatRupees(summary.totalShippingPaise)}</strong></td>
        <td><strong>${formatRupees(summary.totalRevenuePaise)}</strong></td>
      </tr>
    `;
  } else if (type === 'orders') {
    tableHeaderHtml = `
      <tr>
        <th>Order #</th>
        <th>Date</th>
        <th>Customer</th>
        <th>Phone</th>
        <th>City</th>
        <th>Items</th>
        <th>Payment</th>
        <th>Status</th>
        <th>Total Amount</th>
      </tr>
    `;
    tableRowsHtml = records.map((r: any) => `
      <tr>
        <td>#${r.orderNumber}</td>
        <td>${new Date(r.date).toLocaleString('en-IN')}</td>
        <td>${r.customerName}</td>
        <td>${r.customerPhone}</td>
        <td>${r.city || '—'}</td>
        <td>${r.itemsCount} (${r.itemsSummary?.slice(0, 24) || ''})</td>
        <td>${r.paymentStatus}</td>
        <td>${r.status}</td>
        <td><strong>${formatRupees(r.totalPaise)}</strong></td>
      </tr>
    `).join('') + `
      <tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td colspan="7"><strong>${summary.totalOrders ?? 0} Orders (${summary.paidOrdersCount ?? 0} Paid)</strong></td>
        <td><strong>${formatRupees(summary.totalRevenuePaise)}</strong></td>
      </tr>
    `;
  } else if (type === 'products') {
    tableHeaderHtml = `
      <tr>
        <th>Product Name</th>
        <th>Variant</th>
        <th>SKU</th>
        <th>Units Sold</th>
        <th>Current Stock</th>
        <th>Avg Price</th>
        <th>Revenue</th>
      </tr>
    `;
    tableRowsHtml = records.map((r: any) => `
      <tr>
        <td>${r.productName}</td>
        <td>${r.variantTitle}</td>
        <td>${r.sku}</td>
        <td>${r.unitsSold}</td>
        <td>${r.currentStock}</td>
        <td>${formatRupees(r.avgSellingPricePaise)}</td>
        <td><strong>${formatRupees(r.revenuePaise)}</strong></td>
      </tr>
    `).join('') + `
      <tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td colspan="2"></td>
        <td><strong>${summary.totalUnitsSold ?? 0}</strong></td>
        <td colspan="2"></td>
        <td><strong>${formatRupees(summary.totalProductRevenuePaise)}</strong></td>
      </tr>
    `;
  } else {
    tableHeaderHtml = `
      <tr>
        <th>Customer Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Orders Count</th>
        <th>First Order</th>
        <th>Last Order</th>
        <th>Total Spent</th>
      </tr>
    `;
    tableRowsHtml = records.map((r: any) => `
      <tr>
        <td>${r.customerName}</td>
        <td>${r.phone}</td>
        <td>${r.email}</td>
        <td>${r.ordersCount}</td>
        <td>${formatDateStr(r.firstOrderDate)}</td>
        <td>${formatDateStr(r.lastOrderDate)}</td>
        <td><strong>${formatRupees(r.totalSpentPaise)}</strong></td>
      </tr>
    `).join('') + `
      <tr class="total-row">
        <td><strong>TOTAL</strong></td>
        <td colspan="5"><strong>${summary.totalCustomers ?? 0} Customers (${summary.repeatCustomers ?? 0} Repeat)</strong></td>
        <td><strong>${formatRupees(summary.totalSpentPaise)}</strong></td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.storeName} - ${type.toUpperCase()} Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 20px; }
          .store-name { font-size: 24px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #475569; }
          .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .kpi-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
          th { background: #1e293b; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .total-row { background: #e2e8f0 !important; font-weight: bold; }
          .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print {
            body { margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="store-name">${options.storeName}</div>
            <div class="sub">${type.toUpperCase()} REPORT • Generated from ShopOnGo Platform</div>
          </div>
          <div class="meta">
            <div><strong>Period:</strong> ${options.dateRangeText}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="kpi-container">
          <div class="kpi-card">
            <div class="kpi-label">TOTAL REVENUE</div>
            <div class="kpi-val">${formatRupees(summary.totalRevenuePaise ?? summary.totalSpentPaise ?? summary.totalProductRevenuePaise)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">TOTAL VOLUME</div>
            <div class="kpi-val">${summary.totalOrders ?? summary.totalUnitsSold ?? summary.totalCustomers ?? 0}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">PAID / SUCCESS</div>
            <div class="kpi-val">${summary.paidOrdersCount ?? summary.repeatCustomers ?? summary.totalProductsSold ?? '—'}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">AVERAGE VALUE</div>
            <div class="kpi-val">${formatRupees(summary.avgOrderValuePaise ?? summary.avgCustomerValuePaise ?? 0)}</div>
          </div>
        </div>

        <table>
          <thead>${tableHeaderHtml}</thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>

        <div class="footer">
          ShopOnGo E-Commerce Platform • Merchant Confidential • Printed on ${new Date().toLocaleString('en-IN')}
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
