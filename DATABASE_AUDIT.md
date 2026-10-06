# SIMPLY E-COMMERCE — DATABASE AUDIT

**Date:** October 2026  
**Document Version:** 1.0.0  
**Phase:** Core Architecture Reset — Database & Backend Only

---

## 1. Executive Summary & Audit Mandate

Simply E-Commerce is transitioning from an exploratory multi-tenant prototype into a production-grade multi-tenant ecommerce SaaS.
This audit systematically evaluates every model in the existing Prisma schema (`schema.prisma`), classifying each table into one of five strict categories:

- **KEEP**: Structural model is sound, correctly scoped, and directly serves the canonical domain.
- **MODIFY**: Model retains core identity but requires column alterations, type normalization (e.g. status enums, integer paise), or relation adjustments.
- **MERGE**: Model serves a related purpose and is combined into a more cohesive, canonical entity.
- **DEPRECATE**: Legacy or transition model marked for phase-out; preserved only if required for migration safety.
- **REMOVE**: Redundant, demo-only, or anti-pattern model not fitting the multi-tenant SaaS hierarchy.

### Canonical Domain Hierarchy
```
Platform
  └── User
       └── TenantMembership
            └── Tenant
                 ├── Store (Branding, ThemeConfig, Sections, Categories, Products, Variants, Media, Inventory, Customers, Carts, Orders, Shipments, Enquiries)
                 ├── Subscription & Invoices
                 ├── MerchantPaymentAccount
                 ├── ShippingAccount
                 └── AuditLogs
```

---

## 2. Model-by-Model Classification Table

