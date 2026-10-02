# Automated Testing Strategy & Execution Guide

This document details the testing architecture, test suites, multi-tenant isolation attack scenarios, and execution instructions for **Simply E-Commerce**.

---

## 1. Testing Philosophy & Pyramid

The platform follows a rigorous three-tiered test hierarchy:

```
          / \
         /   \      E2E & Integration Tests (46 tests)
        / E2E \     - Tenant isolation attacks
       /-------\    - Phase 2.5 Security, Boundary & Webhook Hardening
      / Integr. \   - Guest checkout transactions & atomic rollback
     /-----------\  - Webhook deduplication & idempotency
    /    Unit     \ Unit Tests (26 tests)
   /     Tests     \- Subscription gating & grace period logic
  /_________________\- Concurrency-safe atomic inventory reservation
                     - Paise/minor currency arithmetic
                     - Path traversal & MIME storage validation
                     - Timing-safe HMAC signature verification
                     Total Automated Tests: 72 tests across 11 test suites
```

---

## 2. Test Suites Summary

### 2.1 Unit Test Suites (`apps/api/test/unit/`)

| Suite File | Target Module | Test Count | Key Invariants Verified |
| :--- | :--- | :--- | :--- |
| `subscription-visibility.service.spec.ts` | `subscriptions` | 6 | DRAFT blocked publicly; Private preview allowed for owner; Active paid store accessible; Expired store immediately blocked; Grace period; Admin override. |
| `inventory.service.spec.ts` | `inventory` | 4 | Concurrency atomic decrement (`WHERE stock >= qty`); Insufficient stock failure; Stock rollback; Immutable inventory movement ledger. |
| `money.spec.ts` | `packages/validation` | 6 | Integer paise validation; Rejects negative numbers; Rejects floating point / decimals; Rounding defense; GST/tax calculation. |
| `local-disk-storage.spec.ts` | `packages/storage` | 5 | Path traversal protection (`../../etc/passwd`); Filename sanitization; MIME type whitelisting; File size limits; UUID storage keys. |
| `razorpay.provider.spec.ts` | `payments` | 5 | Valid HMAC-SHA256 signature verification; Tampered payload rejection; Malformed signature rejection; Timing attack defense (`crypto.timingSafeEqual`). |

### 2.2 Integration & E2E Test Suites (`apps/api/test/integration/`)

| Suite File | Focus Area | Test Count | Scenarios Verified |
| :--- | :--- | :--- | :--- |
| `phase2-5-hardening.spec.ts` | **Phase 2.5 Security & Gateways** | 20 | **1. Two Distinct Payment Flows**: `PLATFORM_SUBSCRIPTION` vs `MERCHANT_ORDER`; strict boundary prevents platform billing key for store orders (`IllegalPaymentBoundaryException`).<br/>**2. Subscription Security**: Direct activation blocked in production; dev-activate blocked in production, permitted in test/dev with audit log.<br/>**3. Payment State Machine**: Enforces valid transitions (`PENDING` → `PAID` → `REFUNDED`), blocks illegal backwards/terminal transitions (`PAID` → `PENDING`, `REFUNDED` → `PAID`, `FAILED` → `PAID`).<br/>**4. Razorpay Webhooks**: Cryptographic timing-safe HMAC verification, duplicate event deduplication via `payment_webhook_events`.<br/>**5. Secure Order Tracking**: Rejects requests without `?t=` token (403); rejects invalid tokens (403); returns masked `BuyerSafeTrackOrderDto` with valid token.<br/>**6. Shipping Failure Safety**: Outbox pattern keeps paid order intact when shipping API fails, queues retry.<br/>**7. Media Upload Hardening**: Rejects >5MB files (400), blocks unsafe MIME types (400), accepts valid brand assets.<br/>**8. Admin Outbox Operations**: SuperAdmin can trigger manual retry for failed outbox events with audit logging. |
| `tenancy-isolation.spec.ts` | **Multi-Tenancy Security** | 6 | Cross-tenant isolation attacks: Tenant A cannot read/mutate Tenant B's products, stores, orders; unauthenticated calls blocked (401); role escalation blocked (403). |
| `order-transaction-rollback.spec.ts` | **Guest Checkout & Rollback** | 4 | Full guest checkout transaction, atomic inventory decrement in PostgreSQL transaction, rollback on payment failure, zero over-selling. |
| `reliability-and-failures.spec.ts` | **Webhooks & Idempotency** | 5 | Duplicate webhook deduplication, double-tap idempotency replay caching, retry queuing. |
| `api-e2e.spec.ts` | **End-to-End API Flows** | 5 | Complete lifecycle from store creation, product listing, cart, checkout to order. |
| `phase2-endpoints.spec.ts` | **Phase 2 Frontend APIs** | 6 | Storefront branding, theme switching, B2B quotations, customer inquiries, seller onboarding. |

---

## 3. Running Automated Tests

### 3.1 Prerequisites
Ensure the test database is created and migrated:
```bash
# In PostgreSQL
CREATE DATABASE simply_ecommerce_test;

# Run migrations and seed on test database
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simply_ecommerce_test"
pnpm db:migrate:deploy
pnpm db:seed
```

### 3.2 Execute Test Suites

```bash
# Run all tests across the monorepo (Unit + E2E)
pnpm test

# Run only fast unit test suites
pnpm test:unit

# Run only integration and E2E attack test suites
pnpm test:e2e

# Run with test coverage report
pnpm --filter @simply/api test:cov
```

---

## 4. Test Fixtures & Seed Data

The test seed [`packages/db/prisma/seed.ts`](file:///d:/Simply%20-%20E%20Commerce/packages/db/prisma/seed.ts) provisions two distinct tenants explicitly configured for tenant isolation testing:

1. **Tenant A: Aurelia Atelier**
   - Slug: `aurelia-atelier`
   - Store ID: `00000000-0000-0000-0000-000000000001`
   - Subscription Status: `ACTIVE` (Paid growth plan through next year)
   - Store Status: `LIVE` (Publicly accessible)
   - Owner Mobile: `+919876543210`
   - Catalog: 3 Products with Colour & Size variants, active inventory

2. **Tenant B: Patil Engineering**
   - Slug: `patil-engineering`
   - Store ID: `00000000-0000-0000-0000-000000000002`
   - Subscription Status: `INACTIVE` / Unpaid
   - Store Status: `PRIVATE_PREVIEW` (Public access blocked)
   - Owner Mobile: `+919876543211`
   - Catalog: 2 B2B Enquiry-only products
