// ==============================================================================
// Simply E-Commerce: Unified Type-Safe REST API Client
// Consumed by apps/seller, apps/storefront, and apps/admin
// ==============================================================================

import { ApiResponse, ApiErrorResponse } from './index';

export class SimplyApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private onTokenRefreshed?: (accessToken: string, refreshToken: string) => void;

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

  public setRefreshToken(token: string | null) {
    this.refreshToken = token;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  public setOnTokenRefreshed(cb?: (accessToken: string, refreshToken: string) => void) {
    this.onTokenRefreshed = cb;
  }

  public async request<T = any>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, any>;
      _isRetry?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, params, _isRetry = false } = options;

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

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr: any) {
      const err = new Error('Unable to connect to Simply E-Commerce API servers.') as any;
      err.code = 'NETWORK_OFFLINE';
      err.status = 0;
      err.details = networkErr?.message;
      throw err;
    }

    // Auto-refresh token if 401 Unauthorized occurs on a protected route and refreshToken is present
    if (res.status === 401 && !_isRetry && this.refreshToken && !path.startsWith('auth/')) {
      try {
        const refreshRes = await this.auth.refreshSession(this.refreshToken);
        if (refreshRes?.accessToken) {
          this.setToken(refreshRes.accessToken);
          if (refreshRes.refreshToken) {
            this.setRefreshToken(refreshRes.refreshToken);
          }
          this.onTokenRefreshed?.(refreshRes.accessToken, refreshRes.refreshToken || this.refreshToken);
          return this.request<T>(path, { ...options, _isRetry: true });
        }
      } catch {
        // Refresh failed, proceed to handle original 401 error
      }
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.success === false) {
      let defaultCode = 'API_ERROR';
      if (res.status === 404) defaultCode = 'NOT_FOUND';
      else if (res.status === 401) defaultCode = 'UNAUTHORIZED';
      else if (res.status === 403) defaultCode = 'FORBIDDEN';
      else if (res.status === 503) defaultCode = 'API_UNAVAILABLE';
      else if (res.status >= 500) defaultCode = 'INTERNAL_ERROR';

      const errorMsg = json?.error?.message || json?.message || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg) as any;
      err.code = json?.error?.code || defaultCode;
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

  // --- Canonical Seller Auth (OTP -> PIN -> Session) ---
  public auth = {
    // Canonical OTP + PIN
    requestRegisterOtp: (phone: string) =>
      this.request('auth/register/request-otp', { method: 'POST', body: { phone } }),
    verifyRegisterOtp: (phone: string, otp: string) =>
      this.request('auth/register/verify-otp', { method: 'POST', body: { phone, otp } }),
    setupPin: (pin: string, tempToken?: string) =>
      this.request('auth/pin/setup', {
        method: 'POST',
        body: { pin },
        headers: tempToken ? { Authorization: `Bearer ${tempToken}` } : {},
      }),
    loginWithPin: (phone: string, pin: string, device?: any) =>
      this.request('auth/pin/login', { method: 'POST', body: { phone, pin, device } }),
    refreshSession: (refreshToken: string) =>
      this.request('auth/session/refresh', { method: 'POST', body: { refreshToken } }),
    requestRecoveryOtp: (phone: string) =>
      this.request('auth/recovery/request-otp', { method: 'POST', body: { phone } }),
    verifyRecoveryOtp: (phone: string, otp: string) =>
      this.request('auth/recovery/verify-otp', { method: 'POST', body: { phone, otp } }),

    // Backward-compat aliases
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
      city?: string;
      state?: string;
    }) => this.request('stores/onboard', { method: 'POST', body: data }),
    getMyStore: () => this.request('stores/my-store'),
    getMetrics: (params?: { period?: string; startDate?: string; endDate?: string }) =>
      this.request('seller/dashboard', { params }),
    getPrivatePreview: () => this.request('stores/my-store/preview'),
    getPublicStorefront: (slug: string, previewSecret?: string) =>
      this.request(`storefront/${slug}`, { params: { previewSecret } }),
  };

  // --- Seller Analytics ---
  public seller = {
    getDashboard: (params?: { period?: string; startDate?: string; endDate?: string }) =>
      this.request('seller/dashboard', { params }),
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
    uploadMediaAsset: (data: {
      filename: string;
      mimeType: string;
      base64Data: string;
      altText?: string;
    }) => this.request('media/asset', { method: 'POST', body: data }),
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

  // --- Orders (Merchant Canonical: /seller/orders; Public Buyer: /orders/checkout, /orders/track) ---
  public orders = {
    checkout: (data: any) => this.request('orders/checkout', { method: 'POST', body: data }),
    getOrders: (params?: {
      page?: number;
      limit?: number;
      pageSize?: number;
      status?: string;
      orderStatus?: string;
      paymentStatus?: string;
      fulfillmentStatus?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }) => this.request('seller/orders', { params }),
    getOrder: (id: string) => this.request(`seller/orders/${id}`),
    updateStatus: (id: string, status: string, reason?: string) =>
      this.request(`seller/orders/${id}/status`, { method: 'PATCH', body: { status, reason } }),
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
