# Simply E-Commerce - Security & Privacy Architecture (DPDPA 2023 Alignment)

> [!CAUTION]
> **Legal Disclaimer**: This document details the technical controls, architecture, and engineering guardrails built into Simply E-Commerce to align with the Digital Personal Data Protection Act, 2023 (DPDPA). It does not constitute legal certification or formal legal advice. Items marked with `[LEGAL REVIEW REQUIRED]` must be reviewed by qualified Indian data protection counsel prior to production launch.

---

## 1. Security Architecture & Defense Controls

### 1.1 Multi-Layer Defense-in-Depth
- **Application Tenant Guards**: All seller and staff endpoints enforce `TenantGuard`. The server-side session context determines the tenant; client-supplied `tenant_id` parameters are never trusted.
- **SQL Injection Prevention**: Prisma ORM with parameterized queries and prepared statements eliminates SQL injection vulnerabilities across all dynamic lookups.
- **Path Traversal Defense**: Media storage strictly sanitizes path segments and enforces root directory containment:
  ```ts
  if (!absoluteFilePath.startsWith(this.rootDir)) {
    throw new Error('Access denied: target path escapes media storage boundary');
  }
  ```
- **Secret Sanitization in Audit Trails**: `AuditService` automatically scrubs sensitive keys (`password`, `token`, `secret`, `otp`, `card`, `pin`, `key`) before persisting audit logs.
- **CORS & Secure Headers**: Fastify Helmet provides HTTP security headers (HSTS, X-Content-Type-Options, Frameguard). CORS strictly whitelists authorized frontend origins.
- **Rate Limiting**: NestJS Throttler protects endpoints from brute-force attacks (default: 100 requests / minute, with custom 60-second cooldowns for OTP endpoints).

---

## 2. Privacy by Design: DPDPA 2023 Technical Alignment

### 2.1 Data Minimization at Buyer Checkout
Under Section 6 of DPDPA, data fiduciaries must limit data collection to what is necessary for the specified purpose. 

**V1 Guest Checkout Data Minimization Matrix**:
| Field Collected | Operational Purpose | Mandatory? | Retention Justification |
| :--- | :--- | :--- | :--- |
| `fullName` | Package recipient identification | Yes | Required for courier delivery handover |
| `phone` | Delivery coordination & SMS tracking | Yes | Required for courier OTP / delivery calls |
| `deliveryAddress` | Physical dispatch location | Yes | Required for logistics fulfillment |
| `email` | Order receipt & tax invoice | **Optional** | Not required if phone is supplied |
| `dateOfBirth` | None | **NOT COLLECTED** | Eliminated entirely |
| `gender` | None | **NOT COLLECTED** | Eliminated entirely |

---

## 3. DPDPA Technical Controls Implemented

### 3.1 Notice & Explicit Consent (`consent_records`)
- **Granular Purposes**: Defined via `ConsentPurpose` (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `MARKETING_COMMUNICATION`, `ORDER_TRACKING`).
- **Audit Logging**: Captures `policyVersion`, `ipAddress`, `userAgent`, and exact timestamp.
- **Revocability**: Supports recording `revoked_at` when a customer opts out of non-essential communications.

### 3.2 Right to Access & Data Portability (`POST /privacy/export/:phone`)
- Exports a complete, structured JSON file of all personal data held about a customer across their profile, addresses, order history, and consent timestamps.

### 3.3 Right to Erasure / Anonymization (`POST /privacy/anonymize`)
When a customer requests account deletion or data erasure:
1. `fullName` is replaced with `Anonymized Buyer`.
2. `phone` is replaced with a one-way hashed token (`+910000000000_xxxx`).
3. `email` is set to `null`.
4. Saved delivery addresses are wiped (`[REDACTED]`).
5. **Statutory Tax Retention**: In accordance with Indian GST and Companies Act requirements, order totals, tax amounts, item SKUs, and transaction IDs are **preserved** without personal identifiers so financial ledgers remain referentially consistent.
6. The erasure event generates an immutable record in `audit_logs`.

---

## 4. Checklist: Items Requiring Legal & DPDPA Counsel Review

| Item | Technical Implementation | Legal Counsel Action Required |
| :--- | :--- | :--- |
| **Notice & Consent Text** | Configurable via `policyVersion` | Review draft privacy notice in English + 22 Eighth Schedule languages (Section 5(3)) `[LEGAL REVIEW REQUIRED]` |
| **Data Retention Periods** | Configurable via environment and cron | Verify statutory retention schedules for GST invoices (6 years) vs marketing data `[LEGAL REVIEW REQUIRED]` |
| **Grievance Redressal Officer** | Supported via configurable contacts | Formally appoint and publish details of Indian Grievance Redressal Officer `[LEGAL REVIEW REQUIRED]` |
| **Children's Data Verification** | Age verification not implemented in V1 | Formally verify whether products sold qualify as child-directed goods under Section 9 `[LEGAL REVIEW REQUIRED]` |
| **Cross-Border Transfers** | Local Hostinger/Indian VPS default | Verify cloud provider data center locations against Central Government blacklists `[LEGAL REVIEW REQUIRED]` |
| **Breach Notification SLA** | Outbox audit log infrastructure | Establish standard operating procedure (SOP) to notify Data Protection Board within 72 hours `[LEGAL REVIEW REQUIRED]` |
