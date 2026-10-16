# Admin dashboard verification — 16 October 2026

Branch: `merchant-tabs-update`. Scope: the existing dashboard only. No complaints, new widgets, analytics screens, settings, merchant management, Seller UX or Storefront UX were implemented.

## A. Static data found and initial classification

No hardcoded dashboard business values, demo arrays, fake percentages, random trends or API-to-demo fallback were found in the current production source. This was established by tracing the actual page, shared chart renderer, fetching hook, BFF, controller, service and PostgreSQL queries before editing.

| Existing visible element                 | Before classification                                                    | Correction / evidence                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Total Merchants                          | REAL business count with incomplete role exclusion                       | Canonical Tenant + active SELLER_OWNER membership; explicitly excludes admin users/superadmins and extra Store profiles        |
| Live Stores                              | PARTIALLY REAL: duplicated visibility SQL with extra tenant restrictions | Matches current public storefront predicates and latest subscription                                                           |
| Draft / Private Stores                   | REAL                                                                     | Non-deleted DRAFT / PRIVATE_PREVIEW Store count retained                                                                       |
| Suspended Stores                         | REAL                                                                     | Non-deleted SUSPENDED Store count retained                                                                                     |
| Active Subscriptions                     | PARTIALLY REAL: historical ACTIVE rows could remain counted              | Only latest subscription per non-deleted tenant; ACTIVE and unexpired                                                          |
| Total Products                           | REAL                                                                     | Non-deleted Product count retained                                                                                             |
| Total Orders                             | REAL                                                                     | All Order rows retained                                                                                                        |
| Total Customers                          | REAL                                                                     | Customer row count retained                                                                                                    |
| Total Reviews                            | REAL                                                                     | ACTIVE ProductReview count retained                                                                                            |
| Pending Review Reports / Pending Reports | REAL                                                                     | PENDING + UNDER_REVIEW retained; resolved/dismissed excluded                                                                   |
| Subscription Revenue                     | REAL successful-payment aggregate                                        | SUCCESS/PAID SubscriptionPayment integer paise sum retained, separate from customer GMV                                        |
| Removed This Month                       | CALCULATED INCORRECTLY                                                   | Counts currently REMOVED ProductReview rows by moderatedAt, rather than removal audit events for subsequently restored reviews |
| Resolved Reports                         | REAL                                                                     | RESOLVED ReviewReport count retained                                                                                           |
| Latest pending reports                   | REAL                                                                     | Latest five unresolved reports and actual review/product/store relations retained                                              |
| Recently Joined Merchants                | REAL, including persisted development records                            | Same canonical merchant definition as total/growth; real creation timestamps, maximum five                                     |
| Recent Orders                            | REAL                                                                     | Latest five actual orders; unnecessary customer/fulfilment data no longer returned to this dashboard                           |
| Merchant growth                          | REAL PostgreSQL aggregate                                                | Same seller/admin exclusion as merchant total                                                                                  |
| Subscription revenue chart               | CALCULATED INCORRECTLY                                                   | Group/filter by invoice paidAt; legacy successful rows lacking paidAt use persisted payment createdAt                          |
| Orders created                           | REAL PostgreSQL aggregate                                                | Actual createdAt groups retained                                                                                               |
| Reports created / resolved               | REAL PostgreSQL aggregate                                                | Actual createdAt/resolvedAt groups retained                                                                                    |
| Growth percentages                       | NOT PRESENT                                                              | No percentage widgets added or manufactured                                                                                    |

The development database itself contains seeded businesses (including the canonical Aurelia/Patil seed IDs) and two older `Moderation QA 7bd4c65e79` businesses. Those explain the demo-looking recent list. They are existing PostgreSQL records, not UI samples or API fallbacks. This task preserved existing records: no name-based hiding, resetting, truncation or purging was performed. Local successful-payment rows establish database/status fidelity; this verification does not assert that every development receipt represents a live gateway settlement.

The layout, cards, five existing charts, navigation, themes and responsive structure are preserved. “Last updated” is the database transaction timestamp; dashboard failures now explicitly say “Unable to load dashboard data” with Retry.

## B. Exact data sources

Every row below uses the existing chain:

`Dashboard → authenticated /api/platform/admin/overview → GET /admin/overview → AdminController.getOverview → AdminService.getOverview → AdminDataService.overview → AdminDashboardService.read`.

