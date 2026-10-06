# SIMPLY E-COMMERCE — API CONTRACTS SPECIFICATION

**API Version:** `v1`  
**Protocol:** HTTPS / JSON REST  
**Authentication:** Bearer JWT (Seller & Admin), Anonymous / Token (Storefront & Cart)  
**Base URL:** `http://localhost:4000/api/v1`

---

## 1. Global Standards & Envelopes

### 1.1 Success Response Envelope
All successful API responses return HTTP 200 or 201 with the following structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 1.2 Unified Error Response Envelope
Every error response strictly follows this uniform schema without exposing internal database errors or stack traces:
```json
{
  "error": {
    "code": "PRODUCT_OUT_OF_STOCK",
    "message": "This item is no longer available in the selected quantity.",
    "requestId": "req_01HZX87K7PQW",
    "details": [
      { "field": "quantity", "issue": "Available stock is 2" }
    ]
  }
}
```

### 1.3 Canonical Error Code Matrix
| HTTP Status | Error Code | Client Interpretation / Trigger |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Schema / DTO validation failed on submitted body/query parameters. |
| 400 | `MOQ_NOT_MET` | Minimum order quantity for wholesale/B2B product not met. |
| 401 | `UNAUTHORIZED` | Missing, expired, or invalid session token. |
| 401 | `PIN_INVALID` | Incorrect seller security PIN entered. |
| 401 | `PIN_LOCKED` | Too many failed PIN attempts; account locked temporarily. |
| 401 | `OTP_INVALID` | Invalid OTP code. |
| 401 | `OTP_EXPIRED` | OTP expired after 5-minute validity window. |
| 403 | `FORBIDDEN` | Access denied. Insufficient membership or role permissions. |
| 403 | `SUBSCRIPTION_REQUIRED` | Storefront or feature inaccessible because merchant has no active SaaS subscription. |
| 403 | `STORE_PRIVATE` | Store is in `DRAFT` or `PRIVATE_PREVIEW` mode and request lacks valid preview credentials. |
| 404 | `STORE_NOT_FOUND` | Store slug does not exist on platform. |
| 404 | `PRODUCT_NOT_FOUND` | Product ID or slug does not exist within the store. |
| 404 | `VARIANT_NOT_FOUND` | SKU / Variant ID does not exist within the store. |
| 404 | `ORDER_NOT_FOUND` | Order number does not exist or tracking token is invalid. |
| 409 | `OUT_OF_STOCK` | Requested inventory is no longer available. |
| 409 | `IDEMPOTENCY_CONFLICT` | Concurrent request with identical idempotency key is already processing. |
| 422 | `PAYMENT_FAILED` | Gateway declined the transaction or payment verification failed. |
| 429 | `RATE_LIMIT_EXCEEDED` | Request rate exceeded allowed limits. |
| 500 | `INTERNAL_ERROR` | Unexpected server failure. Logged with requestId for investigation. |
| 503 | `API_UNAVAILABLE` | Backend or downstream payment gateway temporarily unreachable. |

---

## 2. Seller Authentication APIs

### 2.1 First Registration — Step 1: Request OTP
- **Endpoint:** `POST /api/v1/auth/register/request-otp`
- **Auth:** Public
- **Request Body:**
```json
{
  "phone": "+919876543210"
}
```
- **Validation:** Valid Indian mobile number (E.164 format `+91XXXXXXXXXX`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "challengeId": "otp_chal_01HZX89AB",
    "expiresInSeconds": 300,
    "message": "OTP sent successfully to +919876543210"
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.2 First Registration — Step 2: Verify OTP
- **Endpoint:** `POST /api/v1/auth/register/verify-otp`
- **Auth:** Public
- **Request Body:**
```json
{
  "phone": "+919876543210",
  "code": "123456"
}
```
- **Note:** In `NODE_ENV !== 'production'`, code `123456` is accepted by the dev OTP provider. In production, fails closed without real SMS gateway verification.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "verificationToken": "ver_tok_89fa82e817bc",
    "isNewUser": true,
    "phone": "+919876543210"
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.3 First Registration — Step 3: Setup Security PIN & Account
- **Endpoint:** `POST /api/v1/auth/pin/setup`
- **Auth:** Public (requires `verificationToken`)
- **Request Body:**
```json
{
  "verificationToken": "ver_tok_89fa82e817bc",
  "phone": "+919876543210",
  "pin": "1234",
  "fullName": "Sohan Katageri",
  "email": "sohan@example.com"
}
```
- **Validation:** PIN must be 4 to 6 numeric digits.
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01HZX9",
      "phone": "+919876543210",
      "fullName": "Sohan Katageri",
      "role": "SELLER_OWNER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "ref_tok_9821a...",
      "expiresIn": 900
    }
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.4 Subsequent Seller Access — PIN Login
- **Endpoint:** `POST /api/v1/auth/pin/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "phone": "+919876543210",
  "pin": "1234",
  "deviceFingerprint": "dev_fp_chrome_win_xyz"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01HZX9",
      "phone": "+919876543210",
      "fullName": "Sohan Katageri",
      "role": "SELLER_OWNER"
    },
    "tenant": {
      "id": "tnt_01HZX9",
      "name": "Aurelia Atelier",
      "slug": "aurelia-atelier"
    },
    "store": {
      "id": "str_01HZX9",
      "name": "Aurelia Atelier",
      "slug": "aurelia-atelier",
      "status": "LIVE"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "ref_tok_9821a...",
      "expiresIn": 900
    }
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.5 Session Refresh
- **Endpoint:** `POST /api/v1/auth/session/refresh`
- **Auth:** Public (requires rotating refresh token)
- **Request Body:**
```json
{
  "refreshToken": "ref_tok_9821a..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "ref_tok_new_9831b...",
    "expiresIn": 900
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.6 Logout
- **Endpoint:** `POST /api/v1/auth/logout`
- **Auth:** Bearer Token
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully. Session revoked."
  },
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

