import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { TenantContext } from '@simply/types';

export interface ReportQueryParams {
  type?: 'sales' | 'orders' | 'products' | 'customers';
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getReportData(tenant: TenantContext, params: ReportQueryParams = {}) {
    const reportType = params.type || 'sales';

    // 1. Fetch store metadata for report header branding
    const store = await this.prisma.store.findFirst({
      where: { id: tenant.storeId, tenantId: tenant.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        supportPhone: true,
        supportEmail: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found for current tenant.');
    }

    // 2. Setup date boundaries
    const dateFilter: any = {};
    if (params.startDate) {
      dateFilter.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      dateFilter.lte = new Date(params.endDate);
    }

    const baseOrderWhere: any = {
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
    };

    if (Object.keys(dateFilter).length > 0) {
      baseOrderWhere.createdAt = dateFilter;
    }

    if (params.status && params.status !== 'ALL') {
      baseOrderWhere.status = params.status as OrderStatus;
    }

    if (params.paymentStatus && params.paymentStatus !== 'ALL') {
      baseOrderWhere.paymentStatus = params.paymentStatus as PaymentStatus;
    }

    switch (reportType) {
      case 'sales':
        return this.getSalesReport(store, baseOrderWhere);
      case 'orders':
        return this.getOrdersReport(store, baseOrderWhere);
      case 'products':
        return this.getProductsReport(store, baseOrderWhere);
      case 'customers':
        return this.getCustomersReport(store, tenant, dateFilter);
      default:
        return this.getSalesReport(store, baseOrderWhere);
    }
  }

  // ============================================================================
  // 1. SALES REPORT (Daily aggregation of revenue, volume, tax, shipping)
  // ============================================================================
  private async getSalesReport(store: any, where: any) {
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        subtotalPaise: true,
        discountPaise: true,
        taxPaise: true,
        shippingPaise: true,
        totalPaise: true,
        currency: true,
      },
    });

    // Group orders by date (YYYY-MM-DD in local context)
    const grouped = new Map<string, {
      date: string;
      ordersCount: number;
      grossSalesPaise: number;
      discountPaise: number;
      netSalesPaise: number;
      taxPaise: number;
      shippingPaise: number;
      totalPaise: number;
      paidCount: number;
      paidTotalPaise: number;
    }>();

    let totalGrossSalesPaise = 0;
    let totalDiscountPaise = 0;
    let totalTaxPaise = 0;
    let totalShippingPaise = 0;
    let totalRevenuePaise = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;

