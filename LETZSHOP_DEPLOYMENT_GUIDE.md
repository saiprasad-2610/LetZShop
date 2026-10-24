# LETZSHOP PRODUCTION DEPLOYMENT PLAYBOOK

**Document ID:** LETZSHOP-DEP-2026-10-24
**Target Architecture:**
- **Backend API:** Hostinger VPS (Ubuntu 24.04 LTS / Docker Compose / NestJS)
- **Database:** PostgreSQL (with SSL connection pooling)
- **Cache:** Redis
- **Reverse Proxy & HTTPS:** Caddy / Nginx with TLS 1.3
- **Object Storage:** Cloudflare R2 (Dual Buckets: Public Media & Private KYC Documents)
- **Frontends:** 3x Next.js 14 Applications deployed on Vercel:
  - Customer Storefront: `https://www.letzshop.store` & `https://letzshop.store`
  - Merchant Dashboard: `https://seller.letzshop.store`
  - Super Admin Dashboard: `https://admin.letzshop.store`
  - Backend API: `https://api.letzshop.store`

---

## 1. Architecture & DNS Topology

```
                                  [ Cloudflare DNS / WAF ]
                                             |
            +--------------------------------+-------------------------------+
            |                                |                               |
            v                                v                               v
    [ Customer Storefront ]         [ Seller Dashboard ]           [ Super Admin Portal ]
    www.letzshop.store              seller.letzshop.store          admin.letzshop.store
    (Vercel Next.js)                (Vercel Next.js)               (Vercel Next.js)
            |                                |                               |
            +--------------------------------+-------------------------------+
                                             |
                                             v (HTTPS API Calls)
                                 [ api.letzshop.store ]
                                             |
                                             v
                               [ Hostinger VPS (Ubuntu) ]
                                             |
                             [ Caddy / Nginx Reverse Proxy ]
                                             |
                                             v
                                 [ Docker Container: api ]
                                    (NestJS / Port 4000)
                                             |
                      +----------------------+----------------------+
                      |                      |                      |
                      v                      v                      v
            [ PostgreSQL 16 ]         [ Redis Cache ]        [ Cloudflare R2 ]
            - Multi-Tenant RLS        - Throttling & Session - Public Media Bucket
            - Advisory Locks                                 - Private KYC Bucket
```

---

## 2. Cloudflare R2 Configuration (One-Time Setup)

1. Log into your Cloudflare Dashboard > **R2**.
2. **Create Public Bucket:**
   - Bucket Name: `letzshop-public-media`
   - Custom Domain: Attach `media.letzshop.store` (or use R2 dev domain)
   - CORS Policy: Allow `GET`, `HEAD` from `https://www.letzshop.store`, `https://seller.letzshop.store`, `https://admin.letzshop.store`.
3. **Create Private Bucket:**
   - Bucket Name: `letzshop-private-documents`
   - Do **NOT** attach a public custom domain. Strictly private.
4. **Create API Token:**
   - Permissions: Object Read & Write.
   - Note the **Access Key ID**, **Secret Access Key**, and **Account ID**.

---

## 3. GitHub Repository Release Workflow

1. **Create Release Branch:**
   ```bash
   git checkout -b release/production-v2.0
   ```
2. **Commit Merged Codebase:**
   Extract or copy the contents of `LetzShop-Final-Production/` into your repository.
   ```bash
   git add -A
   git commit -m "chore: release LetzShop v2.0 unified production build"
   ```
3. **Push to Remote & Open Pull Request:**
   ```bash
   git push origin release/production-v2.0
   ```
   *Do NOT push directly to `main`. Review and merge via Pull Request.*

---

## 4. Hostinger VPS Backend Deployment

### Step 1: Connect to VPS
```bash
ssh user@your-hostinger-vps-ip
```

### Step 2: Clone or Pull Latest Code
```bash
cd /opt/letzshop
git fetch origin
git checkout main
git pull origin main
```