| # | Current Model | Table Name | Classification | Primary Action / Reason |
|---|---|---|---|---|
| 1 | `User` | `users` | **MODIFY** | Retain user core identity; add relations to `SellerCredential`, `Session`, `Device`, `OtpChallenge`. |
| 2 | `OtpRequest` | `otp_requests` | **MERGE / MODIFY** | Merge into canonical `OtpChallenge` (`otp_challenges`) with `purpose` (REGISTRATION, LOGIN, RECOVERY). |
| 3 | `Session` | `sessions` | **MODIFY** | Retain session management; add device association, hashed token handling, and tracking. |
| 4 | `RefreshToken` | `refresh_tokens` | **MODIFY** | Retain hashed token security, linked to session and device context. |
| 5 | *(New)* `Device` | `devices` | **NEW** | Device fingerprinting, trusted device registry, and biometric readiness. |
| 6 | *(New)* `SellerCredential` | `seller_credentials` | **NEW** | Stores hashed PIN (`pinHash`), credential type, lockout counters; supports future passkeys/biometrics. |
| 7 | `Tenant` | `tenants` | **MODIFY** | Top-level tenant container; owns subscriptions, accounts, audit logs. |
| 8 | `TenantMembership` | `tenant_memberships` | **KEEP** | Maps User to Tenant with role (`SELLER_OWNER`, `SELLER_STAFF`). |
| 9 | `Store` | `stores` | **MODIFY** | Normalize status to `[DRAFT, PRIVATE_PREVIEW, LIVE, SUSPENDED]`. Scoped to Tenant. |
| 10 | `StoreBranding` | `store_branding` | **MODIFY** | Associate with `MediaAsset` for logo/favicon/banner; retain color & font tokens. |
| 11 | `Theme` | `themes` | **MERGE / MODIFY** | Rename to canonical `ThemeDefinition` (`theme_definitions`) with key (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`), version, categoryFit, defaultConfig JSON, capabilities JSON, status. |
| 12 | `StoreThemeConfig` | `store_theme_configs` | **MERGE / MODIFY** | Rename to canonical `StoreThemeConfiguration` (`store_theme_configurations`) with storeId, themeDefinitionId, themeVersion, configuration JSON, publishedConfiguration JSON. |
| 13 | `StoreSection` | `store_sections` | **MODIFY** | Normalize fields to store_id, type (HERO, CATEGORIES, FEATURED_COLLECTION, NEW_ARRIVALS, BESTSELLERS, STORY, TESTIMONIALS, PHYSICAL_STORE, CUSTOM_BANNER, CONTACT), position, enabled, configuration JSON. |
| 14 | *(New)* `MediaAsset` | `media_assets` | **NEW** | Canonical tenant-scoped media storage metadata behind StorageProvider abstraction. |
| 15 | `ProductMedia` | `product_media` | **MODIFY** | Link Product/Variant to `MediaAsset` or store direct asset metadata; preserve variant-specific media. |
| 16 | `Category` | `categories` | **MODIFY** | Retain hierarchy, storeId, slug; link optional image to `MediaAsset`. |
| 17 | `Product` | `products` | **MODIFY** | Normalize status to `[DRAFT, ACTIVE, ARCHIVED]`; product mode `[SELL_ONLINE, ENQUIRY_ONLY, SELL_AND_ENQUIRY]`. Store-owned. |
| 18 | `ProductOption` | `product_options` | **MODIFY** | Decouple from rigid hardcoded enum to support arbitrary dynamic options (Color, Size, Material, Storage, Pack Size, etc.). |
| 19 | `ProductOptionValue` | `product_option_values` | **KEEP** | Option values associated with `ProductOption`. |
| 20 | `ProductVariant` | `product_variants` | **MODIFY** | Add weight (grams/kg) and dimensions (length, width, height cm); integer paise pricing; link to inventory and media. |
| 21 | `ProductVariantOptionValue` | `product_variant_option_values` | **KEEP** | Join table linking variant to option values. |
| 22 | `Inventory` | `inventory` | **KEEP** | Concurrency-safe atomic reservations (`stock_on_hand`, `stock_reserved`, `safety_stock_threshold`, `allow_backorder`). |
| 23 | `InventoryMovement` | `inventory_movements` | **KEEP** | Complete audit trail for all stock reservations, adjustments, and fulfillments. |
| 24 | `Customer` | `customers` | **KEEP** | Store-scoped customer records; guest-first design with phone/email/fullName. |
| 25 | `CustomerAddress` | `customer_addresses` | **KEEP** | Saved addresses for customer. |
| 26 | `Cart` | `carts` | **KEEP** | Guest-first shopping cart identified by guest token or customer ID; store-scoped. |
| 27 | `CartItem` | `cart_items` | **KEEP** | Items in cart with variantId, quantity, unitPricePaise. |
| 28 | `Order` | `orders` | **MODIFY** | Normalize statuses: `status` [NEW, CONFIRMED, CANCELLED, COMPLETED], `paymentStatus` [PENDING, AUTHORIZED, PAID, FAILED, PARTIALLY_REFUNDED, REFUNDED], `fulfillmentStatus` [UNFULFILLED, PROCESSING, READY_TO_SHIP, SHIPPED, DELIVERED, RETURN_REQUESTED, RETURNED, CANCELLED]. Server-computed integer paise totals. Secure tracking token. |
| 29 | `OrderItem` | `order_items` | **KEEP** | Snapshot of ordered variant, product title, SKU, options, and paise pricing. |
| 30 | *(New)* `OrderAddress` | `order_addresses` | **NEW** | Normalized immutable address snapshot associated with `Order`. |
| 31 | `OrderStatusHistory` | `order_status_history` | **KEEP** | State transition history with actor and reason. |
| 32 | `MerchantPaymentAccount` | `merchant_payment_accounts` | **MODIFY** | Scoped to Tenant & Store; encrypted credentials for merchant-owned gateways. Abstract provider. |
| 33 | `PaymentOrder` | `payment_orders` | **MODIFY** | Explicit `purpose` boundary (`PLATFORM_SUBSCRIPTION` vs `MERCHANT_ORDER`). Idempotency key. |
| 34 | `PaymentTransaction` | `payment_transactions` | **KEEP** | Gateway transaction details, provider payment IDs, paise amounts. |
| 35 | `Refund` | `refunds` | **KEEP** | Refund records with paise amounts and provider refund IDs. |
| 36 | `PaymentWebhookEvent` | `payment_webhook_events` | **KEEP** | Webhook deduplication with unique eventId, payload hash, and processing status. |
| 37 | `MerchantShippingAccount` | `merchant_shipping_accounts` | **MODIFY** | Scoped to Tenant/Store; shipping provider credentials. Shiprocket is an adapter. |
| 38 | `ShippingProfile` | `shipping_profiles` | **KEEP** | Shipping rate calculation rules with flat rate and threshold in paise. |
| 39 | `Shipment` | `shipments` | **MODIFY** | Fulfillment tracking, provider adapter linkage, AWB number, status, dimensions. |
| 40 | `ShipmentEvent` | `shipment_events` | **KEEP** | Tracking milestones and status updates from carriers. |
| 41 | `Enquiry` | `enquiries` | **KEEP** | B2B quotation inquiries with status and quotationAmountPaise. |
| 42 | `Plan` | `plans` | **KEEP** | SaaS subscription tier definitions (pricing in paise). |
| 43 | `Subscription` | `subscriptions` | **MODIFY** | Tenant-level SaaS subscription gating public storefront publishing. |
| 44 | `SubscriptionEvent` | `subscription_events` | **KEEP** | Lifecycle audit of subscription changes. |
| 45 | `SubscriptionInvoice` | `subscription_invoices` | **KEEP** | SaaS billing invoices with paise amounts and invoice numbers. |
| 46 | `SubscriptionPayment` | `subscription_payments` | **KEEP** | Payments against subscription invoices (via Aikyam Razorpay). |
| 47 | `AuditLog` | `audit_logs` | **KEEP** | Tenant-level tamper-evident audit logging for sensitive actions. |
| 48 | `IdempotencyKey` | `idempotency_keys` | **KEEP** | Prevents duplicate mutation execution on payments and checkout. |
| 49 | `OutboxEvent` | `outbox_events` | **KEEP** | Reliable event publishing pattern for async notifications and syncing. |
| 50 | `ConsentRecord` | `consent_records` | **KEEP** | India DPDPA 2023 compliance consent logs. |
| 51 | `DataSubjectRequest` | `data_subject_requests` | **KEEP** | India DPDPA 2023 data export and right-to-be-forgotten requests. |

---

## 3. Deep-Dive on Required Architectural Changes

### 3.1 Authentication & Seller Credential Architecture
- **Problem:** Previous implementation used a simple OTP-for-every-login flow with plain `OtpRequest` table, without supporting device trust, session persistence, or hashed PIN access.
- **Solution:**
  1. `OtpChallenge`: Dedicated table tracking registration, login, and recovery challenges with attempt limiting, expiration, and secure hash. In development (`NODE_ENV !== 'production'`), code `123456` is permitted; in production, fails closed.
  2. `SellerCredential`: Separated credential model storing hashed 4-6 digit PIN (`pinHash` via Argon2/bcrypt), lockout timestamps, and extensible schema for future WebAuthn/passkey credentials without altering the User table.
  3. `Session` & `Device`: Multi-device tracking with hashed session/refresh tokens. Active valid sessions allow direct dashboard entry without repeated OTP requests.

### 3.2 Canonical Hierarchy & Ownership Separation
- **Store-owned entities:** Products, Options, Variants, Categories, Media, Inventory, Carts, Orders, Addresses, Enquiries, Branding, Sections, Theme Configurations.
- **Tenant-owned entities:** SaaS Subscriptions, Invoices, Merchant Payment Accounts, Merchant Shipping Accounts, Audit Logs.
- **Enforcement:** Every seller API endpoint must resolve tenant and store context from authenticated `TenantMembership` rather than allowing arbitrary query or body overrides.

### 3.3 Status System Normalization
The database schema must enforce domain-specific, mutually orthogonal status enums:

1. **Order Lifecycle (`OrderStatus`)**:
   - `NEW` (Received, awaiting seller confirmation)
   - `CONFIRMED` (Accepted by seller, stock confirmed)
   - `CANCELLED` (Voided by buyer/seller/system)
   - `COMPLETED` (Delivered and settled)

2. **Payment State (`PaymentStatus`)**:
   - `PENDING`
   - `AUTHORIZED`
   - `PAID`
   - `FAILED`
   - `PARTIALLY_REFUNDED`
   - `REFUNDED`

3. **Fulfillment State (`FulfillmentStatus` / `ShipmentStatus`)**:
   - `UNFULFILLED`
   - `PROCESSING`
   - `READY_TO_SHIP`
   - `SHIPPED`
   - `DELIVERED`
   - `RETURN_REQUESTED`
   - `RETURNED`
   - `CANCELLED`

4. **Store Publishing State (`StoreStatus`)**:
   - `DRAFT`
   - `PRIVATE_PREVIEW`
   - `LIVE`
   - `SUSPENDED`

5. **Product Catalog State (`ProductStatus`)**:
   - `DRAFT`
   - `ACTIVE`
   - `ARCHIVED`

6. **Product Commercial Mode (`ProductMode`)**:
   - `SELL_ONLINE`
   - `ENQUIRY_ONLY`
   - `SELL_AND_ENQUIRY`

### 3.4 Monetary Precision: Integer Paise
All monetary values across the entire schema are stored strictly as 64-bit/32-bit signed integers in minor units (Indian Paise, where ₹1.00 = 100 paise):
- `price_paise`, `compare_at_price_paise`, `cost_price_paise`
- `subtotal_paise`, `tax_paise`, `shipping_paise`, `discount_paise`, `total_paise`
- `amount_paise`, `fee_paise`
- `flat_rate_paise`, `free_shipping_threshold_paise`
- `quotation_amount_paise`
No floating point numbers may represent monetary quantities in the database. Explicit currency code `currency VARCHAR(3)` defaults to `"INR"`.

### 3.5 Themes & Store Sections
- `ThemeDefinition`: Seeded platform-level themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`) containing versioning, capabilities, default configs, and category fit.
- `StoreThemeConfiguration`: Per-store customization storing draft `configuration` and live `publishedConfiguration` JSON objects. Prevents raw arbitrary CSS injections while offering rich visual customization.
- `StoreSection`: Normalized records with `store_id`, `type`, `position`, `enabled`, and `configuration` JSON.