### 2.7 Recovery — Request & Verify OTP
- **Endpoints:**
  - `POST /api/v1/auth/recovery/request-otp` (`{ "phone": "+919876543210" }`)
  - `POST /api/v1/auth/recovery/verify-otp` (`{ "phone": "+919876543210", "code": "123456" }`)
- **Followed by:** `POST /api/v1/auth/pin/setup` with recovery verification token to reset PIN.

---

## 3. Seller Domain APIs

All Seller APIs require `Authorization: Bearer <accessToken>`.  
**Security Constraint:** The authenticated seller's tenant and store context are derived strictly from the JWT payload and active database `TenantMembership`. The client cannot specify or override an arbitrary `tenantId`.

### 3.1 Profile & Business
- `GET /api/v1/seller/me` — Authenticated seller profile and memberships.
- `GET /api/v1/seller/business` — Tenant details, subscription status, and capabilities.
- `PATCH /api/v1/seller/business` — Update business name, address, contact details.
- `GET /api/v1/seller/store` — Current store settings, branding, status, and domain configuration.
- `PATCH /api/v1/seller/store` — Update store name, description, contact details (supportPhone, supportEmail, whatsappNumber, businessAddress, mapsUrl, socialLinks, fulfillmentMode).
- `POST /api/v1/seller/store/publish` — Publish storefront to `LIVE` status (strictly subscription-gated; requires active paid subscription).
- `POST /api/v1/seller/store/unpublish` — Unpublish storefront to `PRIVATE_PREVIEW` status.
- `GET /api/v1/seller/store/business-hours` — Get weekly store operating hours.
- `PUT /api/v1/seller/store/business-hours` — Replace weekly store operating hours schedule.
- `GET /api/v1/seller/dashboard` — Live revenue, order velocity, attention alerts, and inventory alerts.

### 3.2 Catalog & Inventory Management
- `GET /api/v1/seller/categories` — List store categories with hierarchy.
- `POST /api/v1/seller/categories` — Create category (`{ "name", "slug", "parentId", "description" }`).
- `GET /api/v1/seller/products` — Paginated products with filters (status, category, search, attributes, documents).
- `POST /api/v1/seller/products` — Create product with dynamic options, variants matrix, initial stock, and generic attributes (`{ "name", "value", "type", "sortOrder" }`).
- `GET /api/v1/seller/products/:id` — Full product detail including variants, inventory, media, attributes, and documents.
- `PUT /api/v1/seller/products/:id` — Update product details, mode, options, specifications, and attributes.
- `DELETE /api/v1/seller/products/:id` — Soft-delete / archive product.
- `POST /api/v1/seller/products/:id/documents` — Attach downloadable product document (Datasheet, Brochure, Manual, Drawing, Certificate).
- `DELETE /api/v1/seller/products/:id/documents/:docId` — Remove attached product document.
- `GET /api/v1/seller/variants/:id` — Get variant details and inventory breakdown.
- `PATCH /api/v1/seller/variants/:id` — Update variant price in paise, SKU, barcode, weight, and status.
- `POST /api/v1/seller/inventory/adjust` — Atomic manual stock adjustment with required reason.

### 3.3 Media Asset Management
- `GET /api/v1/seller/media` — List tenant media assets with pagination and MIME filtering.
- `POST /api/v1/seller/media/upload` — Upload multipart media file (scoped to tenant).
- `DELETE /api/v1/seller/media/:id` — Remove media asset metadata and delete physical file from storage.

