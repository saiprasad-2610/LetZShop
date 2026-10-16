# LetzShop Admin live-data audit

Branch: `merchant-tabs-update`. Admin reuses the existing NestJS API, Prisma models, PostgreSQL database and HttpOnly authenticated BFF. No separate Admin datastore or browser database connection was introduced.

## A. Static-data audit

| Route / component       | Finding                                                                                                                             | Replacement                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard               | Partial KPI coverage, revenue fallback of zero while the request was unavailable, missing definitions/date-backed charts            | Explicit database counts and subscription payment sum; data-only rendering; PostgreSQL daily aggregates; current totals distinguished from chart date range              |
| Merchants               | Browser filtering/pagination of an incomplete list, legacy detail modal and presentation fallbacks                                  | Server search across businesses/stores/owners, status/latest-plan/latest-subscription filters, sorting, 20/page; existing dedicated detail route                         |
| Merchant detail         | Broad unbounded relations, raw user/payment relation data, incomplete counts                                                        | Safe selected fields; database customer/product/order/active-review/distinct-reported-review counts; bounded latest 20 subscriptions/invoices; missing fields identified |
| Analytics               | Assumed 2% commission on customer GMV, first five stores labelled top performers, misleading zero values after failure              | Successful subscription payments labelled separately from PAID customer-order GMV; real ranked order counts; backend date ranges and grouped charts                      |
| Commerce                | Incorrect order/customer/amount field names, guessed PAID status, pagination of 30 downloaded rows, unimplemented live-update claim | Actual Order fields, customer relation, all original payment/fulfilment/shipment states, backend search/range/sort and pagination                                        |
| Users                   | At most 100 accounts, console-only failures, missing store described as platform staff                                              | Safe User selects, backend role/status/search and pagination, real associated store or explicit absence, Retry                                                           |
| Themes                  | Code-defined preset catalog counts and invented New/Active indicators                                                               | Theme records, actual default flag, update timestamp and store-configuration relation count                                                                              |
| Operations              | Fallback total of 12 events, fixed gateway test-mode label, mismatched audit response and generic invented event description        | Actual total/pending/failed OutboxEvent counts and safe failed-event list; real reconciliation/retry operations; link to real audit trail                                |
| Subscriptions / Billing | Canonical DB plans already present; fallback plan description/caps, missing request errors, unpaginated subscription rows           | Canonical Plan metadata and availability; no guessed descriptions or caps; error/Retry; actual periods/status/latest invoice and server pagination                       |
| Payments                | Existing DB-backed list lacked currency/completion fields; missing provider ID substituted the internal record ID                   | Safe subscription payment/invoice/plan relations, actual currency and invoice paidAt; missing gateway ID explicitly identified                                           |
| Reviews & Reports       | Existing real moderation workflow retained; loose response types and missing filter-error retry                                     | Typed ProductReview/ReviewReport/Order/Product/Store relations; separate visibility/report status; bounded filter metadata/history; no zero totals on failed reads       |
| Audit Logs              | Existing real audit list retained; loose types and empty-state confusion on failures                                                | Typed safe actor/action/target/reason/status/timestamp; 20/page; no arbitrary payment/auth metadata                                                                      |
| Settings                | Earlier decorative save form was already removed; platform labels still independent constants                                       | Read-only deployed backend brand configuration and canonical plan availability; no fake save control                                                                     |
| Shared shell            | Light-only colors and no persisted theme                                                                                            | Semantic roles mapped to existing Tailwind slate/emerald palette; persistent theme on every route; no static sidebar counts                                              |

Labels, filter options, form defaults and metric definitions are UI/configuration, not business records. Missing data is never replaced with example merchants, reviews, payments, revenue, statuses or chart points.

## B–C. API mapping and page status