### 3.6 Media Asset Centralization
- Replaces unmanaged external URLs with tenant-scoped `MediaAsset` records.
- Physical binary files are managed strictly through the `StorageProvider` interface (`LocalStorageProvider`, S3, etc.).
- Relational database stores only metadata: `tenant_id`, `storage_key`, `public_url`, `file_name`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`.

---

## 4. Index Audit & Query Performance Verification

| Table | Index Columns | Purpose & Query Pattern |
|---|---|---|
| `users` | `phone` (UNIQUE) | Single-lookup authentication by mobile number |
| `users` | `email` (UNIQUE, nullable) | Optional email lookup |
| `otp_challenges` | `(phone, purpose, is_verified, expires_at)` | Fast OTP challenge retrieval and expiry verification |
| `seller_credentials` | `(user_id, credential_type)` (UNIQUE) | Fast PIN / passkey verification per seller |
| `sessions` | `token_hash` (UNIQUE) | High-speed constant-time session lookup |
| `sessions` | `(user_id, is_revoked, expires_at)` | Active sessions retrieval and multi-device revocation |
| `stores` | `slug` (UNIQUE) | Buyer storefront resolution |
| `stores` | `(tenant_id, status)` | Merchant store listing and status queries |
| `categories` | `(store_id, slug)` (UNIQUE) | Store category navigation |
| `categories` | `(tenant_id, store_id, is_active)` | Category listing with active filtering |
| `products` | `(store_id, slug)` (UNIQUE) | Buyer product detail page lookup |
| `products` | `(tenant_id, store_id, status)` | Catalog filtering and inventory management |
| `products` | `name` | Catalog text search indexing |
| `product_variants` | `(store_id, sku)` (UNIQUE) | Fast SKU lookup and barcode scanning |
| `product_variants` | `product_id` | Variant resolution for product pages |
| `inventory` | `variant_id` (UNIQUE) | High-concurrency atomic stock reservations |
| `inventory_movements` | `(variant_id, created_at)` | Audit trail and stock ledger reconciliation |
| `customers` | `(store_id, phone)` | Guest checkout returning customer association |
| `carts` | `guest_token` (UNIQUE) | Buyer guest session shopping cart |
| `orders` | `order_number` (UNIQUE) | Merchant and buyer order identification |
| `orders` | `tracking_token` (UNIQUE) | Secure unauthenticated tracking link access |
| `orders` | `(store_id, created_at)` | Order dashboard list sorted by date |
| `orders` | `(store_id, status)` | Order fulfillment filtering (e.g. NEW, CONFIRMED) |
| `payment_orders` | `provider_order_id` | Gateway webhook resolution |
| `payment_orders` | `idempotency_key` (UNIQUE) | Payment creation deduplication |
| `payment_webhook_events` | `event_id` (UNIQUE) | Webhook deduplication to prevent double-processing |
| `subscriptions` | `(tenant_id, status)` | SaaS publishing gate evaluation |

---

## 5. Migration Strategy & Zero Data Loss Guarantee

1. **Rule 1:** Migration `0_init` must never be rewritten or modified.
2. **Rule 2:** A new incremental migration (`20261002_core_architecture_reset`) will be generated using Prisma Migrate.
3. **Rule 3:** Existing data structures (Tenant, Store, User, Product, Inventory, Orders) are altered additively, preserving existing foreign keys and relational integrity.
4. **Rule 4:** `prisma db push --accept-data-loss` is strictly forbidden.