No duplicate dashboard endpoint or separate Admin database was created. The entire response uses one PostgreSQL REPEATABLE READ snapshot.

| Component                           | Prisma / PostgreSQL source                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total merchants, recent merchants   | Tenant.count / Tenant.findMany with merchantWhere below; recent list take 5                                                                                                                                          |
| Live stores                         | Store joined to latest Subscription per tenant: deletedAt null, LIVE, isPubliclyAccessible, latest ACTIVE, currentPeriodEnd >= database time; mirrors SubscriptionVisibilityService.evaluateVisibility public checks |
| Draft/private, suspended stores     | Store.count with actual StoreStatus values and deletedAt null                                                                                                                                                        |
| Active subscriptions                | Latest Subscription per non-deleted Tenant, ACTIVE and currentPeriodEnd >= database time; aligns with SubscriptionService.getTenantSubscription latest-row semantics                                                 |
| Products                            | Product.count({where:{deletedAt:null}})                                                                                                                                                                              |
| Orders                              | Order.count(), including cancelled orders                                                                                                                                                                            |
| Customers                           | Customer.count(); a person represented in two stores counts as two Customer records                                                                                                                                  |
| Reviews                             | ProductReview.count({where:{status:'ACTIVE'}})                                                                                                                                                                       |
| Revenue                             | SubscriptionPayment.aggregate with status in SUCCESS/PAID, _sum.amountPaise; empty sum = 0                                                                                                                           |
| Pending reports, latest report list | ReviewReport.count/findMany with status in PENDING/UNDER_REVIEW; latest list take 5, safe selected review/store/product fields                                                                                       |
| Removed this month                  | ProductReview.count: status REMOVED, moderatedAt >= current UTC month start                                                                                                                                          |
| Resolved reports                    | ReviewReport.count: status RESOLVED                                                                                                                                                                                  |
| Recent orders                       | Order.findMany, take 5, createdAt desc; selected order number, amount/currency, payment status, date and store name                                                                                                  |
| Merchant chart                      | Parameterized PostgreSQL count grouped by Tenant.createdAt day and canonical merchant predicates                                                                                                                     |
| Revenue chart                       | Successful SubscriptionPayment joined to SubscriptionInvoice; sum amountPaise by COALESCE(invoice.paidAt,payment.createdAt)                                                                                          |
| Order chart                         | Order.createdAt daily count; customer GMV remains separately identified in response                                                                                                                                  |
| Report charts                       | ReviewReport.createdAt daily count and RESOLVED rows grouped by resolvedAt                                                                                                                                           |
| Last updated                        | SELECT CURRENT_TIMESTAMP inside the read snapshot                                                                                                                                                                    |

Canonical merchant query:

```ts
prisma.tenant.count({
  where: {
    deletedAt: null,
    memberships: {
      some: {
        role: 'SELLER_OWNER',
        isActive: true,
        user: {
          deletedAt: null,
          role: 'SELLER_OWNER',
          isSuperAdmin: false,
        },
      },
    },
  },
});
```

StoresService.onboardMerchant creates the business Tenant, owner membership and first store. Additional Store profiles under that Tenant must not add a merchant; the live test verifies this. Distinct business Tenants are the platform merchant unit, rather than customer accounts, admin accounts or a raw Store count.

Charts use database UTC timestamps. The existing backend ranges remain 7/30/90/180/365 rolling days and All Time; All Time now has no arbitrary 1970 cutoff. API range validation rejects unsupported values. No large table is downloaded for frontend aggregation and no zero-filled chart points are synthesized.

## C. PostgreSQL / API / browser verification

The table below is generated from independent SQL queries and actual Chromium text, before temporary onboarding activity. Independent checks use JOIN/DISTINCT and DISTINCT ON formulations rather than reusing the dashboard implementation.

| Metric                   | PostgreSQL |      API | Browser UI |
| ------------------------ | ---------: | -------: | ---------: |
| totalMerchants           |         62 |       62 |         62 |
| liveStores               |        130 |      130 |        130 |
| activeSubscriptions      |        131 |      131 |        131 |
| totalOrders              |       1106 |     1106 |       1106 |
| subscriptionRevenuePaise |   14885100 | 14885100 |  ₹1,48,851 |
| pendingReviewReports     |          0 |        0 |          0 |
| privateStores            |         90 |       90 |         90 |
| suspendedStores          |          0 |        0 |          0 |
| totalProducts            |        131 |      131 |        131 |
| totalCustomers           |         88 |       88 |         88 |
| totalReviews             |          9 |        9 |          9 |

