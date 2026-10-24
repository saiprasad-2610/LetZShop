# LETZSHOP PRODUCTION ENVIRONMENT VARIABLES REFERENCE

**Document ID:** LETZSHOP-ENV-2026-10-24
**Classification:** Operational Guide (Zero actual secret values included)
**Applies To:** Hostinger VPS API container, Vercel Frontends, and Shared Workspace Packages

---

## 1. Backend API Environment Variables (`apps/api`)

| Variable Name | Required | Example Dev Value | Production Purpose | Sensitive / Secret? |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `development` | Enforces production security optimizations, strict CORS, and disables mock OTP. Set to `production`. | No |
| `PORT` | No | `4000` | Port on which the Fastify HTTP server listens. Defaults to `4000`. | No |
| `DATABASE_URL` | **Yes** | `postgresql://...` | Connection URI to PostgreSQL instance with credentials, port, DB name, and SSL mode. | **YES (Secret)** |
| `REDIS_HOST` | **Yes** | `localhost` | Hostname or IP address of Redis server. | No |
| `REDIS_PORT` | No | `6379` | Port for Redis server. | No |
| `REDIS_PASSWORD` | Optional | *(empty)* | Authentication password for Redis server if required. | **YES (Secret)** |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `http://localhost:3000,...` | Comma-separated HTTPS origins allowed to make API calls with credentials. Wildcards prohibited. | No |
| `STOREFRONT_BASE_URL` | **Yes** | `http://localhost:3000` | Canonical buyer customer storefront URL (`https://www.letzshop.store`). | No |
| `SELLER_DASHBOARD_URL` | **Yes** | `http://localhost:3001` | Canonical merchant dashboard URL (`https://seller.letzshop.store`). | No |
| `ADMIN_DASHBOARD_URL` | **Yes** | `http://localhost:3002` | Canonical Super Admin portal URL (`https://admin.letzshop.store`). | No |
| `JWT_ACCESS_SECRET` | **Yes** | `dev-jwt-access-...` | Cryptographic secret for signing short-lived JWT access tokens (Min 32 random characters). | **YES (Secret)** |
| `JWT_REFRESH_SECRET` | **Yes** | `dev-jwt-refresh-...`| Cryptographic secret for signing merchant and admin refresh tokens (Min 32 random characters). | **YES (Secret)** |
| `COOKIE_SECRET` | **Yes** | `dev-cookie-secret-...`| Cryptographic secret for Fastify signed session cookies (Min 32 random characters). | **YES (Secret)** |
| `OTP_DEV_MOCK_ENABLED` | **Yes** | `true` | Must be `false` in production. When `false`, real SMS/email OTP verification is enforced. | No |
| `OTP_EXPIRY_MINUTES` | No | `5` | Lifespan in minutes for one-time passwords. Defaults to 5 minutes. | No |
| `MEDIA_STORAGE_DRIVER` | **Yes** | `local` | Storage driver to use: `r2` (production Cloudflare R2) or `local` (development disk). | No |
| `R2_ACCOUNT_ID` | When `r2` | `your_account_id` | Cloudflare account identifier for R2 storage API. | No |
| `R2_ACCESS_KEY_ID` | When `r2` | `your_access_key` | Cloudflare R2 S3 API access key ID. | **YES (Secret)** |
| `R2_SECRET_ACCESS_KEY` | When `r2` | `your_secret_key` | Cloudflare R2 S3 API secret access key. | **YES (Secret)** |
| `R2_PUBLIC_BUCKET` | When `r2` | `letzshop-public-media` | Public bucket name storing product catalog images and store branding. | No |
| `R2_PRIVATE_BUCKET`| When `r2` | `letzshop-private-documents` | Private bucket storing confidential merchant KYC documents. No public URL. | No |
| `R2_PUBLIC_URL_PREFIX` | When `r2` | `https://media.letzshop.store` | Public CDN URL prefix mapped to the public R2 media bucket. | No |
| `R2_REGION` | No | `auto` | Cloudflare R2 region identifier. Defaults to `auto`. | No |
| `PAYMENT_PROVIDER` | **Yes** | `mock` | Payment gateway driver. Must be `razorpay` in production. `mock` is blocked in production. | No |
| `RAZORPAY_KEY_ID` | When `razorpay` | `rzp_live_...` | Razorpay Key ID for customer direct checkout payments. | No |
| `RAZORPAY_KEY_SECRET` | When `razorpay` | `your_key_secret` | Razorpay Key Secret for verifying payment signatures. | **YES (Secret)** |
| `RAZORPAY_WEBHOOK_SECRET` | When `razorpay` | `your_wh_secret` | Webhook secret for verifying customer payment webhook payloads. | **YES (Secret)** |
| `RAZORPAY_PLATFORM_KEY_ID` | When `razorpay` | `rzp_live_...` | Razorpay Key ID for SaaS merchant platform subscriptions and AutoPay. | No |
| `RAZORPAY_PLATFORM_KEY_SECRET` | When `razorpay` | `your_platform_secret` | Secret for platform subscriptions API. | **YES (Secret)** |
| `RAZORPAY_PLATFORM_WEBHOOK_SECRET` | When `razorpay` | `your_wh_secret` | Webhook secret for platform subscription renewals and mandate events. | **YES (Secret)** |
| `CHECKOUT_RATE_LIMIT`| No | `20` | Maximum guest checkout attempts per IP per minute. Defaults to 20. | No |
| `PAYMENT_RATE_LIMIT` | No | `30` | Maximum payment capture attempts per IP per minute. Defaults to 30. | No |
| `SMTP_HOST` | **Yes** | `smtp.example.com` | Hostname of production transactional SMTP mail relay server. | No |
| `SMTP_PORT` | **Yes** | `587` | Port for SMTP relay (typically 587 for TLS or 465 for SSL). | No |
| `SMTP_SECURE` | No | `false` | `true` for port 465 (SSL), `false` for port 587 (STARTTLS). | No |
| `SMTP_USER` | **Yes** | `apikey` | Authentication username for SMTP service. | No |
| `SMTP_PASSWORD` | **Yes** | `your_smtp_pass` | Authentication password / API key for SMTP service. | **YES (Secret)** |
| `SMTP_FROM` | **Yes** | `"LetzShop <no-reply@letzshop.store>"` | RFC-compliant sender email header. | No |
| `SHIPROCKET_EMAIL` | Optional | `shiprocket@example.com` | Email login for automated Shiprocket logistics sync. | No |
| `SHIPROCKET_PASSWORD` | Optional | `your_password` | Password for Shiprocket logistics sync. | **YES (Secret)** |

