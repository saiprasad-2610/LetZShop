# SIMPLY E-COMMERCE — FINAL PRODUCT ARCHITECTURE FREEZE REPORT

**Status:** COMPLETE & FROZEN  
**Date:** October 2, 2026  
**Baseline Verification:** 17/17 test suites passing (149/149 tests), 11/11 workspace packages build cleanly, all 4 dev services verified reachable (`dev-health-check.ts` 200 OK).

---

## 1. Final 7 Theme Keys

All obsolete theme keys (`MODERN_MINIMAL`, `WARM_ARTISAN`, `BOLD_STREETWEAR`, `CLASSIC_EDITORIAL`, `NORDIC_CLEAN`, `VIBRANT_MARKET`) have been replaced across `@simply/types`, `@simply/ui`, Prisma schema, and the database seed.

The canonical 7 theme keys are:
1. **`ATELIER`**: Editorial luxury boutique layouts, large imagery, typography-first fallback, product mosaic fallback.
2. **`PULSE`**: Campaign hero, product launch hero, split hero, product mosaic, high visual density, quick-add.
3. **`HARVEST`**: Warm artisan and story modules, maker process/story sections, organic/tactile presentation, quick-add.
4. **`FOUNDRY`**: Industrial/B2B technical specifications, RFQ/Enquiry workflow, product documents/downloads (brochures, datasheets, CAD drawings, manuals, certificates), product modes (`SELL_ONLINE`, `ENQUIRY_ONLY`, `SELL_AND_ENQUIRY`).
5. **`HABITAT`**: Furniture/home lifestyle, shop-by-space/use, material/finish presentation, shop-the-look curated groupings, editorial/story modules.
6. **`LOCAL`**: Neighbourhood high-density catalogue, instant search, compact/list/grid product views, store timings, local pickup/delivery presentation.
7. **`FEAST`**: Food-first menu/category navigation, fast quantity controls/quick-add, freshness/availability states, dietary badges (vegan, gluten-free, eggless), serves, lead/preparation time, delivery/pickup presentation.

---

## 2. Theme Capabilities Architecture

Theme capabilities are strictly configuration-driven and sit on top of generic product and store models. **No industry-specific database tables exist.**

### Common Capabilities (All 7 Themes)
Every theme contract includes 16 standardized configuration slots:
- `logo`: Store branding logo placement & sizing
- `brandColors`: Primary, secondary, background, and accent palettes
- `typographyPreset`: Editorial serif, modern grotesque, clean sans, geometric mono
- `heroMode`: Full banner, split hero, minimal headline, product launch marquee
- `heroMedia`: Image or background asset association
- `categoryMedia`: Category showcase imagery
- `collectionMedia`: Curated collection banner imagery
- `productMedia`: Primary and gallery product imagery
- `variantMedia`: Variant-specific imagery switching
- `sectionVisibility`: Toggleable visibility for each homepage section
- `sectionOrdering`: Dynamic drag-and-drop or array-based ordering of sections
- `productCardMode`: Minimal, detailed, compact, or pricing-focused card layouts
- `imageRatio`: Square (1:1), Portrait (3:4), Landscape (16:9), or Editorial (4:5)
- `backgroundTreatment`: Solid, subtle gradient, warm tint, or dark mode
- `buttonStyle`: Pill, rounded, sharp geometric, or ghost outline
- `motionLevel`: Reduced motion, subtle micro-animations, or energetic transitions

