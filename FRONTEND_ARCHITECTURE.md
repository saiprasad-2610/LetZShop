# SIMPLY E-COMMERCE — FRONTEND ARCHITECTURE SPECIFICATION

**Document Version:** 1.0.0  
**Status:** Approved Frontend Foundation  
**Target Environments:** Next.js 14 (Pages/App Hybrid), TypeScript 5.7, TailwindCSS 3.4

---

## 1. Product Surfaces & Route Ownership

Simply E-Commerce separates user intent into **FOUR distinct product surfaces**. Each surface runs in its own dedicated application context and maintains clear boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SIMPLY E-COMMERCE ROUTE MAP                           │
├───────────────────┬───────────────────────────────┬─────────────────────────┤
│ Surface           │ Route / Host                  │ Responsibility          │
├───────────────────┼───────────────────────────────┼─────────────────────────┤
│ A. Platform Site  │ :3000 /                       │ Public SaaS Marketing   │
│ B. Seller App     │ :3001 /                       │ Merchant Workspace      │
│ C. Storefront     │ :3000 /store/:slug            │ Merchant Direct Store   │
│ D. Platform Admin │ :3002 /                       │ Internal AIKYAM Ops     │
└───────────────────┴───────────────────────────────┴─────────────────────────┘
```

### 1.1 Route Ownership Invariants
1. **The Root Route `/` Is Not a Merchant Directory:**
   - In accordance with architectural freeze item 12, the storefront root `/` belongs to the **Simply Platform Website (Surface A)**.
   - It does **not** list random stores, provide a global multi-seller search, or act as a marketplace aggregator.
2. **Merchant Storefronts Live Under `/store/:slug`:**
   - Direct-to-consumer commerce takes place strictly at `/store/:slug` and nested subpaths (`/store/:slug/product/:id`, `/store/:slug/cart`, `/store/:slug/checkout`, `/store/:slug/order/:orderNumber`).
   - The merchant's domain (or subpath) delivers their complete branded store experience.
3. **Dedicated Port & Subdomain Boundaries:**
   - In development:
     - API: `http://localhost:4000`
     - Storefront & Platform Site: `http://localhost:3000`
     - Seller Portal: `http://localhost:3001`
     - Admin Portal: `http://localhost:3002`
   - In production, these map to:
     - `https://simplyecommerce.in` (Platform Website)
     - `https://seller.simplyecommerce.in` (Seller Workspace)
     - `https://admin.simplyecommerce.in` (Platform Admin)
     - `https://simplyecommerce.in/store/:slug` or custom merchant domains (Buyer Storefront)

---

## 2. Theme Renderer Architecture

The storefront presentation layer executes on top of the generic backend schema. 

### 2.1 Critical Architectural Rule: Zero Universal "One-Template-Fits-All"
We avoid forcing all 7 themes through a single universal component with different CSS stylesheets. 
Each theme archetype has its own structural requirements:
- `FOUNDRY` requires parametric spec tables, RFQ buttons, and downloadable datasheet links.
- `FEAST` requires sticky food-category navigation, freshness badges, on-card `+`/`-` quantity steppers, and dietary tags.
- `ATELIER` requires asymmetric whitespace, high-resolution portrait imagery, and typography-first fallbacks.
- `LOCAL` requires compact SKU table/list modes and prominent physical shop hours.

### 2.2 Layered Rendering Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                   StorefrontRenderer                   │
│        (Data resolution, error boundaries, SEO)        │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐
│  ThemeRenderer   │               │ Shared Commerce  │
│  (Theme-Specific)│               │    Primitives    │
└────────┬─────────┘               └──────────────────┘
         │                                   │
         ├─▶ AtelierRenderer                 ├─▶ Price (minor-unit paise)
         ├─▶ PulseRenderer                   ├─▶ VariantSelector
         ├─▶ HarvestRenderer                 ├─▶ QuantityStepper
         ├─▶ FoundryRenderer                 ├─▶ CartLogic (guest storage)
         ├─▶ HabitatRenderer                 ├─▶ CheckoutLogic
         ├─▶ LocalRenderer                   ├─▶ InventoryState
         └─▶ FeastRenderer                   ├─▶ TrackingResolver
                                             └─▶ SmartImage
