# Simply E-Commerce (Multi-Tenant SaaS Platform)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.10-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.2.1-black.svg)](https://fastify.dev/)
[![Tests](https://img.shields.io/badge/tests-43%20passed%20%7C%200%20failed-brightgreen.svg)]()

> A high-performance, modular, multi-tenant SaaS ecommerce foundation engineered specifically for Indian businesses. Built with TypeScript, NestJS + Fastify, PostgreSQL (Prisma), and pnpm workspaces.

---

## 🌟 Key Highlights & Core Capabilities

- **Strict Multi-Tenancy**: 3-tier defense-in-depth isolation (Tenant Guard, Service Scoping, PostgreSQL Row-Level Security defense).
- **Server-Side Subscription Gating**: Unpaid merchants can register, configure products, and privately preview in their Seller PWA, but public storefront visibility, QR routing, and buyer checkout remain strictly blocked until an active paid subscription is verified.
- **Indian Market Native**:
  - Currency stored strictly in integer minor units (paise: ₹1,299.50 = `129950`).
  - Native validation for `+91` 10-digit mobile numbers and 6-digit Indian PIN codes.
  - Guest-first buyer shopping with 30-day tokens and zero mandatory account creation.
  - Resilient payment architecture for Razorpay (HMAC verification, webhook deduplication) and Shiprocket (serviceability, AWB tracking).
- **DPDPA 2023 Compliance**: Privacy-first data architecture with explicit consent logs, customer data portability exports, and right-to-erasure anonymization that preserves regulatory financial ledgers.
- **Zero Unnecessary Infrastructure**: Fast, simple, lean architecture utilizing PostgreSQL native GIN full-text indexing—no Redis, no Elasticsearch, and no microservices complexity for V1.

---

## 🏗 Monorepo Architecture

```
simply-ecommerce/
├── apps/
│   ├── admin/                # Platform Admin web application (Next.js placeholder shell)
│   ├── api/                  # High-performance NestJS + Fastify REST API
│   ├── seller/               # Seller/Vendor PWA dashboard (Next.js placeholder shell)
│   └── storefront/           # Buyer responsive storefront & PWA (Next.js placeholder shell)
├── packages/
│   ├── api-contracts/        # Standardized API response envelopes & ErrorCode enums
│   ├── config/               # Configurable brand constants & environment definitions
│   ├── db/                   # Prisma schema (47 models/enums), client, & seed scripts
│   ├── storage/              # StorageProvider interface (LocalDisk & S3 adapters)
│   ├── types/                # Domain enums (UserRole, OrderStatus, etc.) & interfaces
│   ├── ui/                   # Shared design system components (placeholder shell)
│   └── validation/           # Shared Zod / class-validator Indian schemas
├── scripts/
│   ├── backup.sh / .ps1      # Production pg_dump + media archive scripts
│   └── restore.sh / .ps1     # Database and media restore scripts
├── ARCHITECTURE.md           # System design & architecture specification
├── DATABASE.md               # PostgreSQL schema documentation & ER diagrams
├── SECURITY_AND_PRIVACY.md   # DPDPA compliance & security policies
├── INTEGRATIONS.md           # Razorpay & Shiprocket architecture & outbox pattern
├── BACKUP_AND_RECOVERY.md    # Backup schedules, PITR, & disaster recovery runbook
├── TESTING.md                # Testing strategy & multi-tenant attack scenarios
└── docker-compose.yml        # Local PostgreSQL container definition
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x LTS`
- **pnpm**: `v9.x` or `v10.x` (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL**: `v15+` (local or via Docker)

### 1. Clone and Install Dependencies
```bash
git clone <repo-url> simply-ecommerce
cd simply-ecommerce
pnpm install
```

### 2. Configure Environment Variables
Copy the template configuration:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL database credentials and JWT secrets.

### 3. Start Database (Optional Docker Compose)
```bash
docker compose up -d
```

### 4. Run Migrations & Seed Default Data
```bash
pnpm db:migrate
pnpm db:seed
```
*Seeds:*
- Platform Admin (`admin@simplyecommerce.local`)
- Default Subscription Plans (`STARTER`, `GROWTH`, `PRO`)
- Default Store Themes (`MINIMAL_CHIC`, `MODERN_BOLD`)
- **Tenant A (Aurelia Atelier)**: Paid, active subscription, live store (`aurelia-atelier`).
- **Tenant B (Patil Engineering)**: Unpaid, private preview store (`patil-engineering`).

### 5. Launch the Development Server
```bash
pnpm dev
```
The API server starts on **http://localhost:4000**.
- **Interactive Swagger API Docs**: [http://localhost:4000/docs](http://localhost:4000/docs)
- **Liveness Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Deep Readiness Probe**: [http://localhost:4000/health/ready](http://localhost:4000/health/ready)

---

## 🧪 Running Automated Tests

The test suite contains **43 automated tests across 9 test suites** verifying tenant isolation, subscription gating, inventory concurrency, and payments:

```bash
# Run all tests (Unit + E2E)
pnpm test

# Run unit tests only (26 tests)
pnpm test:unit

# Run integration & E2E attack tests (17 tests)
pnpm test:e2e
```

Refer to [`TESTING.md`](file:///d:/Simply%20-%20E%20Commerce/TESTING.md) for detailed test scenarios and attack vectors.

---

## 📚 Technical Documentation Directory

- [`ARCHITECTURE.md`](file:///d:/Simply%20-%20E%20Commerce/ARCHITECTURE.md) - High-level system architecture, bounded contexts, and request flows.
- [`DATABASE.md`](file:///d:/Simply%20-%20E%20Commerce/DATABASE.md) - Entity Relationship (ER) diagrams, indexes, and schema definitions.
- [`SECURITY_AND_PRIVACY.md`](file:///d:/Simply%20-%20E%20Commerce/SECURITY_AND_PRIVACY.md) - Authentication security, tenant isolation, and DPDPA compliance.
- [`INTEGRATIONS.md`](file:///d:/Simply%20-%20E%20Commerce/INTEGRATIONS.md) - Razorpay, Shiprocket, and transactional outbox specifications.
- [`BACKUP_AND_RECOVERY.md`](file:///d:/Simply%20-%20E%20Commerce/BACKUP_AND_RECOVERY.md) - Backup scripts, cron schedules, and disaster recovery runbook.
- [`TESTING.md`](file:///d:/Simply%20-%20E%20Commerce/TESTING.md) - Test breakdown, assertions, and attack test instructions.

---

## ⚖️ License
Proprietary & Confidential. All rights reserved.
