# SIMPLY E-COMMERCE — THEME BACKEND CONTRACT SPECIFICATION

**Version:** 1.0.0 (Architecture Frozen)  
**Status:** Canonical Source of Truth for Storefront Theme Renderer  
**Target Environment:** Multi-Tenant Next.js Storefront Engine  

---

## 1. Architectural Overview

Simply E-Commerce storefront themes are **pure configuration-driven presentation layers** that execute on top of generic backend data models. 

### Core Design Rules
1. **Zero Database Polymorphism:** There are no "jewellery tables", "bakery tables", or "industrial tables". All themes render generic primitives: `Product`, `ProductVariant`, `ProductOption`, `ProductAttribute`, `ProductDocument`, `StoreSection`, and `StoreBusinessHours`.
2. **Deterministic Contract:** The public storefront API (`GET /api/v1/storefront/:slug`) delivers a standardized JSON envelope containing identity, branding, active theme definition, theme configuration, sections, business hours, and normalized products.
3. **No Hardcoded Stock Assets:** All imagery is seller-owned or fallback placeholder icons. No mock merchant branding is baked into the theme definitions.

---

## 2. Canonical 7 Theme Definitions

| Key | Name | Visual Archetype | Best Industry Fit |
| :--- | :--- | :--- | :--- |
| **`ATELIER`** | Atelier | Quiet Luxury Editorial | Fine jewellery, haute couture, luxury leather, bespoke timepieces, niche perfumery |
| **`PULSE`** | Pulse | Bold High-Energy Contemporary | Streetwear, activewear, modern electronics, creator merchandise, sneaker culture |
| **`HARVEST`** | Harvest | Warm Organic Artisan | Specialty food, organic produce, farm provisions, handmade pottery, ethical goods |
| **`FOUNDRY`** | Foundry | Professional Technical B2B | Industrial manufacturing, valves & pumps, electrical equipment, lab supplies, hardware |
| **`HABITAT`** | Habitat | Spatial Lifestyle / Interior | Furniture, architectural lighting, rugs & textiles, home accessories, fixtures |
| **`LOCAL`** | Local | High-Density Retail Catalogue | Neighbourhood retail, daily provisions, hardware stores, stationery, pharmacies |
| **`FEAST`** | Feast | Food-First Sensory Commerce | Bakeries, patisseries, artisanal sweets, cloud kitchens, chocolate ateliers, catering |

---

## 3. Common Theme Capabilities & Configuration

Every theme definition guarantees full support for these 16 common capability slots:

```json
{
  "common": [
    "logo",
    "brandColors",
    "typographyPreset",
    "heroMode",
    "heroMedia",
    "categoryMedia",
    "collectionMedia",
    "productMedia",
    "variantMedia",
    "sectionVisibility",
    "sectionOrdering",
    "productCardMode",
    "imageRatio",
    "backgroundTreatment",
    "buttonStyle",
    "motionLevel"
  ]
}
```

### Common Theme Configuration Schema
```json
{
  "tagline": "String summary of the store identity",
  "palette": {
    "primary": "#1C1917",
    "accent": "#D4AF37",
    "background": "#FAFAF9",
    "surface": "#FFFFFF",
    "text": "#1C1917",
    "muted": "#78716C"
  },
  "typography": {
    "heading": "Playfair Display | Cabinet Grotesk | DM Serif Display | Space Grotesk | Cinzel | Inter",
    "body": "Plus Jakarta Sans | Inter | Roboto"
  },
  "headerStyle": "minimal-center | sticky-action | warm-friendly | industrial-meta | spacious-lifestyle | quick-search-bar",
  "heroStyle": "split-editorial | full-banner | organic-showcase | technical-hero | lifestyle-immersive | product-mosaic",
  "cardStyle": "framed-luxury | elevated-modern | rounded-soft | spec-sheet-card | minimal-bleed | high-density-buy",
  "buttonStyle": "sharp-pill | rounded-heavy | pill-friendly | square-solid | underline-refined | quick-add",
  "imageRatio": "3/4 | 1/1 | 4/3 | 4/5 | 16/9",
  "spacingDensity": "generous | compact | comfortable | dense | airy",
  "motionLevel": "none | subtle | dynamic"
}
```