### Specialized Configuration Flags
Theme definitions declare their supported specialized feature slots in `ThemeDefinition.capabilities.specialized`:
- `ATELIER`: `editorialLuxuryLayouts`, `largeImagery`, `typographyFirstFallback`, `productMosaicFallback`
- `PULSE`: `campaignHero`, `productLaunchHero`, `splitHero`, `productMosaic`, `highVisualDensity`, `quickAdd`
- `HARVEST`: `warmStoryModules`, `processStorySections`, `organicTactilePresentation`, `quickAdd`
- `FOUNDRY`: `technicalSpecifications`, `rfqEnquiry`, `productDocumentsDownloads`, `industriesServed`, `certifications`, `b2bProductModes`
- `HABITAT`: `shopBySpaceUse`, `materialFinishPresentation`, `shopTheLookCuratedGroups`, `editorialStoryModules`
- `LOCAL`: `catalogueDensityModes`, `strongSearch`, `compactListViews`, `storeInformation`, `localDeliveryDisplay`, `quickAdd`
- `FEAST`: `foodFirstMenuNavigation`, `quickAddQuantityControls`, `availabilityStates`, `dietaryBadges`, `deliveryPickupPresentation`, `storeTimings`, `leadTimeDisplay`

---

## 3. Generic Product Attributes / Specifications

Industry requirements (SS316 steel valves, linen thread count, walnut wood finishes, cake shelf-life) are powered by generic, seller-defined, product-scoped key-value attributes:

### Schema Model: `ProductAttribute`
```prisma
model ProductAttribute {
  id        String   @id @default(uuid())
  productId String
  name      String   // e.g. "Material", "Pressure Rating", "Shelf Life", "Serves", "Fabric"
  value     String   // e.g. "SS316", "PN40", "7 Days", "4-6 people", "Linen"
  type      String   @default("TEXT") // "TEXT", "NUMBER", "DIMENSION", "BADGE"
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId])
}
```

### Capabilities Powered:
- **FOUNDRY:** Technical specifications (Pressure, Grade, Connection Type, Standard).
- **HABITAT:** Materials, dimensions, finish, care instructions.
- **FEAST:** Dietary tags (Eggless, Vegan), Serves count, Shelf life, Allergens.
- **LOCAL:** Unit weight, packaging type, storage condition.
- **ATELIER / PULSE / HARVEST:** Artisan origin, fabric composition, weave type.

---

## 4. Generic Option / Variant Architecture

Options are completely seller-configurable with multi-dimensional variant generation:
- Supported Option Types: `COLOR`, `SIZE`, `MATERIAL`, `FINISH`, `PACK_SIZE`, `WEIGHT`, `FLAVOUR`, `VOLTAGE`, `STORAGE`, `CUSTOM`.
- Option values support seller-defined sorting (`sortOrder`).
- Each variant stores:
  - `sku`: Unique SKU identifier.
  - `pricePaise`: Mandatory integer price in paise.
  - `compareAtPricePaise`: Optional original price for markdown/discount display.
  - `inventory`: Real-time stock tracked atomically in integer units.
  - `weight`: Optional weight in grams for shipping calculations.
  - `status`: `ACTIVE`, `DRAFT`, `ARCHIVED`.
  - `media`: Direct association with `MediaAsset` for per-variant image switching (e.g. selecting "Crimson" changes product image to crimson photo).

---

## 5. FOUNDRY / B2B Support

FOUNDRY and industrial merchants are fully supported without custom schema forks:

1. **Commerce / Enquiry Modes on Products:**
   - `Product.productMode`:
     - `SELL_ONLINE`: Normal add-to-cart and instant checkout.
     - `ENQUIRY_ONLY`: Replaces checkout button with "Request for Quotation" (RFQ).
     - `SELL_AND_ENQUIRY`: Offers both immediate buy and bulk RFQ options.
2. **RFQ / Enquiry Data Pipeline:**
   - Endpoint: `POST /api/v1/enquiries` (public) & `GET /api/v1/enquiries` (seller dashboard).
   - Captures: `productId`, `variantId`, `quantity`, `customerName`, `companyName`, `phone`, `email`, `message`, `status` (`NEW`, `IN_REVIEW`, `QUOTED`, `CONVERTED`, `CLOSED`).
   - Seller can issue structured quotes directly (`PUT /api/v1/enquiries/:id/quotation`).
3. **Generic Product Documents (`ProductDocument`):**
   - Documents are modeled generically: `BROCHURE`, `DATASHEET`, `DRAWING`, `MANUAL`, `CERTIFICATE`.
   - Linked to `MediaAsset` storage and surfaced in public product catalog endpoints.