### Step 3: Configure Environment File (`.env.production`)
Create or edit `/opt/letzshop/.env.production` with your real secrets:
```ini
NODE_ENV=production
PORT=4000

# Base URLs
STOREFRONT_BASE_URL=https://www.letzshop.store
SELLER_DASHBOARD_URL=https://seller.letzshop.store
ADMIN_DASHBOARD_URL=https://admin.letzshop.store

# Production CORS Whitelist
CORS_ALLOWED_ORIGINS=https://letzshop.store,https://www.letzshop.store,https://seller.letzshop.store,https://admin.letzshop.store

# Database (PostgreSQL)
DATABASE_URL=postgresql://letzshop_user:STRONG_PASSWORD@localhost:5432/letzshop_prod?schema=public&sslmode=prefer

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Secrets (Min 32 random characters)
JWT_ACCESS_SECRET=your-32-char-jwt-access-secret-here
JWT_REFRESH_SECRET=your-32-char-jwt-refresh-secret-here
COOKIE_SECRET=your-32-char-cookie-secret-here
OTP_DEV_MOCK_ENABLED=false

# Object Storage (Cloudflare R2)
MEDIA_STORAGE_DRIVER=r2
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_PUBLIC_BUCKET=letzshop-public-media
R2_PRIVATE_BUCKET=letzshop-private-documents
R2_PUBLIC_URL_PREFIX=https://media.letzshop.store
R2_REGION=auto

# Razorpay Platform & Merchant Gateways
PAYMENT_PROVIDER=razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLATFORM_KEY_ID=rzp_live_...
RAZORPAY_PLATFORM_KEY_SECRET=...
RAZORPAY_PLATFORM_WEBHOOK_SECRET=...

# SMTP Transactional Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=...
SMTP_FROM="LetzShop <no-reply@letzshop.store>"
```

### Step 4: Run Forward Database Migrations
```bash
# Execute migrations before restarting the container
pnpm --filter @simply/db migrate
```

### Step 5: Build and Start Production Docker Containers
```bash
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

### Step 6: Verify API Container Health
```bash
curl -I http://localhost:4000/health
# Response should be HTTP 200 OK {"status":"ok", ...}
```

### Step 7: Provision Super Admin Account
Execute the secure provisioning command:
```bash
docker compose -f docker-compose.production.yml exec api pnpm admin:create
```
Follow the interactive prompt to set the Super Admin email, name, and secure password.

---

## 5. Reverse Proxy & HTTPS Configuration (Caddy)

Caddy automatically provisions and renews Let's Encrypt TLS certificates:
```caddy
# /etc/caddy/Caddyfile

api.letzshop.store {
    reverse_proxy localhost:4000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```
Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## 6. Vercel Frontend Deployments (3 Projects)

Configure 3 separate projects in your Vercel team dashboard:

### Project 1: Storefront (`apps/storefront`)
- **Root Directory:** `apps/storefront`
- **Build Command:** `cd ../.. && pnpm --filter @simply/storefront build`
- **Output Directory:** `.next`
- **Domain:** `www.letzshop.store` & `letzshop.store`
- **Environment Variables:**
  ```ini
  NEXT_PUBLIC_API_URL=https://api.letzshop.store
  NEXT_PUBLIC_STOREFRONT_URL=https://www.letzshop.store
  NEXT_PUBLIC_SELLER_URL=https://seller.letzshop.store
  NEXT_PUBLIC_MEDIA_URL=https://media.letzshop.store
  ```

### Project 2: Seller Dashboard (`apps/seller`)
- **Root Directory:** `apps/seller`
- **Build Command:** `cd ../.. && pnpm --filter @simply/seller build`
- **Output Directory:** `.next`
- **Domain:** `seller.letzshop.store`
- **Environment Variables:**
  ```ini
  NEXT_PUBLIC_API_URL=https://api.letzshop.store
  NEXT_PUBLIC_STOREFRONT_URL=https://www.letzshop.store
  NEXT_PUBLIC_SELLER_URL=https://seller.letzshop.store
  NEXT_PUBLIC_MEDIA_URL=https://media.letzshop.store
  ```

### Project 3: Admin Portal (`apps/admin`)
- **Root Directory:** `apps/admin`
- **Build Command:** `cd ../.. && pnpm --filter @simply/admin build`
- **Output Directory:** `.next`
- **Domain:** `admin.letzshop.store`
- **Environment Variables:**
  ```ini
  NEXT_PUBLIC_API_URL=https://api.letzshop.store
  NEXT_PUBLIC_ADMIN_URL=https://admin.letzshop.store
  ADMIN_API_URL=https://api.letzshop.store
  ```