    for (const ord of orders) {
      const dateKey = new Date(ord.createdAt).toISOString().slice(0, 10);
      const gross = ord.subtotalPaise || 0;
      const discount = ord.discountPaise || 0;
      const net = Math.max(0, gross - discount);
      const tax = ord.taxPaise || 0;
      const shipping = ord.shippingPaise || 0;
      const total = ord.totalPaise || 0;
      const isPaid = ord.paymentStatus === 'PAID';

      totalGrossSalesPaise += gross;
      totalDiscountPaise += discount;
      totalTaxPaise += tax;
      totalShippingPaise += shipping;
      totalRevenuePaise += total;

      if (isPaid) {
        paidOrdersCount++;
      } else {
        pendingOrdersCount++;
      }

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          ordersCount: 0,
          grossSalesPaise: 0,
          discountPaise: 0,
          netSalesPaise: 0,
          taxPaise: 0,
          shippingPaise: 0,
          totalPaise: 0,
          paidCount: 0,
          paidTotalPaise: 0,
        });
      }

      const row = grouped.get(dateKey)!;
      row.ordersCount += 1;
      row.grossSalesPaise += gross;
      row.discountPaise += discount;
      row.netSalesPaise += net;
      row.taxPaise += tax;
      row.shippingPaise += shipping;
      row.totalPaise += total;
      if (isPaid) {
        row.paidCount += 1;
        row.paidTotalPaise += total;
      }
    }

    const records = Array.from(grouped.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalOrders = orders.length;
    const avgOrderValuePaise = totalOrders > 0 ? Math.round(totalRevenuePaise / totalOrders) : 0;

    return {
      type: 'sales',
      store,
      summary: {
        totalOrders,
        paidOrdersCount,
        pendingOrdersCount,
        totalGrossSalesPaise,
        totalDiscountPaise,
        totalNetSalesPaise: totalGrossSalesPaise - totalDiscountPaise,
        totalTaxPaise,
        totalShippingPaise,
        totalRevenuePaise,
        avgOrderValuePaise,
      },
      records,
    };
  }

  // ============================================================================
  // 2. ORDERS REPORT (Individual detailed transactions with customer details)
  // ============================================================================
  private async getOrdersReport(store: any, where: any) {
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        orderAddress: true,
        items: true,
      },
    });

    let totalRevenuePaise = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let completedOrdersCount = 0;
    let cancelledOrdersCount = 0;

    const records = orders.map((o) => {
      const deliveryAddress = (o.deliveryAddress as any) || {};
      const customerName =
        o.customer?.fullName ||
        o.orderAddress?.fullName ||
        deliveryAddress.fullName ||
        (o.customer?.email ? o.customer.email.split('@')[0] : null) ||
        'Guest Customer';

      const customerPhone =
        o.customer?.phone ||
        o.orderAddress?.phone ||
        deliveryAddress.phone ||
        '—';

      const customerEmail =
        o.customer?.email ||
        deliveryAddress.email ||
        '—';

      const city =
        o.orderAddress?.city ||
        deliveryAddress.city ||
        '—';

      const pincode =
        o.orderAddress?.pincode ||
        deliveryAddress.pincode ||
        '—';

      const itemsCount = o.items.reduce((acc, it) => acc + (it.quantity || 1), 0);
      const itemsSummary = o.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ') || 'No items';

      totalRevenuePaise += o.totalPaise;
      if (o.paymentStatus === 'PAID') paidOrdersCount++;
      if (o.paymentStatus === 'PENDING') pendingOrdersCount++;
      if (o.status === 'COMPLETED') completedOrdersCount++;
      if (o.status === 'CANCELLED') cancelledOrdersCount++;

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        date: o.createdAt,
        customerName,
        customerPhone,
        customerEmail,
        status: o.status,
        paymentStatus: o.paymentStatus,
        fulfillmentMode: o.fulfillmentMode,
        itemsCount,
        itemsSummary,
        city,
        pincode,
        subtotalPaise: o.subtotalPaise,
        taxPaise: o.taxPaise,
        shippingPaise: o.shippingPaise,
        discountPaise: o.discountPaise,
        totalPaise: o.totalPaise,
      };
    });

    const totalOrders = orders.length;
    const avgOrderValuePaise = totalOrders > 0 ? Math.round(totalRevenuePaise / totalOrders) : 0;

    return {
      type: 'orders',
      store,
      summary: {
        totalOrders,
        paidOrdersCount,
        pendingOrdersCount,
        completedOrdersCount,
        cancelledOrdersCount,
        totalRevenuePaise,
        avgOrderValuePaise,
      },
      records,
    };
  }

  // ============================================================================
  // 3. PRODUCTS REPORT (Catalog performance, units sold & inventory status)
  // ============================================================================
  private async getProductsReport(store: any, orderWhere: any) {
    const orders = await this.prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        items: {
          select: {
            variantId: true,
            productName: true,
            variantTitle: true,
            sku: true,
            quantity: true,
            unitPricePaise: true,
            totalPaise: true,
          },
        },
      },
    });

    // Aggregate by variantId or sku
    const productStats = new Map<string, {
      productName: string;
      variantTitle: string;
      sku: string;
      unitsSold: number;
      revenuePaise: number;
      ordersCount: number;
      variantId?: string;
    }>();

    let totalUnitsSold = 0;
    let totalProductRevenuePaise = 0;

    for (const ord of orders) {
      for (const item of ord.items) {
        const key = item.sku || item.variantId || item.productName;
        totalUnitsSold += item.quantity;
        totalProductRevenuePaise += item.totalPaise;

        if (!productStats.has(key)) {
          productStats.set(key, {
            productName: item.productName,
            variantTitle: item.variantTitle || 'Default',
            sku: item.sku || '—',
            unitsSold: 0,
            revenuePaise: 0,
            ordersCount: 0,
            variantId: item.variantId || undefined,
          });
        }

        const stat = productStats.get(key)!;
        stat.unitsSold += item.quantity;
        stat.revenuePaise += item.totalPaise;
        stat.ordersCount += 1;
      }
    }

    // Lookup current stock levels for these variants
    const variantIds = Array.from(productStats.values())
      .map((s) => s.variantId)
      .filter((id): id is string => Boolean(id));

    const variantsWithStock = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        inventory: { select: { stockOnHand: true, stockReserved: true } },
      },
    });

    const stockMap = new Map<string, number>();
    for (const v of variantsWithStock) {
      // stockOnHand is already decremented by reserved quantities upon order creation
      const available = v.inventory?.stockOnHand ?? 0;
      stockMap.set(v.id, Math.max(0, available));
    }

    const records = Array.from(productStats.values()).map((stat) => ({
      productName: stat.productName,
      variantTitle: stat.variantTitle,
      sku: stat.sku,
      unitsSold: stat.unitsSold,
      revenuePaise: stat.revenuePaise,
      ordersCount: stat.ordersCount,
      currentStock: stat.variantId ? (stockMap.get(stat.variantId) ?? 'N/A') : 'N/A',
      avgSellingPricePaise: stat.unitsSold > 0 ? Math.round(stat.revenuePaise / stat.unitsSold) : 0,
    })).sort((a, b) => b.unitsSold - a.unitsSold);

    return {
      type: 'products',
      store,
      summary: {
        totalProductsSold: records.length,
        totalUnitsSold,
        totalProductRevenuePaise,
        topProduct: records[0]?.productName || 'None',
      },
      records,
    };
  }

  // ============================================================================
  // 4. CUSTOMERS REPORT (Customer LTV, order counts, and contact data)
  // ============================================================================
  private async getCustomersReport(store: any, tenant: TenantContext, dateFilter: any) {
    const customerWhere: any = {
      tenantId: tenant.tenantId,
      storeId: tenant.storeId,
    };

    const customers = await this.prisma.customer.findMany({
      where: customerWhere,
      include: {
        orders: {
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            totalPaise: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    let totalCustomers = customers.length;
    let repeatCustomers = 0;
    let totalSpentPaise = 0;

    const records = customers.map((c) => {
      const ordersCount = c.orders.length;
      const spentPaise = c.orders.reduce((acc, o) => acc + o.totalPaise, 0);
      totalSpentPaise += spentPaise;
      if (ordersCount > 1) repeatCustomers++;

      const firstOrder = c.orders[c.orders.length - 1];
      const lastOrder = c.orders[0];

      return {
        customerId: c.id,
        customerName: c.fullName || 'Guest Customer',
        phone: c.phone,
        email: c.email || '—',
        isGuest: c.isGuest,
        ordersCount,
        totalSpentPaise: spentPaise,
        firstOrderDate: firstOrder ? firstOrder.createdAt : c.createdAt,
        lastOrderDate: lastOrder ? lastOrder.createdAt : c.createdAt,
      };
    }).sort((a, b) => b.totalSpentPaise - a.totalSpentPaise);

    const avgCustomerValuePaise =
      totalCustomers > 0 ? Math.round(totalSpentPaise / totalCustomers) : 0;

    return {
      type: 'customers',
      store,
      summary: {
        totalCustomers,
        repeatCustomers,
        totalSpentPaise,
        avgCustomerValuePaise,
      },
      records,
    };
  }
}