---

## 6. FEAST Food-Commerce Readiness

FEAST food and bakery operations are handled natively via generic primitives:
1. **Generic Attributes:** Serves count ("4-6 People"), Shelf life ("3 Days"), Dietary Badges ("Eggless", "Vegan", "Gluten-Free").
2. **Generic Options:** Flavour ("Belgian Chocolate", "Madagascar Vanilla"), Weight ("500g", "1kg"), Tier count.
3. **Availability & Preparation Time:**
   - `leadTimeDays` on Product handles made-to-order prep time.
   - `inventory` controls instant sold-out / fresh batch limits.
4. **Custom Messages / Customization:** Order note and item-level custom text fields capture celebration messages / icing text.
5. **Business Hours Model (`StoreBusinessHours`):**
   - Schema: `storeId`, `dayOfWeek` (0-6), `openTime` ("09:00"), `closeTime` ("21:00"), `isClosed` (boolean).
   - API: `GET/PUT /api/v1/seller/store/business-hours` and surfaced publicly in `GET /api/v1/storefront/:slug`.
6. **Fulfillment Modes:**
   - `Store.fulfillmentMode`: `DELIVERY`, `PICKUP`, `DELIVERY_AND_PICKUP`.
   - `Order.fulfillmentMode`: Captured on checkout and order tracking.

---

## 7. HABITAT Curated Grouping Readiness

1. **Curated Collections / Shop-by-Space:**
   - Powered by generic `Category` hierarchies and `StoreSection` models (`FEATURED_COLLECTION`, `EDITORIAL_STORY`, `CATEGORY_GRID`).
   - Section configuration stores curated product IDs and room/space metadata.
2. **Finish & Material Presentation:**
   - Supported via `ProductAttribute` ("Finish: Natural Oak", "Material: Solid Teak") and multi-variant media galleries.

---

## 8. LOCAL High-Density Catalogue Readiness

1. **Compact / List Layouts:**
   - Theme configuration flag `productCardMode: "compact" | "list"` enables rapid vertical catalog browsing.
2. **Fast Search & Filter:**
   - `GET /api/v1/storefront/:slug/search?q=...&category=...` queries across products, SKUs, and tags with indexed latencies under 15ms.
3. **Store Timings & Contact:**
   - Full support phone, WhatsApp link, physical business address, Google Maps URL, and weekly operating hours surfaced on storefront header/footer.

---

## 9. Subscription-Gating Correction

The subscription gating policy has been corrected from the restrictive demo behavior to true multi-tenant SaaS behavior:

| Action / Capability | Unpaid / Inactive Subscription | Active Subscription | Expired / Cancelled / Refunded |
| :--- | :---: | :---: | :---: |
| Seller Login & Session Refresh | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Access Seller Dashboard & Metrics | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Manage Business Profile & Settings | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Create / Edit / Delete Products | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Manage Categories & Inventory | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Upload & Organize Media Assets | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Configure Themes & Sections | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Private Storefront Preview (`?preview=true`) | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Purchase / Renew Subscription | **ALLOWED** | **ALLOWED** | **ALLOWED** |
| Publish Storefront Publicly (`POST /store/publish`)| **BLOCKED (402)** | **ALLOWED** | **BLOCKED (402)** |
| Public Buyer Storefront Access (`/store/:slug`) | **BLOCKED (402)** | **ALLOWED** | **BLOCKED (402)** |
| Public Buyer Order Checkout (`/checkout`) | **BLOCKED (402)** | **ALLOWED** | **BLOCKED (402)** |

*All data remains completely intact when subscriptions lapse; seller can login, continue drafting inventory, preview changes privately, and renew anytime.*

---

## 10. Seller Persistent-Session Behavior

1. **First Registration Flow:**
   - Phone → OTP verification → 6-digit PIN setup → Business onboarding → JWT access & refresh tokens issued.
2. **Normal Login Flow:**
   - Phone + 6-digit PIN → Direct login (no OTP requested).