---

## 4. Theme-Specific Specialized Capabilities

### 1. `ATELIER`
- `editorialLuxuryLayouts`: Generous whitespace, asymmetric grids, luxury lookbook spreads.
- `largeImagery`: High-resolution focal image display (3:4 ratio) with monogram fallbacks.
- `typographyFirstFallback`: Elegant serif typography rendering when seller has not uploaded banner imagery.
- `productMosaicFallback`: Staggered editorial gallery fallback for collections.
- `hallmarkBanner`: Dedicated trust banner for hallmark certifications and purity guarantees.

### 2. `PULSE`
- `campaignHero`: Split-screen launch heroes with countdown and drop announcements.
- `productLaunchHero`: Video or motion hero with direct CTA.
- `productMosaic`: High-density visual wall for apparel drops and footwear collections.
- `quickAdd`: Instant size/variant drawer opening directly from product card.
- `higherVisualDensity`: Multi-column fast browsing designed for mobile-first shoppers.

### 3. `HARVEST`
- `warmStoryModules`: Narrative-driven "Our Story", "Origin of Ingredients", "Farm-to-Table" sections.
- `processStorySections`: Step-by-step visual craftsmanship workflows.
- `quickAdd`: Friendly incremental quantity adjustments on cards.
- `organicTactilePresentation`: Earthy background treatments, warm badge accents, hand-drawn motifs.

### 4. `FOUNDRY`
- `technicalSpecifications`: Table-format parametric specification displays (`Material`, `Pressure`, `Voltage`).
- `rfqEnquiry`: Native "Request Quotation" modal bypassing standard retail checkout.
- `productDocumentsDownloads`: Downloadable datasheets, CAD drawings, manuals, and ISO certificates.
- `industriesServed`: Client logos and industrial sector tagging modules.
- `certifications`: Compliance badge grid (ISO 9001, CE, RoHS, BIS).
- `productModes`: Direct support for `SELL_ONLINE`, `ENQUIRY_ONLY`, and `SELL_AND_ENQUIRY`.

### 5. `HABITAT`
- `shopBySpaceUse`: Browse by room/application (Living Room, Workspace, Patio, Dining).
- `materialFinishPresentation`: Material swatch selectors (Solid Teak, Walnut, Brushed Brass, Boucle).
- `shopTheLookCuratedGroups`: Coordinated room vignettes linking multiple buyable products.
- `editorialStoryModules`: Architecture and interior designer spotlights.

### 6. `LOCAL`
- `strongSearch`: Instant typeahead search bar permanently docked in the header.
- `catalogueDensityModes`: Grid, List, and Compact SKU table views for high item counts.
- `quickAdd`: Zero-modal one-click "+ Add" button with live +/- quantity counter.
- `storeInformation`: Prominent physical shop address, distance calculation, and store operating hours.
- `localDeliveryDisplay`: Real-time delivery radius and estimated pickup readiness badges.

### 7. `FEAST`
- `foodFirstMenuNavigation`: Horizontal sticky category bar (Cakes, Pastries, Artisanal Breads, Hampers).
- `quickAddQuantityControls`: Direct on-card stepper buttons (`+` / `-`).
- `availabilityStates`: Real-time availability badges (Freshly Baked, Made-to-Order, Sold Out Today).
- `deliveryPickupPresentation`: Pickup slot vs. Local Doorstep Delivery toggle.
- `productCustomizationOptions`: Free-text message inputs (e.g. "Happy 30th Birthday Sohan").
- `giftOccasionModules`: Gift box packaging, handwritten card add-ons.
- `storeTimings`: Today's kitchen opening hours and next order cutoff display.
- `foodSpecificDisplayMetadata`: Shelf life, dietary badges (Eggless, Vegan, Gluten-Free), serves count.

---

## 5. Generic Product Specifications Architecture

To power `FOUNDRY` technical specs, `HABITAT` materials, and `FEAST` food metadata without modifying the database schema, all product specifications use `ProductAttribute`:

```typescript
interface ProductAttribute {
  id: string;
  productId: string;
  name: string;        // "Material", "Pressure", "Fabric", "Serves", "Shelf Life"
  value: string;       // "SS316", "PN40", "100% Linen", "4 Persons", "7 Days"
  type: string;        // "TEXT", "NUMBER", "BADGE", "DIMENSION", "BOOLEAN"
  sortOrder: number;   // Deterministic display order
}
```

