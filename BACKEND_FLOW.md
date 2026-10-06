# SIMPLY E-COMMERCE — BACKEND FLOW & ARCHITECTURE SPECIFICATION

**Version:** 1.0.0 (Production Canonical Reset)  
**Scope:** Backend Execution Paths, State Machines, & Concurrency Invariants

---

## 1. Seller Authentication & Session Lifecycle

The Simply E-Commerce seller authentication model provides strong security, minimal login friction, and future-proof credential extensibility (passkeys/biometrics).

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant API as AuthController / AuthService
    participant OTP as OtpChallenge / SMS Provider
    participant DB as Prisma (Users, Credentials, Sessions)
    
    Note over Seller,DB: 1. FIRST REGISTRATION WORKFLOW
    Seller->>API: POST /api/v1/auth/register/request-otp (phone)
    API->>OTP: Create challenge (hash code, 5m expiry)
    API-->>Seller: 200 OK (challengeId)
    
    Seller->>API: POST /api/v1/auth/register/verify-otp (phone, code)
    API->>OTP: Validate code against hash & expiry
    API-->>Seller: 200 OK (verificationToken)
    
    Seller->>API: POST /api/v1/auth/pin/setup (token, phone, pin, fullName)
    API->>DB: Hash PIN (Argon2id/bcrypt) -> seller_credentials
    API->>DB: Create User -> Tenant -> Store -> TenantMembership
    API->>DB: Issue Session & Rotating Refresh Token
    API-->>Seller: 201 Created (User, Tenant, Store, Tokens)
    
    Note over Seller,DB: 2. SUBSEQUENT LOGIN WORKFLOW (NO OTP REQUIRED)
    Seller->>API: POST /api/v1/auth/pin/login (phone, pin, deviceFingerprint)
    API->>DB: Lookup User & SellerCredential
    API->>API: Verify PIN hash (enforce lockout on 5 consecutive failures)
    API->>DB: Create Session & issue rotating tokens
    API-->>Seller: 200 OK (User, Tenant, Store, Access & Refresh Tokens)
    
    Note over Seller,DB: 3. SESSION REFRESH
    Seller->>API: POST /api/v1/auth/session/refresh (refreshToken)
    API->>DB: Verify token hash & active session
    API->>DB: Invalidate old refresh token, generate new pair
    API-->>Seller: 200 OK (New Access & Refresh Tokens)
```

### 1.1 Invariants
- **No OTP Spam:** OTP is exclusively used for initial mobile verification and account recovery. Regular daily logins require only the seller's secure numeric PIN.
- **Fail-Closed in Production:** If `NODE_ENV === 'production'`, the hardcoded mock OTP (`123456`) is deactivated, and missing SMS provider credentials halt the challenge.
- **Hashed Secrets Only:** Neither plain PINs, refresh tokens, nor session secrets are stored in plaintext in the database.

---

## 2. Public Buyer Flow & Guest Checkout

There is no buyer login in V1. Storefronts are purely unauthenticated customer experiences.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant SF as Storefront /api/v1/storefront/:slug
    participant Cart as Cart Service
    participant Checkout as Checkout Transaction
    participant Inv as Inventory Engine
    participant DB as Postgres Master

    Buyer->>SF: GET /storefront/:slug
    SF->>DB: Validate Store status & Tenant subscription
    SF-->>Buyer: 200 OK (Store branding, active theme, published sections)
    
    Buyer->>Cart: POST /storefront/:slug/cart
    Cart-->>Buyer: 201 Created (guestToken)
    
    Buyer->>Cart: POST /storefront/:slug/cart/:token/items (variantId, qty)
    Cart->>Inv: Check available stock (stock_on_hand - stock_reserved >= qty)
    Cart-->>Buyer: 200 OK (Cart updated, subtotal in paise)
    
    Buyer->>Checkout: POST /storefront/:slug/checkout (cartToken, customer, deliveryAddress, paymentMethod)
    
    rect rgb(240, 248, 255)
        Note over Checkout,DB: SINGLE ATOMIC TRANSACTION
        Checkout->>DB: Lock inventory rows: SELECT ... FOR UPDATE
        Checkout->>Inv: Reserve stock: stock_reserved += qty
        Checkout->>DB: Record InventoryMovement (ORDER_RESERVATION)
        Checkout->>DB: Upsert Customer (store_id, phone)
        Checkout->>DB: Create Order (status: NEW, payment: PENDING, fulfillment: UNFULFILLED)
        Checkout->>DB: Create OrderAddress snapshot
        Checkout->>DB: Create OrderItems snapshot
        Checkout->>DB: Create PaymentOrder (purpose: MERCHANT_ORDER)
        Checkout->>DB: Generate secure tracking_token
    end
    
    Checkout-->>Buyer: 201 Created (orderNumber, trackingToken, totalPaise, trackingUrl)
```

### 2.1 Server-Owned Pricing Guarantee
1. When adding items to cart, unit price is pulled directly from `product_variants.price_paise`.
2. At checkout, line items are recalculated against current active database prices.
3. Shipping fees are computed via the active `ShippingProfile` (e.g. flat rate unless subtotal exceeds free shipping threshold in paise).
4. Taxes are computed as specified by product category or store tax rates.
5. The buyer cannot alter `total_paise` through client tampering.

---

## 3. Concurrency & Inventory Reservation Safety

Preventing overselling and race conditions is fundamental to Simply E-Commerce.