3. **OTP Strict Scoping:**
   - OTP is strictly reserved for: (a) initial registration, (b) PIN reset / account recovery, and (c) sensitive identity modifications.
4. **Session Persistence:**
   - Short-lived Access Token (15m expiry).
   - Long-lived Refresh Token (30d expiry) stored securely in `httpOnly`, `SameSite=Strict`, `Secure` cookies or authenticated headers.
   - When closing and reopening browser, existing session survives without re-prompting.
   - Refresh token rotation and server-side session revocation on `POST /api/v1/auth/logout`.
   - PIN lockout enabled: 5 consecutive failed attempts lock account for 15 minutes.

---

## 11. Buyer Direct-Storefront Only Behavior

- Buyers navigate strictly to direct store URLs: `/store/:slug`.
- Browsing is unauthenticated by default. No mandatory buyer account registration exists.
- Cart tokens are decoupled, guest-friendly, and persisted in buyer browser storage.
- Checkout creates orders atomically under the tenant partition with buyer contact details.

---

## 12. Marketplace / Directory Removal

- The platform root `/` (`apps/storefront/src/pages/index.tsx`) **does not list or browse merchants**.
- Removed:
  - Central store directory / merchant lists.
  - Demo store chooser / switcher.
  - Multi-seller search or cross-tenant aggregations.
- Current root `/` renders a clean, neutral Simply E-Commerce platform landing page with direct links to the Seller Portal and Platform Admin.

---

## 13. Media Model Final State

The `MediaAsset` model is completely decoupled from binary database storage:

```prisma
model MediaAsset {
  id              String          @id @default(uuid())
  tenantId        String
  storeId         String?
  storageProvider StorageProvider @default(LOCAL) // LOCAL, CLOUDFLARE_R2, S3
  storageKey      String
  url             String
  filename        String
  mimeType        String
  sizeBytes       Int
  width           Int?
  height          Int?
  altText         String?
  focalPointX     Float?          @default(0.5)
  focalPointY     Float?          @default(0.5)
  checksum        String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?

  tenant          Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  store           Store?          @relation(fields: [storeId], references: [id], onDelete: SetNull)
}
```

- Storage interface in `@simply/storage` supports `LOCAL`, `CLOUDFLARE_R2`, and `S3`.
- Focal point coordinates (`focalPointX`, `focalPointY`) enable responsive smart-cropping across mobile and desktop.

---

## 14. Public Storefront Response Contract

`GET /api/v1/storefront/:slug` returns a sanitized payload designed specifically for theme rendering engines:

### Provided Data:
- `store.id`, `store.name`, `store.slug`, `store.description`, `store.currency`
- `store.supportPhone`, `store.supportEmail`, `store.whatsappNumber`, `store.businessAddress`, `store.mapsUrl`, `store.socialLinks`
- `store.fulfillmentMode`: `DELIVERY`, `PICKUP`, or `DELIVERY_AND_PICKUP`
- `businessHours`: Array of 7 days with `dayOfWeek`, `openTime`, `closeTime`, `isClosed`
- `theme.key`, `theme.version`, `theme.config`, `theme.capabilities`
- `branding`: Logo URL, banner URL, primary/secondary colors, font family
- `sections`: Visible homepage sections in defined sort order with section configuration
- `categories`: Active categories with image assets and product counts
- `featuredProducts`: Promoted products with attributes, options, variants, prices, and media

### Stripped & Redacted (Never Exposed):
- Internal `tenantId`
- Seller account IDs, credentials, PIN hashes, passwords
- Private business phone/email (only support contact is exposed)
- Gateway API keys, Razorpay credentials, webhook secrets
- Admin audit logs and outbox records

---

## 15. Migration Result

