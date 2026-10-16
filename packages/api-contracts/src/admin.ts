export type AdminRange = '7d' | '30d' | '3m' | '6m' | '12m' | 'ALL';
export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt?: string;
  _count?: {
    orders: number;
    products: number;
    customers: number;
    productReviews: number;
  };
}
export interface AdminPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  pricePaise: number;
  billingCycle: string;
  maxProducts: number;
  maxStaff: number;
  maxStorageMb: number;
  customDomainAllowed: boolean;
  isPublic: boolean;
  availability: 'AVAILABLE' | 'HIDDEN' | 'COMING_SOON' | 'CONTACT';
  purchasable: boolean;
  merchantCount: number;
  activeSubscribersCount: number;
}
export interface AdminOwner {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
}
export interface AdminSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  plan: Pick<AdminPlan, 'id' | 'name' | 'code' | 'pricePaise'>;
  tenant: { id: string; name: string };
  invoices?: Array<{ status: string; paidAt: string | null }>;
}
export interface AdminMerchant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: AdminOwner | null;
  store: AdminStore | null;
  subscription: Omit<AdminSubscription, 'tenant' | 'createdAt'> | null;
}
export interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  amountPaise: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}
export interface AdminMerchantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  memberships: Array<{ id: string; role: string; user: AdminOwner }>;
  stores: Array<AdminStore & { _count: NonNullable<AdminStore['_count']> }>;
  subscriptions: Array<Omit<AdminSubscription, 'tenant'>>;
  paymentHistory: AdminInvoice[];
  reportedReviewCount: number;
}
export interface AdminOrder {
  id: string;
  orderNumber: string;
  totalPaise: number;
  currency: string;
  paymentMethod: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  shipmentStatus: string;
  status: string;
  createdAt: string;
  store: { id: string; name: string; slug: string };
  customer: { fullName: string };
}
export interface AdminUser extends AdminOwner {
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  store: AdminStore | null;
}
export interface AdminReport {
  id: string;
  reviewId: string;
  reason: string;
  merchantNote: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
export interface AdminReview {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  status: 'ACTIVE' | 'REMOVED';
  moderationReason: string | null;
  createdAt: string;
  store: { id: string; name: string; slug: string };
  product: { id: string; name: string; slug: string };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
  reports: AdminReport[];
}
export interface AdminReviewFilters {
  stores: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; storeId: string }>;
}
export interface AdminPayment {
  id: string;
  amountPaise: number;
  status: string;
  paymentMethod: string;
  providerPaymentId: string | null;
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    currency: string;
    paidAt: string | null;
    tenant: { id: string; name: string };
    subscription: { plan: { name: string } };
  };
}
export interface AdminAudit {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  reason: string | null;
  previousStatus?: string;
  status?: string;
}
export interface AdminCharts {
  merchantGrowth: Array<{ date: string; count: number }>;
  subscriptionRevenueTrends: Array<{ date: string; amountPaise: number }>;
  orderTrends: Array<{ date: string; count: number; gmvPaise: number }>;
  reportTrends: Array<{ date: string; count: number; resolved: number }>;
}
export interface AdminOverview {
  generatedAt: string;
  kpis: {
    totalMerchants: number;
    liveStores: number;
    privateStores: number;
    suspendedStores: number;
    activeSubscriptions: number;
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalReviews: number;
    pendingReviewReports: number;
    subscriptionRevenuePaise: number;
  };
  recentlyJoinedMerchants: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
  recentOrders: Array<
    Pick<
      AdminOrder,
      | 'id'
      | 'orderNumber'
      | 'totalPaise'
      | 'currency'
      | 'paymentStatus'
      | 'createdAt'
    > & { store: { name: string } }
  >;
  reviewModeration: {
    pendingReports: number;
    removedThisMonth: number;
    resolvedReports: number;
    latestPendingReports: Array<
      Pick<AdminReport, 'id' | 'reason' | 'status' | 'createdAt'> & {
        review: {
          id: string;
          rating: number;
          reviewerName: string;
          store: { name: string };
          product: { name: string };
        };
      }
    >;
  };
  range: AdminRange;
  charts: AdminCharts;
  definitions: Record<string, string>;
}
export interface AdminAnalytics {
  range: AdminRange;
  kpis: {
    totalOrders: number;
    paidOrdersCount: number;
    totalGmvPaise: number;
    averageOrderValuePaise: number;
    subscriptionRevenuePaise: number;
  };
  charts: AdminCharts;
  topStores: Array<{
    id: string;
    name: string;
    slug: string;
    ordersCount: number;
  }>;
}
export interface AdminOperations {
  outbox: { totalEvents: number; pendingEvents: number; failedEvents: number };
  failedOutbox: Array<{
    id: string;
    eventType: string;
    status: string;
    retryCount: number;
    maxRetries: number;
  }>;
}
export interface AdminSettings {
  platformName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  source: string;
  moderation: string;
  plansSource: string;
  growthPurchaseEnabled: boolean;
}
export interface AdminTheme {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  updatedAt: string;
  _count: { storeConfigs: number };
}