### Industry Examples Powered by `ProductAttribute`:
- **Industrial (`FOUNDRY`):**
  - `Material` -> `SS316 Stainless Steel`
  - `Pressure Rating` -> `PN40 / 40 Bar`
  - `Connection` -> `Flanged ANSI 150`
  - `Operating Temp` -> `-20°C to +200°C`
- **Furniture (`HABITAT`):**
  - `Material` -> `Kiln-Dried Teak Wood`
  - `Finish` -> `Natural Matte Wax`
  - `Dimensions` -> `180cm x 90cm x 75cm`
  - `Assembly` -> `Pre-Assembled`
- **Bakery & Food (`FEAST`):**
  - `Dietary` -> `100% Eggless`
  - `Serves` -> `6 to 8 Portions`
  - `Shelf Life` -> `3 Days Refrigerated`
  - `Storage` -> `Keep between 2°C - 5°C`
- **Luxury Fashion (`ATELIER`):**
  - `Fabric` -> `Mulberry Silk 22 Momme`
  - `Origin` -> `Handwoven in Varanasi`
  - `Care` -> `Dry Clean Only`

---

## 6. Generic Product Documents (`FOUNDRY`)

```typescript
interface ProductDocument {
  id: string;
  title: string;       // "Technical Datasheet 2026", "CE Declaration of Conformity"
  docType: string;     // "BROCHURE" | "DATASHEET" | "DRAWING" | "MANUAL" | "CERTIFICATE"
  fileUrl: string;     // "https://cdn.simplyecommerce.in/docs/valve-ss316.pdf"
  fileSizeMb?: number; // 2.4
  sortOrder: number;
}
```

---

## 7. Store Business Hours & Physical Info (`LOCAL` & `FEAST`)

```typescript
interface StoreBusinessHours {
  id: string;
  dayOfWeek: number;   // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  openTime: string;    // "09:00"
  closeTime: string;   // "21:00"
  isClosed: boolean;   // true if closed all day
}

type FulfillmentMode = "DELIVERY" | "PICKUP" | "DELIVERY_AND_PICKUP";
```

---

## 8. Storefront Public API Contract

### Request: `GET /api/v1/storefront/:slug`
**Optional Headers:** `Authorization: Bearer <seller_token>` (for private seller preview)  
**Optional Query:** `?previewSecret=<store_preview_secret>`