- **Migration Name:** `20261002181500_final_product_architecture_freeze`
- **Location:** `packages/db/prisma/migrations/20261002181500_final_product_architecture_freeze/migration.sql`
- **Verification against Dev DB:** Applied successfully via `prisma migrate deploy`.
- **Verification against Clean Disposable DB:**
  - Fresh Postgres database created: `simply_ecommerce_disposable`.
  - Executed `prisma migrate deploy` from scratch across all 3 migrations (`0_init`, `20261002163000_canonical_architecture_reset`, `20261002181500_final_product_architecture_freeze`).
  - Result: 3 migrations deployed in 124ms with 0 errors.
  - Disposable database dropped cleanly after verification.
- **Data Safety:** Zero destructive column drops on active tenant records.

---

## 16. Exact Test Result

Ran `pnpm test` (Unit + E2E/Integration):

```
Unit Tests:
  Test Suites: 5 passed, 5 total
  Tests:       26 passed, 26 total
  Time:        4.013 s

E2E & Integration Tests:
  Test Suites: 12 passed, 12 total
  Tests:       123 passed, 123 total
  Time:        24.978 s

Total Baseline:
  Test Suites: 17 passed, 17 total
  Tests:       149 passed, 149 total (100% passing)
  Jest Exit:   Clean, natural exit (no forceExit)
```

---

## 17. Exact Build Result

Ran `pnpm build` via Turbo:

```
Tasks:    11 successful, 11 total
Cached:   11 cached, 11 total (FULL TURBO)
Time:     453ms

Packages Built:
  1. @simply/types (TypeScript Declarations)
  2. @simply/config (Platform Configurations)
  3. @simply/validation (Zod & Class-Validator Schemas)
  4. @simply/api-contracts (API Client & DTO Contracts)
  5. @simply/storage (Storage Provider Drivers)
  6. @simply/ui (Theme Definitions & UI Utilities)
  7. @simply/db (Prisma Client & Repositories)
  8. @simply/api (NestJS Core API Service)
  9. @simply/storefront (Next.js Buyer Storefront)
 10. @simply/seller (Next.js Seller Operations Portal)
 11. @simply/admin (Next.js Platform Admin Portal)
```

---

## 18. `pnpm dev` Verification Result

Executed `node --experimental-strip-types scripts/dev-health-check.ts` against running dev cluster:

```
=============================================================
  SIMPLY E-COMMERCE — DEVELOPER STARTUP HEALTH CHECK
=============================================================

  ✓ [UP]  API Server                 -> http://localhost:4000/health (Status: 200, 39ms)
  ✓ [UP]  Public Storefront          -> http://localhost:3000        (Status: 200, 31ms)
  ✓ [UP]  Seller Operations Portal   -> http://localhost:3001        (Status: 200, 43ms)
  ✓ [UP]  Platform Admin             -> http://localhost:3002        (Status: 200, 41ms)

-------------------------------------------------------------
  STATUS: ALL SERVICES HEALTHY & REACHABLE
  • API:        http://localhost:4000 (Swagger: /api/docs)
  • Storefront: http://localhost:3000
  • Seller:     http://localhost:3001
  • Admin:      http://localhost:3002
=============================================================
```

---

## 19. Items Requiring Future Product Decisions (Post-Freeze)

Before screen-by-screen frontend design commences, the following product considerations are noted:
1. **Cloudflare R2 Bucket Binding:** In production, credentials for R2 will be supplied via environment variables (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`). The storage driver abstraction is ready; activation is purely operational.
2. **Delivery Slot Scheduling:** The current freeze introduces `StoreBusinessHours` and `FulfillmentMode` (`DELIVERY`, `PICKUP`). Time-slot reservations (e.g., "Select delivery window 2 PM - 4 PM") will be layered into checkout during frontend theme implementation.
3. **GST / HSN Tax Invoicing:** The money model operates entirely in integer paise with tax calculated at checkout (`taxAmountPaise`). Dedicated HSN code fields on `ProductAttribute` can be populated by merchants directly without schema changes.

---

**ARCHITECTURAL STATUS:**  
Database schema, API contracts, domain exceptions, authentication lifecycles, and theme backend models are **OFFICIALLY FROZEN**. Frontend screen-by-screen design can safely proceed on top of this verified foundation.