```

### 2.3 Theme-Specific Visual Components
While commerce primitives (price calculation, inventory check, cart management) are shared, visual components are theme-specific:
- **Product Cards:**
  - `AtelierProductCard`: Framed luxury card, 3:4 portrait ratio, subtle price typography, minimal badges.
  - `PulseProductCard`: High-energy square card, quick-add variant drawer, launch badges.
  - `FoundryProductCard`: Spec-sheet card, technical attribute table, "Request Quote" mode, datasheet download.
  - `FeastProductCard`: Food-commerce product card supporting bakeries, cakes, mithai, sweets, chocolate, cafés, beverages, savoury food, snacks, gourmet provisions, meal boxes, cloud kitchens, and food gifting with dietary badges (Eggless/Vegan), serves count, and inline `+`/`-` stepper.
  - `HabitatProductCard`: Lifestyle vignette card, room-use tags, material swatch chips.
  - `LocalProductCard`: High-density compact row/card with live stock badge and one-click add.
  - `HarvestProductCard`: Organic artisan card with origin story tag and warm borders.

### 2.4 Theme Renderer Interface Contract
```typescript
export interface ThemeRendererProps {
  store: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    currency: string;
    supportPhone?: string | null;
    supportEmail?: string | null;
    whatsappNumber?: string | null;
    businessAddress?: string | null;
    mapsUrl?: string | null;
    fulfillmentMode: 'DELIVERY' | 'PICKUP' | 'DELIVERY_AND_PICKUP';
  };
  theme: {
    key: 'ATELIER' | 'PULSE' | 'HARVEST' | 'FOUNDRY' | 'HABITAT' | 'LOCAL' | 'FEAST';
    config: ThemeContractConfig;
    capabilities: ThemeCapabilities;
  };
  branding: {
    logoUrl?: string | null;
    bannerUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
  };
  businessHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  sections: StoreSectionDto[];
  categories: CategoryDto[];
  featuredProducts: ProductDto[];
  isPreview?: boolean;
}
```

---

## 3. Theme Configuration Contract

Mapped directly from `THEME_BACKEND_CONTRACT.md`. All themes support 16 common slots plus specialized capabilities:

```typescript
export interface ThemeContractConfig {
  tagline?: string;
  palette: {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border?: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  headerStyle:
    | 'minimal-center'
    | 'sticky-action'
    | 'warm-friendly'
    | 'industrial-meta'
    | 'spacious-lifestyle'
    | 'quick-search-bar';
  heroStyle:
    | 'split-editorial'
    | 'full-banner'
    | 'organic-showcase'
    | 'technical-hero'
    | 'lifestyle-immersive'
    | 'product-mosaic';
  cardStyle:
    | 'framed-luxury'
    | 'elevated-modern'
    | 'rounded-soft'
    | 'spec-sheet-card'
    | 'minimal-bleed'
    | 'high-density-buy';
  buttonStyle:
    | 'sharp-pill'
    | 'rounded-heavy'
    | 'pill-friendly'
    | 'square-solid'
    | 'underline-refined'
    | 'quick-add';
  imageRatio: '3/4' | '1/1' | '4/3' | '4/5' | '16/9';
  spacingDensity: 'generous' | 'compact' | 'comfortable' | 'dense' | 'airy';
  backgroundTreatment: 'clean' | 'warm-tint' | 'cool-slate' | 'editorial-subtle' | 'high-contrast';
  motionLevel: 'none' | 'subtle' | 'dynamic';
}
```

---

## 4. Reusable Image Architecture (`SmartImage`)

Images are critical to perceived quality. The `SmartImage` component ensures high performance, zero layout shift, and future CDN compatibility.

```
┌────────────────────────────────────────────────────────┐
│                   SmartImage Wrapper                   │
│        (Aspect ratio reservation: padding/CSS)         │
├────────────────────────────────────────────────────────┤
│  [ Skeleton Blur / Fallback ] ──▶ [ High-Res Image ]  │
│  • Lazy loading (Intersection)   • Focal Point Crop    │
│  • Native fetchpriority="high"   • Aspect Ratio Lock   │
│  • Graceful SVG fallback icon    • Error state capture │
└────────────────────────────────────────────────────────┘
```

### 4.1 Image Specification
- **Responsive Sizing:** Uses `srcset` and `sizes` attributes for optimal screen-density delivery.
- **Lazy Loading by Default:** All catalog and thumbnail images use `loading="lazy"`. Above-the-fold hero images set `priority={true}` or `loading="eager"` with `fetchpriority="high"`.
- **Aspect Ratio Container:** Containers explicitly define `aspect-ratio` (`1/1`, `3/4`, `4/3`, `4/5`, `16/9`) so space is reserved prior to image load. Aspect-ratio reservation minimizes/prevents image-induced layout shift. Actual Core Web Vitals (including CLS) will be measured and benchmarked during visual implementation.
- **Focal Point Smart-Crop:** Incorporates `focalPointX` and `focalPointY` coordinates from `MediaAsset` to apply `object-position: ${focalPointX * 100}% ${focalPointY * 100}%`.
- **Blur / Shimmer Loading State:** Uses a neutral shimmering skeleton while the image streams.
- **Error State & Fallback:** If an image fails to load or URL is absent, displays a tasteful themed icon placeholder with product title instead of a broken image icon.
- **Future CDN Compatibility:** Architecture accepts a transformation pipeline helper `getOptimizedImageUrl(src, { width, quality, format })` ready for Cloudflare Images or R2 image resizers without changing component call sites.

---

## 5. Responsive Breakpoint Strategy

We employ a 4-tier responsive breakpoint scale tailored to mobile-first commerce:

| Breakpoint | Viewport Width | Typical Hardware | Primary UX Strategy |
| :--- | :--- | :--- | :--- |
| `mobile` | `< 640px` | Phones (iPhone, Pixel, Samsung) | Single-thumb navigation, bottom sheets, sticky CTAs |
| `tablet` | `640px - 1023px`| Tablets, foldables | 2-column catalog grids, collapsible sidebars |
| `desktop` | `1024px - 1439px`| Laptops, standard monitors | Split screen previews, contextual slide-over drawers |
| `wide` | `>= 1440px` | High-res desktop displays | Maximum container caps (`max-w-7xl`), generous margins |

### 5.1 Seller Responsive Behavior
- **Mobile (`< 640px`):** Bottom navigation bar for primary tabs (Home, Products, Orders, Brand, Settings). Product and order editors render as full-screen sliding sheets.
- **Desktop (`>= 1024px`):** Fixed left navigation rail, expanded command bar, and side-by-side persistent storefront preview pane.

---

## 6. Accessibility Foundation (WCAG 2.1 AA)

All Simply E-Commerce surfaces adhere to WCAG 2.1 Level AA compliance:
1. **Semantic HTML:** Correct landmark tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
2. **Keyboard Navigation:** Every interactive element is reachable via `Tab` and actionable via `Enter` / `Space`. No focus traps outside active modal dialogs.
3. **Focus Rings:** Distinct, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`).
4. **Color Contrast:** All body text meets at least `4.5:1` contrast ratio against its background. The `packages/ui` contrast validator checks merchant palette choices.
5. **Form Accessibility:** All inputs feature explicit `<label>` associations or `aria-label`, programmatic error announcements (`aria-invalid="true"`, `aria-describedby`), and clear helper text.
6. **Touch Targets:** Minimum touch target size of `44px × 44px` on all mobile clickable surfaces.
7. **Screen Reader Feedback:** Dynamic state changes (cart count update, order placed, stock error) announce via `aria-live="polite"` or `role="alert"`.

