// ==============================================================================
// Simply E-Commerce: Unified Type-Safe REST API Client
// Consumed by apps/seller, apps/storefront, and apps/admin
// ==============================================================================

import { ApiResponse, ApiErrorResponse } from './index';

export class SimplyApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = 'http://localhost:4000') {
    this.baseUrl = (baseUrl || 'http://localhost:4000')
      .replace(/\/api\/v1\/?$/, '')
      .replace(/\/+$/, '');
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request<T = any>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;

    let url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    if (this.token && !reqHeaders['Authorization']) {
      reqHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      const errorMsg = json?.error?.message || json?.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg) as any;
      err.code = json?.error?.code || 'API_ERROR';
      err.status = res.status;
      err.details = json?.error?.details;
      throw err;
    }

    // Unpack standard envelope if present
    if (json && typeof json === 'object' && 'data' in json && json.success === true) {
      return json.data;
    }

    return json;
  }

  // --- Auth ---
  public auth = {
    sendOtp: (phone: string) => this.request('auth/otp/send', { method: 'POST', body: { phone } }),
    verifyOtp: (phone: string, code: string) =>
      this.request('auth/otp/verify', { method: 'POST', body: { phone, code } }),
    refresh: (refreshToken: string) =>
      this.request('auth/refresh', { method: 'POST', body: { refreshToken } }),
    logout: () => this.request('auth/logout', { method: 'POST' }),
    me: () => this.request('auth/me'),
  };

  // --- Stores ---
  public stores = {
    onboard: (data: {
      businessName: string;
      category: string;
      logoUrl?: string;
      contactPhone?: string;
      contactEmail?: string;
      address?: string;
    }) => this.request('stores/onboard', { method: 'POST', body: data }),
    getMyStore: () => this.request('stores/my-store'),
    getMetrics: () => this.request('stores/my-store/metrics'),
    getPrivatePreview: () => this.request('stores/my-store/preview'),
    getPublicStorefront: (slug: string, previewSecret?: string) =>
      this.request(`storefront/${slug}`, { params: { previewSecret } }),
  };

  // --- Catalog ---
  public catalog = {
    getProducts: (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) =>
      this.request('catalog/products', { params }),
    getProduct: (id: string) => this.request(`catalog/products/${id}`),
    createProduct: (data: any) => this.request('catalog/products', { method: 'POST', body: data }),
    updateProduct: (id: string, data: any) =>
      this.request(`catalog/products/${id}`, { method: 'PUT', body: data }),
    duplicateProduct: (id: string) =>
      this.request(`catalog/products/${id}/duplicate`, { method: 'POST' }),
    deleteProduct: (id: string) => this.request(`catalog/products/${id}`, { method: 'DELETE' }),
    getCategories: () => this.request('catalog/categories'),
    createCategory: (data: { name: string; description?: string }) =>
      this.request('catalog/categories', { method: 'POST', body: data }),
  };

  // --- Inventory ---
  public inventory = {
    getInventory: () => this.request('inventory'),
    adjustStock: (variantId: string, quantity: number, reason?: string) =>
      this.request('inventory/adjust', { method: 'POST', body: { variantId, quantity, reason } }),
  };

  // --- Media ---
  public media = {
    upload: (data: {
      productId: string;
      variantId?: string;
      filename: string;
      mimeType: string;
      base64Data: string;
      altText?: string;
    }) => this.request('media/upload', { method: 'POST', body: data }),
    uploadAsset: (data: {
      type: 'logo' | 'banner';
      filename: string;
      mimeType: string;
      base64Data: string;
    }) => this.request('media/store-asset', { method: 'POST', body: data }),
    delete: (id: string) => this.request(`media/${id}`, { method: 'DELETE' }),
  };

  // --- Cart ---
  public cart = {
    init: (storeId: string, guestToken?: string) =>
      this.request('cart/init', { method: 'POST', body: { storeId, guestToken } }),
    get: (cartId: string) => this.request(`cart/${cartId}`),
    addItem: (cartId: string, variantId: string, quantity = 1) =>
      this.request(`cart/${cartId}/items`, { method: 'POST', body: { variantId, quantity } }),
    updateQuantity: (cartId: string, variantId: string, quantity: number) =>
      this.request(`cart/${cartId}/items/${variantId}`, { method: 'POST', body: { quantity } }),
    removeItem: (cartId: string, variantId: string) =>
      this.request(`cart/${cartId}/items/${variantId}/remove`, { method: 'POST' }),
  };

  // --- Orders ---
  public orders = {
    checkout: (data: any) => this.request('orders/checkout', { method: 'POST', body: data }),
    getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
      this.request('orders', { params }),
    getOrder: (id: string) => this.request(`orders/${id}`),
    updateStatus: (id: string, status: string, reason?: string) =>
      this.request(`orders/${id}/status`, { method: 'PUT', body: { status, reason } }),
    trackOrder: (orderNumber: string, token?: string) =>
      this.request(`orders/track/${orderNumber}`, { params: token ? { t: token } : undefined }),
  };

  // --- Enquiries ---
  public enquiries = {
    create: (data: any) => this.request('enquiries', { method: 'POST', body: data }),
    getEnquiries: () => this.request('enquiries'),
    respond: (id: string, data: { quotationAmountPaise?: number; notes?: string; status?: string }) =>
      this.request(`enquiries/${id}/quotation`, { method: 'PUT', body: data }),
  };

  // --- Customers ---
  public customers = {
    getCustomers: () => this.request('customers'),
    getCustomer: (id: string) => this.request(`customers/${id}`),
  };

  // --- Themes & Studio ---
  public themes = {
    getAvailableThemes: () => this.request('themes/available'),
    getBranding: () => this.request('themes/branding'),
    updateBranding: (data: any) => this.request('themes/branding', { method: 'PUT', body: data }),
    getThemeConfig: () => this.request('themes/config'),
    updateThemeConfig: (data: any) => this.request('themes/config', { method: 'PUT', body: data }),
  };

  // --- Subscriptions ---
  public subscriptions = {
    getPlans: () => this.request('subscriptions/plans'),
    getCurrent: () => this.request('subscriptions/current'),
    createOrder: (planId: string, billingCycle = 'MONTHLY') =>
      this.request('subscriptions/create-order', {
        method: 'POST',
        body: { planId, billingCycle },
      }),
    verify: (data: {
      paymentOrderId?: string;
      providerPaymentId?: string;
      providerOrderId?: string;
      providerSignature?: string;
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
    }) =>
      this.request('subscriptions/verify', {
        method: 'POST',
        body: data,
      }),
    activate: (planId: string, durationDays = 30, paymentOrderId?: string, providerSignature?: string) =>
      this.request('subscriptions/activate', {
        method: 'POST',
        body: { planId, durationDays, paymentOrderId, providerSignature },
      }),
    devActivate: (planId: string, durationDays = 30) =>
      this.request('subscriptions/dev-activate', { method: 'POST', body: { planId, durationDays } }),
  };

  // --- Admin ---
  public admin = {
    getOverview: () => this.request('admin/overview'),
    getMerchants: (search?: string) => this.request('admin/merchants', { params: { search } }),
    getMerchant: (id: string) => this.request(`admin/merchants/${id}`),
    suspendMerchant: (id: string, reason: string) =>
      this.request(`admin/merchants/${id}/suspend`, { method: 'POST', body: { reason } }),
    reactivateMerchant: (id: string, reason: string) =>
      this.request(`admin/merchants/${id}/reactivate`, { method: 'POST', body: { reason } }),
    getCommerce: () => this.request('admin/commerce'),
    getOperations: () => this.request('admin/operations'),
    retryOutbox: (id: string) => this.request(`admin/operations/retry-outbox/${id}`, { method: 'POST' }),
    reconcilePayment: (paymentOrderId: string) =>
      this.request(`admin/operations/reconcile-payment/${paymentOrderId}`, { method: 'POST' }),
  };
}

export const createApiClient = (baseUrl?: string) => new SimplyApiClient(baseUrl);