---

## 2. Frontend Environment Variables (`apps/storefront`, `apps/seller`, `apps/admin`)

These variables are consumed by Next.js applications during SSR and bundled into client browser code:

### 2.1 Customer Storefront (`apps/storefront` on Vercel)
| Variable Name | Required | Production Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.letzshop.store` | Production NestJS backend endpoint called by browser. |
| `NEXT_PUBLIC_STOREFRONT_URL` | **Yes** | `https://www.letzshop.store` | Canonical customer storefront origin. |
| `NEXT_PUBLIC_SELLER_URL` | **Yes** | `https://seller.letzshop.store` | Canonical seller dashboard link in header/footer. |
| `NEXT_PUBLIC_MEDIA_URL` | No | `https://media.letzshop.store` | Public CDN URL for catalog images. |

### 2.2 Merchant Dashboard (`apps/seller` on Vercel)
| Variable Name | Required | Production Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.letzshop.store` | Backend API origin for merchant authentication and management. |
| `NEXT_PUBLIC_STOREFRONT_URL` | **Yes** | `https://www.letzshop.store` | Storefront origin used for live preview and customer links. |
| `NEXT_PUBLIC_SELLER_URL` | **Yes** | `https://seller.letzshop.store` | Canonical merchant portal origin. |
| `NEXT_PUBLIC_MEDIA_URL` | No | `https://media.letzshop.store` | Public media CDN for store previews. |

### 2.3 Super Admin Portal (`apps/admin` on Vercel)
| Variable Name | Required | Production Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `https://api.letzshop.store` | Backend API origin for platform admin calls. |
| `NEXT_PUBLIC_ADMIN_URL` | **Yes** | `https://admin.letzshop.store` | Canonical platform administration portal origin. |
| `ADMIN_API_URL` | **Yes** | `https://api.letzshop.store` | Server-side rewrite target for Next.js internal API proxying. |