### Response Payload Envelope:
```json
{
  "success": true,
  "data": {
    "store": {
      "id": "s1000000-0000-0000-0000-000000000001",
      "name": "Aurelia Atelier",
      "slug": "aurelia-atelier",
      "description": "Bespoke handcrafted jewellery and bridal heirlooms.",
      "status": "LIVE",
      "defaultCurrency": "INR",
      "timezone": "Asia/Kolkata",
      "supportPhone": "+919820011223",
      "supportEmail": "concierge@aureliaatelier.in",
      "whatsappNumber": "+919820011223",
      "businessAddress": "14 Colaba Causeway, Mumbai, MH 400001",
      "mapsUrl": "https://maps.google.com/?q=Aurelia+Colaba",
      "socialLinks": {
        "instagram": "https://instagram.com/aureliaatelier",
        "facebook": "https://facebook.com/aureliaatelier"
      },
      "fulfillmentMode": "DELIVERY_AND_PICKUP",
      "businessHours": [
        { "dayOfWeek": 1, "openTime": "10:00", "closeTime": "20:00", "isClosed": false },
        { "dayOfWeek": 2, "openTime": "10:00", "closeTime": "20:00", "isClosed": false },
        { "dayOfWeek": 0, "openTime": "00:00", "closeTime": "00:00", "isClosed": true }
      ]
    },
    "branding": {
      "logoUrl": "https://cdn.simplyecommerce.in/media/logo.png",
      "faviconUrl": "https://cdn.simplyecommerce.in/media/favicon.ico",
      "primaryColor": "#1C1917",
      "accentColor": "#D4AF37",
      "fontHeading": "Playfair Display",
      "fontBody": "Plus Jakarta Sans",
      "announcement": "Complimentary insured domestic shipping on all orders."
    },
    "theme": {
      "key": "ATELIER",
      "name": "Atelier",
      "version": "1.0.0",
      "configuration": {
        "tagline": "Quiet luxury editorial",
        "headerStyle": "minimal-center",
        "heroStyle": "split-editorial",
        "cardStyle": "framed-luxury",
        "buttonStyle": "sharp-pill",
        "imageRatio": "3/4",
        "spacingDensity": "generous",
        "motionLevel": "subtle"
      },
      "capabilities": {
        "common": ["logo", "brandColors", "typographyPreset", "heroMode", "heroMedia", "..."],
        "specialized": ["editorialLuxuryLayouts", "largeImagery", "typographyFirstFallback", "..."]
      }
    },
    "sections": [
      {
        "id": "sec-1",
        "sectionType": "hero",
        "title": "Autumn Lookbook 2026",
        "position": 0,
        "isEnabled": true,
        "configuration": {
          "headline": "Sculpted In Light",
          "subheadline": "The 2026 High Jewellery Collection",
          "mediaKey": "media_hero_123.jpg",
          "ctaText": "Explore Collection",
          "ctaLink": "/store/aurelia-atelier/categories/fine-jewellery"
        }
      }
    ],
    "categories": [
      {
        "id": "cat-1",
        "name": "Fine Jewellery",
        "slug": "fine-jewellery",
        "description": "Handcrafted 18k and 22k gold heirloom pieces.",
        "mediaAssetId": "media_cat_123"
      }
    ],
    "products": [
      {
        "id": "prod-1",
        "name": "Astral Diamond Solitaire Pendant",
        "slug": "astral-diamond-solitaire-pendant",
        "description": "Brilliant cut VS1 solitaire diamond set in 18k ethical gold.",
        "mode": "SELL_ONLINE",
        "attributes": [
          { "name": "Gold Purity", "value": "18k Yellow Gold", "type": "BADGE", "sortOrder": 0 },
          { "name": "Diamond Clarity", "value": "VS1 E-Color", "type": "TEXT", "sortOrder": 1 },
          { "name": "Certificate", "value": "IGI Certified", "type": "BADGE", "sortOrder": 2 }
        ],
        "documents": [],
        "media": [
          {
            "id": "med-1",
            "publicUrl": "https://cdn.simplyecommerce.in/media/astral-1.jpg",
            "altText": "Astral Solitaire front angle",
            "sortOrder": 0
          }
        ],
        "options": [
          {
            "id": "opt-1",
            "name": "Gold Color",
            "values": [
              { "id": "val-1", "value": "Yellow Gold", "colorHex": "#E5B80B" },
              { "id": "val-2", "value": "Rose Gold", "colorHex": "#B76E79" }
            ]
          }
        ],
        "variants": [
          {
            "id": "var-1",
            "sku": "ASTR-SOL-YG",
            "pricePaise": 14500000,
            "compareAtPricePaise": 16000000,
            "weightGrams": 8,
            "inventory": { "stockOnHand": 5, "stockReserved": 0 },
            "optionValues": [{ "optionValue": { "value": "Yellow Gold" } }]
          }
        ]
      }
    ],
    "isPreview": false
  },
  "timestamp": "2026-10-02T18:30:00.000Z"
}
```

---

## 9. Public Error State Contract

All public error responses follow the standard `@simply/api-contracts` envelope:

| Error Code | HTTP Status | User Message & Meaning |
| :--- | :--- | :--- |
| **`STORE_NOT_FOUND`** | 404 | The requested merchant store does not exist. |
| **`STORE_NOT_LIVE`** | 403 | The merchant has not published this store to the public. |
| **`STORE_PRIVATE`** | 403 | Store is set to private preview mode. |
| **`SUBSCRIPTION_REQUIRED`** | 402 | Store is inactive due to missing or expired SaaS subscription. |
| **`API_UNAVAILABLE`** | 503 | Backend service is in maintenance or unavailable. |
| **`NETWORK_OFFLINE`** | N/A (Client) | Client network connection is lost. |
| **`INTERNAL_ERROR`** | 500 | Unhandled internal server error (never exposes stack traces). |