---

## 7. Frontend State Model & Boundaries

State is partitioned strictly across 5 well-defined layers to prevent synchronization drift:

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND STATE MODEL                 │
└────────────────────────────────────────────────────────┘
  1. SERVER STATE        ──▶  API Cache (SWR / React Query)
  2. AUTH STATE          ──▶  Secure Seller Session (JWT + Rotating Refresh)
  3. FORM STATE          ──▶  Local Component State (Controlled Inputs)
  4. CART STATE          ──▶  Guest Storage (LocalStorage + API Token)
  5. THEME PREVIEW STATE ──▶  Brand Studio In-Memory Draft
```

### 7.1 State Partition Rules
- **Server State:** Never copy server data into random global state stores. Rely on query caches with deterministic invalidation keys.
- **Auth State:** Token refresh lifecycle runs automatically in an HTTP client interceptor. When access token expires (15m), refresh-token rotation is genuinely executed via `POST /api/v1/auth/session/refresh` (in `auth.service.ts:703-785`, rotating a 40-byte cryptographic random token and revoking previous tokens atomically in a database transaction with SHA-256 hash persistence).
- **Cart State:** Guest carts store only `cartToken`. Quantities, item prices, discounts, and totals are computed exclusively by the server.
- **Theme Preview State:** In Brand Studio, unsaved theme modifications exist in local component state. They only update server records when the seller clicks *"Save Design"* or *"Publish"*.

---

## 8. Human-Facing Error Experience

The frontend intercepts raw backend errors and translates them into plain, actionable human language.

### 8.1 Forbidden Error Messages
Under **NO circumstances** may the frontend display:
- ❌ *"Failed to fetch"*
- ❌ *"NetworkError"*
- ❌ *"PrismaClientKnownRequestError"*
- ❌ *"Internal Server Error 500"*
- ❌ NestJS stack traces or database table names

### 8.2 Canonical Human Error Mapping

| API Error Code | Human UI Title | Actionable Recovery Explanation | Primary Action |
| :--- | :--- | :--- | :--- |
| `API_UNAVAILABLE` | *"We couldn't connect right now"* | *"We couldn't connect right now. Please try again."* | `[ Try Again ]` |
| `STORE_NOT_FOUND` | *"Store not found"* | *"This store link may be incorrect or the merchant has updated their store address. Please check the URL provided by the merchant."* | `[ Check Store Link ]` or `[ Go to Simply Home ]` |
| `STORE_PRIVATE` | *"Store is currently private"* | *"The merchant is currently updating their catalogue. Please check back soon."* | `[ Contact Store ]` |
| `SUBSCRIPTION_REQUIRED` | *"Storefront currently offline"* | *(Seller view)*: *"Your store is hidden from the public because your subscription is inactive."* | `[ Renew Subscription ]` |
| `PRODUCT_OUT_OF_STOCK` | *"Item just sold out"* | *"Another shopper purchased the last available unit of this item."* | `[ Choose Another Option ]` |
| `PIN_INVALID` | *"Incorrect PIN"* | *"Please check your 4 to 6 digit security PIN and try again."* | `[ Forgot PIN? ]` |
| `PIN_LOCKED` | *"Account temporarily locked"* | *"Too many incorrect PIN attempts. For security, please wait 15 minutes."* | `[ Reset Access via OTP ]` |
| `OTP_EXPIRED` | *"Verification code expired"* | *"The 6-digit code has expired. We can send you a fresh one right away."* | `[ Resend Code ]` |

---

## 9. Design Tokens: Platform UI vs Merchant Themes

Tokens are strictly bifurcated:

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│        PLATFORM UI TOKENS            │  │        MERCHANT THEME TOKENS         │
│  (Platform Site, Seller, Admin)      │  │        (Buyer Storefronts)           │
├──────────────────────────────────────┤  ├──────────────────────────────────────┤
│ • Fixed system font (Inter/Jakarta)  │  │ • Merchant-selected typography       │
│ • Deterministic neutral scale        │  │ • Merchant-selected color palette    │
│ • Fixed 8px spatial grid             │  │ • Theme-defined density (airy/dense) │
│ • Standardized form radii            │  │ • Theme-defined button & card styles │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

Platform UI uses standard, predictable tokens for productivity and speed. Merchant themes have complete visual freedom within the bounds of `ThemeContractConfig` to express their unique brand archetype.

---

## 10. Next Steps: First Implementation Batch

The screen map and foundation are now frozen. Implementation will proceed in modular, approved batches:

### First Implementation Batch (Screens 01 to 07):
1. **Screen 01:** Platform Website Landing Page (`apps/storefront/src/pages/index.tsx`)
2. **Screen 02:** Seller Mobile Entry / Registration (`apps/seller/src/pages/login.tsx`)
3. **Screen 03:** OTP Verification Step
4. **Screen 04:** PIN Setup Step
5. **Screen 05:** Returning Seller PIN Login
6. **Screen 06:** Business Setup & Store Basics
7. **Screen 07:** Choose Store Design (7 Theme Archetypes)

*All visual designs will be reviewed and approved screen-by-screen before final implementation.*