All eleven KPIs were compared again after onboarding: 22 matched comparisons in total. All chart series were independently aggregated, and rendered chart dates/values were compared with the API. Recent merchant/order IDs were verified against actual database rows.

Machine-readable evidence: `artifacts/dashboard-proof/results.json`.

## D. Real application data-change test

`auth/register/request-otp → auth/register/verify-otp → auth/pin/setup → stores/onboard` ran against the actual local API and PostgreSQL with the configured development OTP provider.

- Before onboarding: database/API/UI Total Merchants = **62**.
- After normal onboarding and dashboard refresh: database/API/UI Total Merchants = **63**.
- Creating a second store through the existing `POST /stores` API kept Total Merchants at **63**.
- The new business appeared in Recently Joined Merchants.
- Only the tracked verification accounts, tenant, OTP rows and audit/outbox records were cleaned afterward. Existing seeded, QA and merchant records were preserved.

API authorization: anonymous **401**, merchant token **403**, platform admin **200**.

## E. Empty, loading, error and theme checks

Actual Chromium tests passed in Light and Dark at 1440×900, 768×1024 and 390×844, with no document overflow, no white dashboard panels in Dark and no browser page errors.

Loading hides KPI values until a real response arrives. A controlled network abort produces an explicit error and Retry; no cards/lists/charts are substituted. Retry restores actual API data.

The empty case runs the production dashboard service against real transaction-local PostgreSQL tables in pg_temp, with no persisted business rows. It returns zero for all eleven KPIs and empty lists/charts. The test browser renders that independently computed empty response in its isolated context to verify zero/empty presentation. This transport interception is used only for empty-state rendering; populated-platform comparisons above use the unmodified real API. Existing platform tables are never emptied.

Nine read-calculation regressions also passed in temporary PostgreSQL tables: platform admin exclusion, extra store profiles, superseded active subscriptions, latest-expired store visibility, restored-review exclusion, unsuccessful-payment exclusion, paidAt filtering, legacy payment timestamp fallback, and empty results. Temporary tables disappear on commit, temporary enum adapters on connection close; no permanent schema or migration was introduced.

Reproduce with `pnpm test:admin:dashboard` while the local API/Admin apps are running with development OTP enabled and the API is built. Evidence also includes `empty-postgres.json`, `regressions.json` and Light/Dark screenshots in `artifacts/dashboard-proof`.

Final source search of `apps/admin/src` and `apps/api/src/modules/admin` found no mock/demo/dummy/sample/fake/Math.random business source. CSS input placeholders and the middleware's /_next/static exclusion are ordinary UI/framework usage.

## F. Files changed

- `apps/admin/src/pages/index.tsx`
- `apps/api/src/modules/admin/admin-data.service.ts`
- `apps/api/src/modules/admin/admin.module.ts`
- `package.json`
- `packages/api-contracts/src/admin.ts`
- `apps/api/src/modules/admin/admin-dashboard.service.ts`
- `scripts/check-dashboard-empty.cjs`
- `scripts/test-admin-dashboard.mjs`
- `docs/admin-dashboard-verification.md`

## G. Typecheck / build exit codes

| Command                                            | Exit |
| -------------------------------------------------- | ---: |
| pnpm --filter @simply/db build                     |    0 |
| pnpm --filter @simply/api-contracts build          |    0 |
| pnpm --filter @simply/api exec tsc --noEmit        |    0 |
| pnpm --filter @simply/admin exec tsc --noEmit      |    0 |
| pnpm --filter @simply/seller exec tsc --noEmit     |    0 |
| pnpm --filter @simply/storefront exec tsc --noEmit |    0 |
| pnpm --filter @simply/api build                    |    0 |
| pnpm --filter @simply/admin build                  |    0 |
| pnpm --filter @simply/seller build                 |    0 |
| pnpm --filter @simply/storefront build             |    0 |

`pnpm test:admin:dashboard`: exit **0**. Empty/edge-case PostgreSQL checks: exit **0**. No broader unrelated unit-test pass is claimed.

## H. Commit hash

Recorded in the final delivery report and chat after committing.

## I. Push result

Only `origin/merchant-tabs-update` is authorized. The final delivery report records the actual result. No force push or main push.