### 3.4 Themes & Brand Studio
- `GET /api/v1/seller/themes` — List all 7 canonical themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`, `FEAST`) with capabilities and category fit.
- `GET /api/v1/seller/store/theme` — Active theme definition and configuration.
- `PUT /api/v1/seller/store/theme` — Update theme selection and design tokens (palette, typography, density).
- `PUT /api/v1/seller/store/sections` — Reorder, enable/disable, and configure homepage store sections.

### 3.5 Order Management & State Transitions
- `GET /api/v1/seller/orders` — List merchant orders with status and date filtering.
- `GET /api/v1/seller/orders/:id` — Full order detail, customer snapshot, items, delivery address, payments.
- `POST /api/v1/seller/orders/:id/confirm` — Transition order from `NEW` to `CONFIRMED`.
- `POST /api/v1/seller/orders/:id/cancel` — Cancel order, releasing inventory reservations.
- `POST /api/v1/seller/orders/:id/fulfill` — Create shipment parcel and request logistics dispatch.
- `POST /api/v1/seller/orders/:id/complete` — Mark order completed upon confirmed delivery.

---

## 4. Public Buyer Storefront APIs

All Public Storefront APIs are unauthenticated. No buyer login is required.
Stores with status `DRAFT` or without an active subscription return `STORE_PRIVATE` or `SUBSCRIPTION_REQUIRED` unless accessed with a valid `previewSecret` or authenticated seller preview session.

### 4.1 Storefront Catalog & Resolution
- **`GET /api/v1/storefront/:slug`**
  - Returns public store identity, branding tokens, active theme configuration, published sections, and categories.
  - Safe payload: strictly excludes internal tenant billing, API keys, or seller credentials.
- **`GET /api/v1/storefront/:slug/categories`**
  - Returns list of active public categories for navigation.
- **`GET /api/v1/storefront/:slug/products`**
  - Paginated active products for the store (`status: ACTIVE`). Supports `categoryId`, `search`, `page`, `limit`.
- **`GET /api/v1/storefront/:slug/products/:slug`**
  - Complete product detail page with options, available variants, prices in paise, media gallery, and live stock availability.
- **`GET /api/v1/storefront/:slug/search?q=...`**
  - Full-text catalog search scoped strictly to the specified store.

### 4.2 Guest Cart & Checkout
- **`POST /api/v1/storefront/:slug/cart`**
  - Initialize anonymous guest cart. Returns `guestToken`.
- **`GET /api/v1/storefront/:slug/cart/:token`**
  - Retrieve current cart items, server-calculated subtotal in paise, and item count.
- **`POST /api/v1/storefront/:slug/cart/:token/items`**
  - Add item: `{ "variantId": "...", "quantity": 1 }`. Validates stock availability.
- **`PATCH /api/v1/storefront/:slug/cart/:token/items/:itemId`**
  - Update item quantity: `{ "quantity": 3 }`.
- **`DELETE /api/v1/storefront/:slug/cart/:token/items/:itemId`**
  - Remove item from cart.
- **`POST /api/v1/storefront/:slug/checkout`**
  - Execute guest checkout in a single atomic database transaction:
  ```json
  {
    "cartToken": "gst_tok_918237abc",
    "customer": {
      "fullName": "Priya Sharma",
      "phone": "+919876543210",
      "email": "priya@example.com"
    },
    "deliveryAddress": {
      "addressLine1": "Flat 402, Lotus Towers",
      "addressLine2": "Indiranagar 100ft Road",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560038",
      "country": "India"
    },
    "paymentMethod": "MOCK"
  }
  ```
  - **Transaction guarantee:** Server re-verifies inventory, executes atomic stock reservation, calculates pricing in paise, creates Customer, Order, OrderAddress, OrderItems, PaymentOrder, and generates an unguessable `trackingToken`.
  - **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "orderNumber": "ORD-2026-881920",
      "trackingToken": "trk_991827fa1bc823",
      "totalPaise": 249900,
      "paymentStatus": "PENDING",
      "trackingUrl": "/store/aurelia-atelier/orders/ORD-2026-881920/track?t=trk_991827fa1bc823"
    },
    "timestamp": "2026-10-02T12:00:00.000Z"
  }
  ```

### 4.3 Secure Order Tracking
- **`GET /api/v1/storefront/:slug/orders/:orderNumber/track?t=<secure-token>`**
  - Public order tracking endpoint.
  - **Security Rule:** An order can NEVER be viewed using `orderNumber` alone. A valid, unguessable tracking token `t` matching `orders.tracking_token` is strictly mandatory. Prevents enumeration attacks across merchant orders.
  - Returns order status, fulfillment status, carrier AWB, delivery milestones, and masked customer phone.

---

## 5. Admin Domain APIs

Mounted strictly under `/api/v1/admin/*`. Restricted to authenticated users with `role: PLATFORM_ADMIN`.
- `GET /api/v1/admin/overview` — Platform KPI metrics (total GMV in paise, active stores, live merchants, system health).
- `GET /api/v1/admin/merchants` — List all tenants, stores, owner phone, subscription plan, and health status.
- `GET /api/v1/admin/merchants/:id` — Complete merchant detail, audit log history, and store configurations.
- `POST /api/v1/admin/merchants/:id/suspend` — Administratively suspend a merchant with required audit reason.
- `POST /api/v1/admin/merchants/:id/reactivate` — Reactivate suspended merchant.
- `GET /api/v1/admin/themes` — List and inspect platform theme definitions.
- `GET /api/v1/admin/subscriptions` — SaaS subscription billing health, past-due tracking, and invoices.
