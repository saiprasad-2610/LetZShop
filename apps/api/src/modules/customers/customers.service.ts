import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@simply/types';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getCustomers(tenant: TenantContext) {
    const customers = await this.prisma.customer.findMany({
      where: { storeId: tenant.storeId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, totalPaise: true, paymentStatus: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === 'PAID');
      const totalSpentPaise = paidOrders.reduce((sum, o) => sum + o.totalPaise, 0);
      const lastOrder = c.orders[0];

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        isGuest: c.isGuest,
        orderCount: c.orders.length,
        totalSpentPaise,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        createdAt: c.createdAt,
      };
    });
  }

  public async getCustomerById(tenant: TenantContext, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId: tenant.storeId },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this store.');
    }

    // Also fetch any enquiries submitted by this phone number
    const enquiries = await this.prisma.enquiry.findMany({
      where: { storeId: tenant.storeId, customerPhone: customer.phone },
      orderBy: { createdAt: 'desc' },
    });

    const paidOrders = customer.orders.filter((o) => o.paymentStatus === 'PAID');
    const totalSpentPaise = paidOrders.reduce((sum, o) => sum + o.totalPaise, 0);

    return {
      ...customer,
      totalSpentPaise,
      orderCount: customer.orders.length,
      enquiries,
    };
  }
}