| Admin route     | Protected API                                                                     | Source                                                                                                                                           | Status                   |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| /login          | POST/GET/DELETE /api/admin-session → auth/admin/login, admin/session, auth logout | Existing User credential and backend session                                                                                                     | Real authentication      |
| /               | GET /admin/overview?range=                                                        | Tenant/owner membership, Store/latest Subscription, Product, Order, Customer, active ProductReview, ReviewReport, successful SubscriptionPayment | DYNAMIC                  |
| /merchants      | GET /admin/merchants; /admin/plans                                                | Tenant, active owner membership, User, Store, latest Subscription/Plan                                                                           | DYNAMIC                  |
| /merchants/[id] | GET /admin/merchants/:id; POST suspend/reactivate                                 | Safe real owner/store/count/subscription/invoice relations; mutation + AuditLog transaction                                                      | DYNAMIC                  |
| /reviews        | GET /admin/reviews; /admin/reviews/filters; PATCH moderation/report endpoints     | ProductReview + ReviewReport + Product + Store + Order                                                                                           | DYNAMIC                  |
| /billing        | GET /admin/plans; /admin/subscriptions; plan POST/PUT/DELETE                      | Canonical Plan, Subscription, latest SubscriptionInvoice                                                                                         | DYNAMIC                  |
| /subscriptions  | Existing alias of /billing                                                        | Same records and APIs                                                                                                                            | DYNAMIC                  |
| /payments       | GET /admin/payments                                                               | SubscriptionPayment → SubscriptionInvoice → Tenant/Subscription/Plan                                                                             | DYNAMIC                  |
| /users          | GET /admin/users; POST toggle-status                                              | Safe User fields and membership/store relation; audited mutation                                                                                 | DYNAMIC                  |
| /settings       | GET /admin/settings                                                               | Current backend deployment brand configuration + canonical growth plan policy                                                                    | REAL SETTINGS, READ-ONLY |
| /audit-logs     | GET /admin/audit-logs                                                             | AuditLog and safe actor name lookup                                                                                                              | DYNAMIC                  |
| /analytics      | GET /admin/analytics?range=                                                       | SQL daily aggregates, successful subscription payments, PAID order GMV, ranked store order counts                                                | DYNAMIC                  |
| /commerce       | GET /admin/commerce                                                               | Order → Store/Customer                                                                                                                           | DYNAMIC                  |
| /themes         | GET /admin/themes                                                                 | Theme + StoreThemeConfig counts                                                                                                                  | DYNAMIC                  |
| /operations     | GET /admin/operations; POST retry-outbox/reconcile-payment                        | OutboxEvent + existing gateway reconciliation service + AuditLog                                                                                 | DYNAMIC                  |

Every data page has loading feedback, meaningful empty output and error/Retry. Settings always returns real configuration; Dashboard zero values are actual aggregate results. Large tables use server pagination (default 20, bounded). Filters and analytics run in the backend. Merchant filters use the latest subscription and preserve all active filters together.

Queries use count, aggregate, groupBy, parameterized SQL and bounded relation selects. Charts contain actual observed dates only. Review metadata filter lists are capped at 500 and report histories at 50; search still queries all matching reviews. Detail histories show the latest 20 and link to paginated subscriptions. No migration or database reset was needed for this continuation.

## D. Database and cross-app verification

The final machine-readable evidence is `artifacts/admin-completion/e2e/results.json`; browser screenshots are alongside it.

Verification uses actual local PostgreSQL records and installed Chrome, with no mocked successful API responses. Isolated accounts/businesses prepare authenticated test access; business activity then runs through normal Seller catalog/media APIs, public Storefront cart/checkout, the customer verified-review form, Seller report UI and Admin moderation UI. The script cleans only its tracked temporary records.

The subscription payment check compares existing database records and API/UI sums. It does not claim a new captured gateway payment. Successful subscription revenue excludes customer order GMV.

Checks include database/API/UI merchant/product/order/customer/review/revenue totals, positive pending-report count, latest-subscription expiry regression, merchant list/KPI agreement, server pagination, all six date ranges, invalid dates/prices, and empty searches. Review counts are checked again after the two actual review submissions, so the evidence records the count at each stage.

Normal API activity proves:

- Seller product creation increments Admin total products by one.
- Storefront COD checkout creates a real order visible in Seller Orders and Admin.
- Merchant report increments the real pending-report count and appears in Admin.
- Removing a 1-star review from a 1/5 pair changes visible count 2→1 and average 3→5; restoring returns count 2 and average 3.
- Dismissal preserves the review; audited suspension/reactivation updates the same store records and preserves private/expired visibility.

| Metric (during verification) | PostgreSQL |      API |  Admin UI |
| ---------------------------- | ---------: | -------: | --------: |
| totalMerchants               |         64 |       64 |        64 |
| pendingReviewReports         |          0 |        0 |         0 |
| subscriptionRevenuePaise     |   14885100 | 14885100 | ₹1,48,851 |
| totalOrders                  |       1109 |     1109 |      1109 |
| totalProducts                |        133 |      133 |       133 |
| totalCustomers               |         90 |       90 |        90 |
| totalReviews                 |         11 |       11 |        11 |

Positive report test: PostgreSQL = 1, API = 1; browser dashboard separately asserted baseline + 1. Values above were captured before temporary-record cleanup.

## E. Light and Dark

Both themes cover login, dashboard, merchants, merchant detail, reviews, billing, subscriptions alias, payments, users, settings, audit logs, analytics, commerce, themes and operations.

Verified viewports: 1440×900, 1280×800, 768×1024, 390×844, in each theme. Checks assert no document overflow and no white Admin panel in Dark. Screenshots cover tables, cards, filters, empty/error content and login. Dialogs use semantic surfaces. Theme survives navigation, refresh and logout/login without clearing the session. Charts use themed text, bars and tracks; numeric labels remain available without hovering.

## F. Security and mutation behavior

All 16 Admin read endpoints are tested: anonymous 401, merchant 403, platform admin 200. Browser middleware and BFF session handling also reject merchant/expired cookies; logout revokes the server session. Permission revocation takes effect for existing tokens.

Only explicit safe fields are returned for users, merchant owners, payments and operations. No credential hashes, OTPs, refresh tokens, gateway secrets, card/CVV data or arbitrary gateway/auth payloads are shown. Report creation is tenant-scoped; duplicate open reports return 409 and another tenant's review returns 404.

Moderation, suspension/reactivation, user status and plan mutations persist through the backend with audit writes. User/plan audit failures roll back their mutations. Plan inputs are validated. Existing Growth purchase blocking remains enforced by the backend.

## G–J. Reproduction and delivery

Run `pnpm dev`, then open http://localhost:3002. The launcher starts API 4000, Seller 3001, Storefront 3000 and Admin 3002. For a development-only admin account run `pnpm admin:seed`; it prints a generated password locally or accepts the documented ADMIN_DEV_* environment overrides. Credentials are never placed in the frontend. Seed refuses production/Render.

Run `pnpm test:admin` against a local development PostgreSQL database and all four services. Browser evidence and actual exit codes are recorded in `artifacts/admin-completion`.

| Required check               | Actual exit code |
| ---------------------------- | ---------------: |
| @simply/db build             |                0 |
| @simply/types build          |                0 |
| @simply/api-contracts build  |                0 |
| @simply/api typecheck        |                0 |
| @simply/admin typecheck      |                0 |
| @simply/seller typecheck     |                0 |
| @simply/storefront typecheck |                0 |
| @simply/api build            |                0 |
| @simply/admin build          |                0 |
| @simply/seller build         |                0 |
| @simply/storefront build     |                0 |

Chrome verification: exit 0; 120 route/theme/viewport checks passed, no page errors, temporary records removed. Focused auth/payment/subscription unit suites: exit 0, 20/20 tests passed. The full unrelated unit suite was not rerun for this continuation.

The final delivery report records changed files, commit and push result. Only `origin/merchant-tabs-update` is an authorized push target.

Supplemental UI verification: `node scripts/test-admin-ui.mjs` exited 0. All 14 authenticated routes showed real API-failure feedback and recovered through Retry in both themes (28 checks); the plan editor fit 390×844 in Light/Dark (2 dialogs). The controlled network aborts exercise failure handling only; successful business data remains PostgreSQL/API-backed. Evidence: `artifacts/admin-completion/supplemental-ui.json`.