```mermaid
graph TD
    Request[Buyer Checkout Request] --> TxStart[Begin DB Transaction]
    TxStart --> LockRow[SELECT stock_on_hand, stock_reserved, allow_backorder FROM inventory WHERE variant_id = $1 FOR UPDATE]
    LockRow --> CheckAvailability{Available >= Qty OR allow_backorder?}
    CheckAvailability -- No --> Rollback[Abort Transaction & Throw OUT_OF_STOCK]
    CheckAvailability -- Yes --> ReserveStock[UPDATE inventory SET stock_reserved = stock_reserved + Qty]
    ReserveStock --> LogMovement[INSERT INTO inventory_movements quantity_delta: -Qty, type: ORDER_RESERVATION]
    LogMovement --> CreateOrder[Create Order & Payment Intent]
    CreateOrder --> TxCommit[Commit DB Transaction]
    
    TxCommit --> PaymentCheck{Payment Outcome?}
    PaymentCheck -- Success --> SettleStock[UPDATE inventory: stock_on_hand -= Qty, stock_reserved -= Qty; movement: ORDER_FULFILLMENT]
    PaymentCheck -- Failure/Expired --> ReleaseStock[UPDATE inventory: stock_reserved -= Qty; movement: ORDER_CANCELLATION]
```

---

## 4. Payment Boundaries: Platform vs Merchant

The platform maintains strict credential and purpose boundaries:

```mermaid
flowchart LR
    subgraph Platform Billing
        A[Platform SaaS Subscription] --> B[Aikyam Platform Razorpay Credentials]
        B --> C[Subscription Invoices & Payments]
    end
    
    subgraph Merchant Retail
        D[Buyer Retail Order] --> E[Merchant Payment Account]
        E --> F[Merchant Gateway / Mock Provider]
        F --> G[Merchant Settlement]
    end
```

- **Invariant:** Platform Razorpay credentials (`RAZORPAY_PLATFORM_KEY_ID`) are NEVER used to process merchant retail orders.
- **Merchant Gateway:** Each merchant configures their own payment account (`merchant_payment_accounts`) or uses the standard Mock provider during development.

---

## 5. Shipping Logistics Abstraction

Shipment creation is isolated behind the `ShippingProvider` interface:

```typescript
export interface ShippingProvider {
  createShipment(order: Order, profile: ShippingProfile): Promise<ShipmentResult>;
  cancelShipment(awbNumber: string): Promise<boolean>;
  getTracking(awbNumber: string): Promise<TrackingMilestone[]>;
}
```

- **Shiprocket Integration:** Designed as an adapter adhering to this interface. The core `OrderService` interacts purely with `ShippingProvider` and never contains direct carrier API calls.
- **Logistics State Machine:**
  `UNFULFILLED` -> `PROCESSING` -> `READY_TO_SHIP` -> `SHIPPED` -> `DELIVERED` (or `RETURN_REQUESTED` -> `RETURNED`).

---

## 6. SaaS Subscription Gating Flow

Storefront public visibility and checkout acceptance are strictly gated by the merchant's SaaS subscription status. The backend guarantees that **sellers never lose dashboard, catalog, or configuration access** even when their subscription is inactive or expired.

### 6.1 Permitted vs. Blocked Matrix

| Capability / Action | No Subscription / Inactive / Expired | Active Paid / Trialing Subscription |
| :--- | :---: | :---: |
| **Seller Login (PIN / Session)** | ✅ Allowed | ✅ Allowed |
| **Seller Dashboard & Metrics** | ✅ Allowed | ✅ Allowed |
| **Manage Catalog (Products, Categories, Options)** | ✅ Allowed | ✅ Allowed |
| **Manage Media Assets & Uploads** | ✅ Allowed | ✅ Allowed |
| **Configure Theme Tokens & Sections** | ✅ Allowed | ✅ Allowed |
| **Private Storefront Preview (`isPreview: true`)** | ✅ Allowed (with auth or secret) | ✅ Allowed |
| **Publish Storefront to Live (`POST /seller/store/publish`)** | ❌ Blocked (`SUBSCRIPTION_REQUIRED`) | ✅ Allowed (`status: LIVE`) |
| **Public Storefront Browsing (`GET /storefront/:slug`)** | ❌ Blocked (`SUBSCRIPTION_REQUIRED`) | ✅ Allowed |
| **Public Buyer Checkout (`POST /storefront/:slug/checkout`)** | ❌ Blocked (`SUBSCRIPTION_REQUIRED`) | ✅ Allowed |

```mermaid
flowchart TD
    Req[GET /api/v1/storefront/:slug] --> FindStore[Lookup Store by slug]
    FindStore --> Found{Store exists?}
    Found -- No --> Err404[Throw STORE_NOT_FOUND]
    Found -- Yes --> CheckSub[Check Tenant active subscription]
    
    CheckSub --> HasActiveSub{Subscription ACTIVE or TRIALING?}
    HasActiveSub -- No --> CheckAuth{Is Authenticated Merchant Preview?}
    CheckAuth -- Yes --> AllowPreview[Serve Private Storefront Preview with isPreview: true]
    CheckAuth -- No --> ErrSub[Throw SUBSCRIPTION_REQUIRED HTTP 402]
    
    HasActiveSub -- Yes --> CheckStoreStatus{Store status == LIVE?}
    CheckStoreStatus -- No --> CheckAuth2{Is Authenticated Merchant Preview?}
    CheckAuth2 -- Yes --> AllowPreview
    CheckAuth2 -- No --> ErrPrivate[Throw STORE_PRIVATE HTTP 403]
    
    CheckStoreStatus -- Yes --> ServePublic[Serve Public Storefront]
```

### 6.2 Expiry, Cancellation, and Renewal Invariants
- **Data Preservation:** An expired subscription never truncates or alters merchant inventory, images, configurations, or order histories.
- **Immediate Public Shielding:** Upon subscription expiry (`now > currentPeriodEnd`), public buyers are instantly shielded from store browsing and order placement (`SUBSCRIPTION_REQUIRED`), but the merchant can immediately access their private preview and renew subscription.
