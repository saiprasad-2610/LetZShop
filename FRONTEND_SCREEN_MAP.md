# SIMPLY E-COMMERCE — COMPLETE FRONTEND SCREEN MAP

**Document Version:** 1.0.0  
**Status:** Approved Master Screen Inventory  
**Total Screens:** 66 Screens across 4 Surfaces  
**Baseline Verification:** Aligned with frozen API contracts, database architecture, and theme definitions.

---

## Screen Inventory Overview

| Surface | Screen Range | Screen Count | Primary Audience |
| :--- | :--- | :--- | :--- |
| **Surface A: Platform Website** | Screens 01 – 12 | 12 Screens | Prospective Merchants & Public |
| **Surface B: Seller Auth & Onboarding** | Screens 13 – 22 | 10 Screens | New & Returning Business Owners |
| **Surface B: Seller Application** | Screens 23 – 42 | 20 Screens | Active Merchants & Store Managers |
| **Surface C: Buyer Storefront** | Screens 43 – 55 | 13 Screens | Shoppers & Wholesale Buyers |
| **Surface D: Platform Admin** | Screens 56 – 66 | 11 Screens | AIKYAM Platform Operators |
| **TOTAL** | **Screens 01 – 66** | **66 Screens** | **Complete Ecosystem** |

---

## PART 1: PLATFORM WEBSITE (SCREENS 01 – 12)

### Screen 01: Landing Page
- **Purpose:** Introduce Simply E-Commerce, communicate the direct-commerce proposition, showcase the 7 store archetypes, and drive seller acquisition.
- **Primary User:** Independent business owners, artisans, manufacturers, retailers, and prospective merchants.
- **Entry Point:** Platform root URL (`/` on platform domain).
- **API Dependencies:** None (static high-performance marketing shell with pre-rendered theme showcases).
- **Primary Actions:** "Create Store" (leads to Screen 13), "Explore Store Designs" (leads to Screen 02), "Seller Login" (leads to Screen 16).
- **Empty State:** N/A (editorial content page).
- **Loading State:** Instant static load; smooth skeleton pulse on interactive preview demos.
- **Error State:** N/A.
- **Mobile Considerations:** Single-column narrative flow; sticky "Create Store" CTA bar at bottom; horizontal swipeable carousel for the 7 theme showcases.
- **Desktop Considerations:** Generous editorial spacing; split-screen hero with interactive theme switcher; live archetype preview cards.

---

### Screen 02: Store Designs
- **Purpose:** Comprehensive gallery of all 7 foundational themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`, `FEAST`) showing industry suitability and capabilities.
- **Primary User:** Prospective merchants evaluating aesthetic fit for their business.
- **Entry Point:** Header navigation `/themes` or CTA from Screen 01.
- **API Dependencies:** Pre-rendered theme catalog metadata.
- **Primary Actions:** Filter by industry (Luxury, Apparel, Food, Industrial, Home, Retail), "Preview Live Demo" (Screen 03), "Start with this Design" (Screen 13).
- **Empty State:** "No themes match your selected filter" with clear "Reset Filters" action.
- **Loading State:** Shimmering image cards with theme badge placeholders.
- **Error State:** Standard platform recovery banner with "Reload Themes" action.
- **Mobile Considerations:** Full-width theme cards with badge overlays; 1-tap demo preview launch.
- **Desktop Considerations:** 3-column responsive card layout; hover states revealing sample product types and typography pairings.

---

### Screen 03: Theme Detail / Preview
- **Purpose:** Deep dive into a specific theme archetype, detailing its layout options, specialized capabilities, and interactive sample store.
- **Primary User:** Merchants wanting to inspect theme behavior before committing.
- **Entry Point:** Click on any theme card in Screen 02 (`/themes/:themeId`).
- **API Dependencies:** Theme configuration contracts (`THEME_BACKEND_CONTRACT.md`).
- **Primary Actions:** "Toggle Mobile/Desktop View", "Start with this Theme" (passes theme key to onboarding), "Back to Designs".
- **Empty State:** If theme ID is invalid, "Theme Not Found" with link back to Screen 02.
- **Loading State:** Centered brand spinner with layout outline.
- **Error State:** "Unable to load theme preview. Please try again."
- **Mobile Considerations:** Auto-defaults to mobile device preview frame; floating action button to select theme.
- **Desktop Considerations:** Interactive device frame switcher (Mobile, Tablet, Desktop); side panel highlighting specialized features.

---

### Screen 04: For Your Business
- **Purpose:** Industry-specific solutions landing page (Food & Bakery, Haute Luxury, Industrial Manufacturing, Neighbourhood Retail).
- **Primary User:** Merchants seeking evidence that the platform handles their exact operational needs.
- **Entry Point:** Header navigation `/for-your-business`.
- **API Dependencies:** None.
- **Primary Actions:** Select industry segment, read operational feature breakdown, "Launch My Store".
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Accordion-based industry selector with tap-to-expand feature highlights.
- **Desktop Considerations:** Tabbed side-by-side view pairing operational requirements with platform architecture solutions.

---

### Screen 05: Pricing
- **Purpose:** Transparent presentation of platform subscription tiers, transaction fees, and feature inclusions.
- **Primary User:** Merchants evaluating platform costs.
- **Entry Point:** Header navigation `/pricing`.
- **API Dependencies:** None (static pricing tier matrix).
- **Primary Actions:** "Choose Annual (Discounted)" vs "Choose Monthly", "Start Free Trial / Onboarding".
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Vertical stack of pricing tiers with recommended tier highlighted; sticky "Get Started" CTA.
- **Desktop Considerations:** 3-column side-by-side tier comparison table with complete feature checklist.

---

### Screen 06: Contact
- **Purpose:** Platform inquiries, enterprise merchant onboarding assistance, and support contacts.
- **Primary User:** Merchants requiring support, sales guidance, or partnerships.
- **Entry Point:** Footer or header navigation `/contact`.
- **API Dependencies:** `POST /api/v1/platform/contact-inquiry`.
- **Primary Actions:** Submit contact form, click WhatsApp support link, email platform desk.
- **Empty State:** Blank input fields with clear placeholders and validation rules.
- **Loading State:** Submit button displays spinning indicator and disables repeat clicks.
- **Error State:** Field-level validation flags; red banner if API submission fails.
- **Mobile Considerations:** Full-screen form with native mobile keyboard configurations (`type="tel"`, `type="email"`).
- **Desktop Considerations:** Two-column layout: direct contact details and FAQ on left, contact form on right.

---

### Screen 07: Terms of Service
- **Purpose:** Legal terms governing usage of the Simply E-Commerce platform website and services.
- **Primary User:** Legal representatives, prospective and active merchants, platform buyers.
- **Entry Point:** Footer navigation `/terms`.
- **API Dependencies:** Static markdown content.
- **Primary Actions:** Read terms, navigate table of contents, print/download PDF.
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Clean readable typography, jump links dropdown at top.
- **Desktop Considerations:** Sticky table of contents on left, reading width capped at `65ch` for readability.

---

### Screen 08: Privacy Policy
- **Purpose:** Full DPDP Act 2023 compliance, data retention, consent mechanisms, and user privacy rights.
- **Primary User:** All platform users and regulatory auditors.
- **Entry Point:** Footer navigation `/privacy`.
- **API Dependencies:** Static markdown content.
- **Primary Actions:** Review data practices, access Data Subject Request mechanism.
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Clean typography with prominent section headings.
- **Desktop Considerations:** Two-column layout with quick-jump navigation and last updated timestamp.

---

### Screen 09: Refund & Cancellation Policy
- **Purpose:** Public platform terms regarding SaaS subscription cancellations, refunds, and merchant buyer policy frameworks.
- **Primary User:** Merchants assessing subscription terms and consumer rights.
- **Entry Point:** Footer navigation `/refund-policy`.
- **API Dependencies:** Static markdown content.
- **Primary Actions:** Review refund eligibility, contact billing desk.
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Readable prose with bullet points.
- **Desktop Considerations:** Centered editorial column with clear policy summary callout.

---

### Screen 10: Shipping & Delivery Guidelines
- **Purpose:** Platform guidelines on merchant logistics, delivery expectations, and fulfillment responsibilities.
- **Primary User:** Merchants configuring fulfillment and buyers understanding platform logistics standards.
- **Entry Point:** Footer navigation `/shipping-guidelines`.
- **API Dependencies:** Static markdown content.
- **Primary Actions:** Read fulfillment guidelines, link to merchant onboarding.
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Clean typography with expandable summary cards.
- **Desktop Considerations:** Structured documentation layout with callout notes for perishable vs non-perishable goods.

---

### Screen 11: Merchant Agreement & Terms
- **Purpose:** Specialized legal agreement governing the commercial relationship between Simply E-Commerce (AIKYAM) and merchants.
- **Primary User:** Merchants completing registration or legal due diligence.
- **Entry Point:** Footer navigation `/merchant-terms` and linked during Screen 18.
- **API Dependencies:** Static markdown content.
- **Primary Actions:** Read agreement, accept during onboarding.
- **Empty State:** N/A.
- **Loading State:** Instant static render.
- **Error State:** N/A.
- **Mobile Considerations:** Readable layout with explicit acceptance checkbox in onboarding context.
- **Desktop Considerations:** Formal document view with section jump links and downloadable copy.

---

### Screen 12: Login / Create Store Entry Portal
- **Purpose:** Direct gateway routing returning sellers to PIN login and new merchants to onboarding.
- **Primary User:** Any merchant arriving to access their workspace.
- **Entry Point:** Header "Login / Create Store" button from anywhere on the platform site.
- **API Dependencies:** None.
- **Primary Actions:** "I have an existing store" (Screen 16), "I want to create a new store" (Screen 13).
- **Empty State:** N/A.
- **Loading State:** Instant render.
- **Error State:** N/A.
- **Mobile Considerations:** Two large, thumb-friendly tap targets stacked vertically.
- **Desktop Considerations:** Centered minimalist modal or split card highlighting the two paths.

---

## PART 2: SELLER AUTH & ONBOARDING (SCREENS 13 – 22)

### Screen 13: Enter Mobile
- **Purpose:** Capture seller's 10-digit Indian mobile number to initiate first-time registration challenge.
- **Primary User:** New merchant registering their business.
- **Entry Point:** Screen 12 "Create a new store" or `/onboarding` on seller portal.
- **API Dependencies:** `POST /api/v1/auth/register/request-otp`.
- **Primary Actions:** Enter mobile number, tap "Send Verification Code".
- **Empty State:** Focused input with `+91` prefix pre-filled.
- **Loading State:** Button shows loading spinner; input disabled while challenge is created.
- **Error State:** Inline validation error ("Enter a valid 10-digit Indian mobile number"); rate limit banner if exceeded.
- **Mobile Considerations:** Numeric virtual keyboard auto-focused; large thumb-friendly button.
- **Desktop Considerations:** Centered card with brand reassurance badge and security note.

---

### Screen 14: OTP Verification
- **Purpose:** Verify seller's possession of the mobile number via 6-digit OTP.
- **Primary User:** Registering merchant completing mobile challenge.
- **Entry Point:** Screen 13 submission.
- **API Dependencies:** `POST /api/v1/auth/register/verify-otp`.
- **Primary Actions:** Enter 6-digit OTP, auto-submit on 6th digit, "Resend Code" (with 30s countdown timer).
- **Empty State:** 6 individual digit input boxes with cursor on first box.
- **Loading State:** Micro-spinner across digit boxes while verifying.
- **Error State:** "Incorrect verification code. Please check and try again." (shakes input); "Code expired. Request a new one."
- **Mobile Considerations:** Auto-fills SMS OTP via WebOTP API where supported; large digit boxes.
- **Desktop Considerations:** Focused centered form with countdown timer clearly visible.

---

### Screen 15: Create PIN
- **Purpose:** Establish seller's permanent 4 to 6 digit security PIN for future logins (bypassing OTP). (Note: The frozen backend rule enforces 4 to 6 digit numeric PIN. If a future product decision mandates 6 digits strictly, it will be updated across schema and DTO; currently 4 to 6 digits are fully supported).
- **Primary User:** Verified new merchant setting up primary credentials.
- **Entry Point:** Screen 14 successful verification.
- **API Dependencies:** `POST /api/v1/auth/pin/setup`.
- **Primary Actions:** Enter PIN, confirm PIN, enter full legal name and email, tap "Save PIN & Continue".
- **Empty State:** Masked PIN inputs with match indicator.
- **Loading State:** Button spinner while hashing credentials and issuing initial tokens.
- **Error State:** "PINs do not match", "PIN must be between 4 and 6 digits".
- **Mobile Considerations:** Numeric keypad; toggle to unmask digits; sticky next button.
- **Desktop Considerations:** Step indicator (Step 1 of 4: Security Setup) with clear explanatory text.

---

### Screen 16: Returning Seller PIN Login
- **Purpose:** Daily high-speed authentication for existing merchants using only phone + security PIN (Zero OTP).
- **Primary User:** Returning merchant accessing their workspace.
- **Entry Point:** `/login` on seller portal (`:3001`).
- **API Dependencies:** `POST /api/v1/auth/pin/login`.
- **Primary Actions:** Enter mobile, enter PIN, tap "Sign In", "Forgot PIN?" link.
- **Empty State:** Phone number auto-filled if stored in device cookie; PIN field focused.
- **Loading State:** Sign-in button spinner; inputs disabled.
- **Error State:** "Incorrect PIN. 4 attempts remaining." or "Account locked for 15 minutes due to too many failed attempts."
- **Mobile Considerations:** Clean numeric PIN entry; quick biometric/passkey future anchor.
- **Desktop Considerations:** Clean minimalist workspace login box with brand logo.

---

### Screen 17: Recover Access
- **Purpose:** Allow seller who forgot their PIN to reset credentials using mobile OTP challenge.
- **Primary User:** Merchant locked out or having forgotten their PIN.
- **Entry Point:** "Forgot PIN?" link from Screen 16 (`/recover`).
- **API Dependencies:** `POST /api/v1/auth/recovery/request-otp`, `POST /api/v1/auth/recovery/verify-otp`, `POST /api/v1/auth/pin/setup`.
- **Primary Actions:** Enter phone, verify recovery OTP, enter new security PIN.
- **Empty State:** Phone entry view.
- **Loading State:** Transition spinner between verification and PIN reset.
- **Error State:** "No account found with this phone number", "Code expired".
- **Mobile Considerations:** Seamless step-by-step sheet progression.
- **Desktop Considerations:** Guided 3-step recovery flow with clear status breadcrumb.

---

### Screen 18: Business Setup
- **Purpose:** Capture business legal name, business category/industry, and GSTIN (optional).
- **Primary User:** Authenticated new merchant in onboarding flow.
- **Entry Point:** Screen 15 completion or `/onboarding/business`.
- **API Dependencies:** `PATCH /api/v1/seller/business`.
- **Primary Actions:** Input business name, select industry archetype, input GSTIN (optional), tap "Continue".
- **Empty State:** Clean form with smart industry suggestions based on keywords.
- **Loading State:** Saving spinner; input field disabled.
- **Error State:** "Business name is required (min 2 characters)", "Invalid GSTIN format".
- **Mobile Considerations:** Native select pickers; auto-capitalization for GSTIN.
- **Desktop Considerations:** Real-time character counter; helpful tooltips explaining why GSTIN is optional.

---

### Screen 19: Store Basics
- **Purpose:** Configure store display name, public store slug (`/store/:slug`), and contact phone.
- **Primary User:** Merchant configuring public storefront identity.
- **Entry Point:** Screen 18 completion or `/onboarding/store`.
- **API Dependencies:** `PATCH /api/v1/seller/store`.
- **Primary Actions:** Enter store name, customize generated slug, enter WhatsApp/support phone, tap "Continue".
- **Empty State:** Slug is auto-derived in lowercase from store name with live availability check.
- **Loading State:** Inline spinner checking slug availability against database.
- **Error State:** "This store URL is already taken. Try adding a city or brand keyword."
- **Mobile Considerations:** Monospaced live slug preview (`simplyecommerce.in/store/your-slug`).
- **Desktop Considerations:** Real-time URL preview showing the exact web address buyers will use.

---

### Screen 20: Choose Store Design
- **Purpose:** Select one of the 7 foundational themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`, `FEAST`) tailored to the business.
- **Primary User:** Merchant selecting their storefront design archetype.
- **Entry Point:** Screen 19 completion or `/onboarding/design`.
- **API Dependencies:** `GET /api/v1/seller/themes`, `PUT /api/v1/seller/store/theme`.
- **Primary Actions:** Browse themes, see recommended tag based on Screen 18 industry, select theme, tap "Apply Design".
- **Empty State:** All 7 themes displayed; recommended theme pre-selected.
- **Loading State:** Shimmer grid while theme metadata loads.
- **Error State:** "Unable to apply theme. Please select again."
- **Mobile Considerations:** Horizontal swiping cards with clear "Select" button.
- **Desktop Considerations:** 3-column layout highlighting palette swatches, typography samples, and industry best-fit.

---

### Screen 21: Initial Preview
- **Purpose:** Private preview of the newly configured storefront with sample products before publishing.
- **Primary User:** Merchant seeing their store for the first time.
- **Entry Point:** Screen 20 completion or `/onboarding/preview`.
- **API Dependencies:** `GET /api/v1/storefront/:slug?preview=true`.
- **Primary Actions:** "Looks Great! Proceed to Publish", "Customize Further in Brand Studio".
- **Empty State:** Pre-populated with theme archetype sample items.
- **Loading State:** Storefront skeleton loader with simulated device frame.
- **Error State:** "Preview unavailable. Refreshing preview session..."
- **Mobile Considerations:** Full-screen responsive preview with floating "Proceed" toolbar.
- **Desktop Considerations:** Device viewport toggles (Mobile, Tablet, Desktop) in top preview bar.

---

### Screen 22: Subscription / Publish
- **Purpose:** Activate SaaS subscription and publish the storefront to the public internet (`LIVE` status).
- **Primary User:** Merchant launching their store publicly.
- **Entry Point:** Screen 21 "Proceed to Publish" or `/subscription/publish`.
- **API Dependencies:** `POST /api/v1/seller/store/publish`, `POST /api/v1/subscriptions/create-order`.
- **Primary Actions:** Select subscription plan, complete platform payment, tap "Publish Store Live".
- **Empty State:** Plan selection card with billing summary.
- **Loading State:** Processing indicator during subscription verification and store status update.
- **Error State:** "Payment could not be completed. Store remains in Private Preview until subscription is active."
- **Mobile Considerations:** Single-column checkout card with clear breakdown of monthly/annual pricing.
- **Desktop Considerations:** Side-by-side plan benefits and instant live domain verification summary.

---

## PART 3: SELLER APPLICATION WORKSPACE (SCREENS 23 – 42)

### Screen 23: Seller Home (Workspace Dashboard)
- **Purpose:** Central operational headquarters: live sales velocity, pending orders requiring action, stock alerts, and quick actions.
- **Primary User:** Store owner or manager checking daily performance.
- **Entry Point:** Root of seller portal (`/` on `:3001`).
- **API Dependencies:** `GET /api/v1/seller/dashboard`, `GET /api/v1/seller/me`.
- **Primary Actions:** "View Pending Orders" (Screen 30), "Add New Product" (Screen 25), "Open Live Storefront" (new tab).
- **Empty State:** Welcome banner for new store with guided checklist: Add First Product, Upload Logo, Set Hours.
- **Loading State:** Subtle pulse skeleton across metrics and action queue.
- **Error State:** "Unable to refresh workspace metrics. Tap to retry."
- **Mobile Considerations:** Bottom navigation docked; critical attention alerts pinned to top.
- **Desktop Considerations:** Left navigation rail; live mini-preview widget in top-right corner.

---

### Screen 24: Products
- **Purpose:** Full catalog management: search, filter by status/category, view stock levels, and bulk manage items.
- **Primary User:** Store manager managing inventory and listings.
- **Entry Point:** Navigation "Products" (`/products`).
- **API Dependencies:** `GET /api/v1/seller/products`, `GET /api/v1/seller/categories`.
- **Primary Actions:** "Add Product", search by title/SKU, filter by status (`ACTIVE`, `DRAFT`, `ARCHIVED`), inline stock adjust.
- **Empty State:** "No products added yet. Start by adding your first crafted item or catalogue item." with large "Add Product" button.
- **Loading State:** Table skeleton with 5 row placeholders.
- **Error State:** "Could not load products. Check your connection and retry."
- **Mobile Considerations:** High-density card list with thumbnail, title, price in paise, and stock pill.
- **Desktop Considerations:** Comprehensive data table with thumbnail, title, category, variants count, price range, stock, and quick edit drawer.

---

### Screen 25: Add Product
- **Purpose:** Fast product creation form: title, description, pricing in paise, media upload, category, and mode selection.
- **Primary User:** Merchant listing a new product.
- **Entry Point:** Screen 24 "Add Product" button (`/products/new`).
- **API Dependencies:** `POST /api/v1/seller/products`, `POST /api/v1/seller/media/upload`.
- **Primary Actions:** Fill title/price, drag-and-drop media, set inventory count, select mode (`SELL_ONLINE`, `ENQUIRY_ONLY`, `SELL_AND_ENQUIRY`), tap "Save & Publish".
- **Empty State:** Clean, focused form with sensible defaults.
- **Loading State:** Saving button indicator; media upload progress bar.
- **Error State:** Field-level error highlights (e.g. "Price in paise must be greater than zero").
- **Mobile Considerations:** Native bottom sheet or full-screen scroll with sticky "Save" bar.
- **Desktop Considerations:** Two-column layout: media and primary details on left; status, category, and pricing on right.

---

### Screen 26: Edit Product
- **Purpose:** Modify existing product details, update specifications/attributes, manage documents, and archive listing.
- **Primary User:** Merchant updating existing product details.
- **Entry Point:** Click product row from Screen 24 (`/products/:id`).
- **API Dependencies:** `GET /api/v1/seller/products/:id`, `PUT /api/v1/seller/products/:id`, `DELETE /api/v1/seller/products/:id`.
- **Primary Actions:** Edit fields, add attributes, manage downloadable documents, tap "Update Product", or "Archive Product".
- **Empty State:** If product ID is invalid, "Product Not Found" with link back to catalog.
- **Loading State:** Form pre-fills with pulsing placeholder blocks.
- **Error State:** "Failed to save changes. Please try again."
- **Mobile Considerations:** Tabbed sections (General, Variants, Specs, Media) to avoid endless vertical scrolling.
- **Desktop Considerations:** Full workspace view with breadcrumbs and live link to view this product on the public storefront.

---

### Screen 27: Product Variants
- **Purpose:** Multi-dimensional variant matrix manager: manage options (Color, Size, Material, Flavour), SKUs, prices, and stock.
- **Primary User:** Merchant selling multi-option products.
- **Entry Point:** Tab or modal inside Screen 26 (`/products/:id/variants`).
- **API Dependencies:** `GET /api/v1/seller/products/:id`, `PATCH /api/v1/seller/variants/:id`.
- **Primary Actions:** Add option dimension, generate variants matrix, set per-variant prices and stock, link per-variant photos.
- **Empty State:** "This product has no variants. It sells as a single item. Click Add Options to create sizes, colors, or materials."
- **Loading State:** Grid skeleton loader.
- **Error State:** "SKU must be unique across all products."
- **Mobile Considerations:** Card-based variant list with expandable rows for editing.
- **Desktop Considerations:** Dense spreadsheet-like matrix table for rapid bulk editing of prices and quantities.

---

### Screen 28: Categories
- **Purpose:** Manage catalog hierarchy, create nested categories, assign category banners, and reorder navigation.
- **Primary User:** Merchant organizing their catalog structure.
- **Entry Point:** Navigation "Categories" (`/categories`).
- **API Dependencies:** `GET /api/v1/seller/categories`, `POST /api/v1/seller/categories`.
- **Primary Actions:** "Create Category", reorder categories, upload category banner image, view product counts.
- **Empty State:** "No categories created. Products are currently uncategorized." with "Create First Category" CTA.
- **Loading State:** Category tree skeleton.
- **Error State:** "Unable to update category order. Please retry."
- **Mobile Considerations:** Tree view with drag handles or up/down ordering buttons.
- **Desktop Considerations:** Split view: category tree on left, active category details and banner image on right.

---

### Screen 29: Media Library
- **Purpose:** Central tenant-scoped digital asset manager: upload, organize, preview, crop, and set focal points on images.
- **Primary User:** Merchant managing photography and documents.
- **Entry Point:** Navigation "Media Library" (`/media`).
- **API Dependencies:** `GET /api/v1/seller/media`, `POST /api/v1/seller/media/upload`, `DELETE /api/v1/seller/media/:id`.
- **Primary Actions:** Upload new assets, click to set focal point coordinates, delete unused assets, copy asset URL.
- **Empty State:** "Your media library is empty. Drag and drop high-resolution photos or documents to get started."
- **Loading State:** Grid of pulsating image tiles.
- **Error State:** "File upload failed. Max file size is 15MB. Supported: JPEG, PNG, WebP, PDF."
- **Mobile Considerations:** 2-column image grid; tap to view fullscreen with focal point crosshair.
- **Desktop Considerations:** 4 to 6-column masonry grid; drag-and-drop upload zone; asset inspector drawer on right.

---

### Screen 30: Orders
- **Purpose:** Real-time order fulfillment pipeline: filter by order status, inspect customer details, and track shipments.
- **Primary User:** Store operator fulfilling orders.
- **Entry Point:** Navigation "Orders" (`/orders`).
- **API Dependencies:** `GET /api/v1/seller/orders`.
- **Primary Actions:** Filter by status (`NEW`, `CONFIRMED`, `PROCESSING`, `READY`, `DISPATCHED`, `COMPLETED`), search by order number/phone.
- **Empty State:** "No orders yet. Once buyers check out from your storefront, orders will appear here in real time."
- **Loading State:** Order row skeleton list.
- **Error State:** "Could not retrieve orders. Pull down to refresh."
- **Mobile Considerations:** Card-based list with status badge, buyer name, item count, total in paise, and 1-tap "Accept" action.
- **Desktop Considerations:** High-density data table with quick-view modal on row hover/click.

---

### Screen 31: Order Details
- **Purpose:** Full order breakdown: customer contact, line item snapshots, delivery address, fulfillment timeline, and dispatch actions.
- **Primary User:** Store operator packing and dispatching an order.
- **Entry Point:** Click order row from Screen 30 (`/orders/:id`).
- **API Dependencies:** `GET /api/v1/seller/orders/:id`, `POST /api/v1/seller/orders/:id/confirm`, `POST /api/v1/seller/orders/:id/fulfill`.
- **Primary Actions:** "Confirm Order", "Mark Ready to Ship", "Generate Waybill / Enter Tracking", "Cancel Order & Restock".
- **Empty State:** "Order not found."
- **Loading State:** Full-page order skeleton with card placeholders.
- **Error State:** "Action failed: Order cannot be transitioned from current state."
- **Mobile Considerations:** Sticky bottom action bar with current primary transition (e.g. "Confirm Order"); 1-tap call/WhatsApp customer.
- **Desktop Considerations:** Two-column view: order items and address on left; status history, customer timeline, and actions on right.

---

### Screen 32: Customers
- **Purpose:** Directory of store customers who have placed orders, showing lifetime spend, order frequency, and contact details.
- **Primary User:** Merchant managing customer relationships.
- **Entry Point:** Navigation "Customers" (`/customers`).
- **API Dependencies:** `GET /api/v1/seller/customers`.
- **Primary Actions:** Search by customer name/phone, filter by repeat buyers, view order history.
- **Empty State:** "No customer records yet. Customers are automatically saved when they place orders."
- **Loading State:** Table skeleton.
- **Error State:** "Unable to load customer list."
- **Mobile Considerations:** Card list with direct phone call and WhatsApp quick-action buttons.
- **Desktop Considerations:** Data table with customer name, phone, city, total orders, total spent in paise, and last order date.

---

### Screen 33: Enquiries / RFQs
- **Purpose:** Dedicated B2B wholesale quotation manager (essential for `FOUNDRY` and custom orders).
- **Primary User:** B2B merchant handling quotations and custom requests.
- **Entry Point:** Navigation "Enquiries" (`/enquiries`).
- **API Dependencies:** `GET /api/v1/seller/enquiries`, `PUT /api/v1/seller/enquiries/:id/quotation`.
- **Primary Actions:** Filter by status (`NEW`, `IN_REVIEW`, `QUOTED`, `CONVERTED`), issue quotation with custom price in paise, reply to customer.
- **Empty State:** "No wholesale enquiries received yet. Products set to 'Enquiry Only' or 'Sell & Enquiry' will capture leads here."
- **Loading State:** Table skeleton.
- **Error State:** "Failed to load enquiries."
- **Mobile Considerations:** High-priority badge count on navigation; card-based lead review.
- **Desktop Considerations:** Master-detail split screen: inquiry list on left, full company message and quotation form on right.

---

### Screen 34: Brand Studio
- **Purpose:** The creative visual cockpit: customize palette, select fonts, configure header/hero layouts, and view real-time changes.
- **Primary User:** Merchant styling their storefront identity.
- **Entry Point:** Navigation "Brand Studio" (`/brand-studio`).
- **API Dependencies:** `GET /api/v1/seller/store/theme`, `PUT /api/v1/seller/store/theme`.
- **Primary Actions:** Adjust brand colors with contrast validation, choose typography preset, select hero style, tap "Save Changes".
- **Empty State:** Pre-populated with current active theme configuration.
- **Loading State:** Studio skeleton with inactive preview pane.
- **Error State:** "Contrast warning: Selected text color does not meet WCAG readability standards on this background."
- **Mobile Considerations:** Tabbed controls sheet with toggleable floating preview button.
- **Desktop Considerations:** Split-screen layout: styling controls on left panel (`380px`), live interactive store preview on right.

---

### Screen 35: Theme Selection
- **Purpose:** Switch between the 7 foundational themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`, `FEAST`) anytime without data loss.
- **Primary User:** Merchant wanting to change their store's visual archetype.
- **Entry Point:** Link inside Screen 34 or navigation "Themes" (`/brand-studio/themes`).
- **API Dependencies:** `GET /api/v1/seller/themes`, `PUT /api/v1/seller/store/theme`.
- **Primary Actions:** Compare theme features, preview active catalog inside candidate theme, tap "Switch to this Theme".
- **Empty State:** All 7 themes displayed.
- **Loading State:** Grid skeleton.
- **Error State:** "Theme change failed. Previous theme preserved."
- **Mobile Considerations:** Vertical carousel with side-by-side comparison chips.
- **Desktop Considerations:** 3-column card grid with live preview trigger for each theme.

---

### Screen 36: Store Sections
- **Purpose:** Drag-and-drop homepage layout builder: toggle section visibility, reorder sections, and configure section banners.
- **Primary User:** Merchant curating homepage presentation.
- **Entry Point:** Inside Screen 34 or `/brand-studio/sections`.
- **API Dependencies:** `PUT /api/v1/seller/store/sections`.
- **Primary Actions:** Drag to reorder sections (Hero, Categories, Featured Products, Story, Testimonials, Store Info), toggle visibility switches.
- **Empty State:** Default section list based on active theme archetype.
- **Loading State:** Reorder list skeleton.
- **Error State:** "Could not update section order. Changes rolled back."
- **Mobile Considerations:** Touch drag handles with up/down arrows as accessible alternative.
- **Desktop Considerations:** Reorder list on left with highlighted corresponding section in live preview on right.

---

### Screen 37: Store Preview (Dedicated Fullscreen)
- **Purpose:** Fullscreen, high-fidelity sandbox testing of the entire storefront before public deployment.
- **Primary User:** Merchant reviewing changes in desktop and mobile viewport sizes.
- **Entry Point:** "Preview Store" button from header or Screen 34 (`/preview`).
- **API Dependencies:** `GET /api/v1/storefront/:slug?preview=true`.
- **Primary Actions:** Switch viewports (Mobile, Tablet, Desktop), test add-to-cart in sandbox mode, tap "Publish Changes".
- **Empty State:** Shows active store with draft modifications.
- **Loading State:** Simulated browser frame with loading spinner.
- **Error State:** "Preview session expired. Click to refresh."
- **Mobile Considerations:** Displays true native mobile view with sticky exit banner.
- **Desktop Considerations:** Centered device frame with responsive width toggles and shareable temporary preview link.

---

### Screen 38: Subscription / Billing
- **Purpose:** Manage SaaS plan, view billing history, download tax invoices, and renew expired subscriptions.
- **Primary User:** Business owner managing account finances.
- **Entry Point:** Navigation "Subscription" (`/subscription`).
- **API Dependencies:** `GET /api/v1/seller/business`, `POST /api/v1/subscriptions/create-order`.
- **Primary Actions:** "Renew Subscription", "Upgrade to Annual", download invoice PDF, view subscription status.
- **Empty State:** Current plan card with status badge (`ACTIVE`, `TRIALING`, `PAST_DUE`, `EXPIRED`).
- **Loading State:** Billing card skeleton.
- **Error State:** "Failed to load subscription details. Please contact platform support."
- **Mobile Considerations:** Clean card layout with prominent expiration date and 1-tap renewal button.
- **Desktop Considerations:** Two-column view: active subscription card on left, invoice history table on right.

---

### Screen 39: Business Profile
- **Purpose:** Update legal business entity details: registered name, PAN/GSTIN, business address, and primary contact.
- **Primary User:** Business owner managing compliance.
- **Entry Point:** Settings menu "Business Profile" (`/settings/business`).
- **API Dependencies:** `GET /api/v1/seller/business`, `PATCH /api/v1/seller/business`.
- **Primary Actions:** Update address, enter GSTIN, save changes.
- **Empty State:** Pre-filled with data from onboarding.
- **Loading State:** Form input skeleton.
- **Error State:** "Invalid business postal code (PIN code must be 6 digits)."
- **Mobile Considerations:** Vertical form with native state/country dropdowns.
- **Desktop Considerations:** Sectioned form with clear demarcation between public brand info and legal entity info.

---

### Screen 40: Store Settings
- **Purpose:** Public store contact settings: support phone, support email, WhatsApp number, physical store address, and Google Maps URL.
- **Primary User:** Store manager configuring buyer-facing contact channels.
- **Entry Point:** Settings menu "Store Settings" (`/settings/store`).
- **API Dependencies:** `GET /api/v1/seller/store`, `PATCH /api/v1/seller/store`.
- **Primary Actions:** Update WhatsApp number, toggle fulfillment modes (`DELIVERY`, `PICKUP`, `DELIVERY_AND_PICKUP`), save settings.
- **Empty State:** Pre-filled with store defaults.
- **Loading State:** Form skeleton.
- **Error State:** "Invalid WhatsApp number (must include country code +91)."
- **Mobile Considerations:** Single-column layout with quick test link to verify WhatsApp button.
- **Desktop Considerations:** Side-by-side contact fields with live preview of the store footer.

---

### Screen 41: Delivery / Pickup Settings & Operating Hours
- **Purpose:** Configure weekly business hours schedule (7 days: open time, close time, isClosed) and local delivery radius.
- **Primary User:** Store manager (especially crucial for `FEAST` and `LOCAL` themes).
- **Entry Point:** Settings menu "Delivery & Timings" (`/settings/timings`).
- **API Dependencies:** `GET /api/v1/seller/store/business-hours`, `PUT /api/v1/seller/store/business-hours`.
- **Primary Actions:** Set daily opening and closing hours, mark days closed, configure estimated prep/dispatch time.
- **Empty State:** Standard 9 AM - 9 PM schedule pre-populated.
- **Loading State:** 7-day schedule skeleton list.
- **Error State:** "Closing time must be after opening time."
- **Mobile Considerations:** Compact day-by-day rows with toggle switch and time pickers.
- **Desktop Considerations:** Clean 7-day grid with "Apply Mon-Fri to all weekdays" quick action.

---

### Screen 42: Account & Security
- **Purpose:** Change 4 to 6 digit security PIN, view active sessions, and safely logout of all devices.
- **Primary User:** Business owner managing credential security.
- **Entry Point:** Settings menu "Account & Security" (`/settings/security`).
- **API Dependencies:** `POST /api/v1/auth/pin/setup`, `POST /api/v1/auth/logout`.
- **Primary Actions:** "Change Security PIN", "Log Out of This Device", "Log Out of All Devices".
- **Empty State:** Account details card showing phone number and current role (`SELLER_OWNER`).
- **Loading State:** Security card skeleton.
- **Error State:** "Current PIN is incorrect. Unable to change PIN."
- **Mobile Considerations:** Masked PIN inputs with confirmation; high-contrast red logout button.
- **Desktop Considerations:** Two-column card layout with security tips and recent login audit history.

---

## PART 4: BUYER STOREFRONT (SCREENS 43 – 55)

### Screen 43: Store Homepage
- **Purpose:** Public face of the merchant: hero banner, published sections, featured products, category navigation, and store info.
- **Primary User:** Online shopper visiting the merchant's store.
- **Entry Point:** Direct URL (`/store/:slug` on `:3000` or custom domain).
- **API Dependencies:** `GET /api/v1/storefront/:slug`.
- **Primary Actions:** Browse catalog, search products, click category, add featured item to cart, click WhatsApp chat.
- **Empty State:** If store is new, friendly placeholder message from merchant.
- **Loading State:** Theme-styled skeleton (matches active theme typography and card proportions).
- **Error State:** If store is private: `STORE_PRIVATE` message. If subscription expired: `SUBSCRIPTION_REQUIRED` message. If store slug not found: `STORE_NOT_FOUND` message with "Check Store Link" and "Go to Simply Home" actions (strictly no marketplace browsing or cross-store search).
- **Mobile Considerations:** Theme-specific mobile layout (e.g. `FEAST` sticky category bar; `LOCAL` quick search bar); sticky bottom cart pill.
- **Desktop Considerations:** Immersive theme-specific hero; generous spacing; header search bar and category dropdowns.

---

### Screen 44: Collection / Category Page
- **Purpose:** Filtered product listing for a specific category or collection.
- **Primary User:** Shopper browsing a department or curated grouping.
- **Entry Point:** Click category link from homepage or header (`/store/:slug?category=:catId`).
- **API Dependencies:** `GET /api/v1/storefront/:slug/products?categoryId=...`.
- **Primary Actions:** Filter by sub-category, sort by price/newest, click product to view details, quick-add to cart.
- **Empty State:** "No products currently available in this category. Check out our other collections."
- **Loading State:** Grid of themed card skeletons.
- **Error State:** "Unable to load products. Tap to retry."
- **Mobile Considerations:** Horizontal swipeable category chips at top; 2-column product grid.
- **Desktop Considerations:** Category banner header; left-side filters for attributes; 3 to 4-column product grid.

---

### Screen 45: Catalog Search
- **Purpose:** High-speed full-text search across merchant's active products, SKUs, and tags.
- **Primary User:** Shopper searching for a specific item.
- **Entry Point:** Search icon or input on header (`/store/:slug/search`).
- **API Dependencies:** `GET /api/v1/storefront/:slug/search?q=...`.
- **Primary Actions:** Type search query, instant typeahead results, filter by category, click product.
- **Empty State:** "Search for products, materials, or SKU..." with popular category recommendations.
- **Loading State:** Subtle spinner inside search bar; skeleton card grid.
- **Error State:** "No products match 'xyz'. Try checking for spelling or browse all categories in this store."
- **Mobile Considerations:** Auto-focused search input; full-screen search overlay with instant results.
- **Desktop Considerations:** Typeahead dropdown preview with product thumbnails and prices in paise.

---

### Screen 46: Product Detail Page (PDP)
- **Purpose:** Comprehensive presentation of a single product: high-res photo gallery, price in paise, specifications, story, and availability.
- **Primary User:** Shopper evaluating an item for purchase.
- **Entry Point:** Click product card from any page (`/store/:slug/product/:id`).
- **API Dependencies:** `GET /api/v1/storefront/:slug/products/:slug`.
- **Primary Actions:** Select variant (Screen 47), select quantity, "Add to Cart", "Buy Now", or "Request Quotation" (FOUNDRY).
- **Empty State:** "Product not found or has been discontinued."
- **Loading State:** Large image gallery skeleton with typography placeholders.
- **Error State:** "This item is currently unavailable."
- **Mobile Considerations:** Swipeable image carousel with pagination dots; sticky bottom bar with price and "Add to Cart".
- **Desktop Considerations:** Two-column layout: sticky image gallery on left; product title, options, specs table, and CTA on right.

---

### Screen 47: Variant Selection (Modal / Drawer / Inline)
- **Purpose:** Allow buyer to choose product options (Color, Size, Material, Flavour, Pack Size) with real-time price and stock updates.
- **Primary User:** Shopper customizing their selection.
- **Entry Point:** PDP option chips or Quick-Add button from product card.
- **API Dependencies:** Evaluated client-side against loaded variant matrix; verified against server cart API.
- **Primary Actions:** Tap option chips (e.g. "Size: M", "Color: Crimson"), observe price change in paise, observe image crossfade.
- **Empty State:** Unavailable variant combinations display strikethrough with "Out of Stock" indicator.
- **Loading State:** Instant chip selection; smooth image swap.
- **Error State:** "Please select all options before adding to cart."
- **Mobile Considerations:** Bottom sheet drawer with clear option chips and prominent "Confirm & Add" button.
- **Desktop Considerations:** Inline option blocks on PDP with visual color swatches and clear price delta.

---

### Screen 48: Cart (Drawer / Page)
- **Purpose:** Review selected line items, adjust quantities, see calculated subtotal in paise, and review delivery estimate.
- **Primary User:** Shopper preparing to check out.
- **Entry Point:** Cart icon in header, or auto-opens upon "Add to Cart" (`/store/:slug/cart`).
- **API Dependencies:** `GET /api/v1/storefront/:slug/cart/:token`, `PATCH .../items/:itemId`, `DELETE .../items/:itemId`.
- **Primary Actions:** Increase/decrease quantity, remove item, enter order note (custom celebration/packaging instructions for FEAST food-commerce orders), tap "Proceed to Checkout".
- **Empty State:** "Your shopping cart is empty. Explore our collection to find something you love." with "Start Shopping" CTA.
- **Loading State:** Cart item shimmer placeholders.
- **Error State:** "We couldn't connect right now. Please try again." or "Item quantity could not be updated due to limited stock."
- **Mobile Considerations:** Full-height slide-over drawer; sticky bottom checkout button with total in paise.
- **Desktop Considerations:** Slide-over right drawer on any page, or dedicated `/cart` page with estimated delivery fee.

---

### Screen 49: Guest Checkout
- **Purpose:** Frictionless single-screen checkout: capture recipient name, phone, email, and delivery address. Zero login required.
- **Primary User:** Buyer completing purchase.
- **Entry Point:** "Proceed to Checkout" from Screen 48 (`/store/:slug/checkout`).
- **API Dependencies:** `POST /api/v1/storefront/:slug/checkout`.
- **Primary Actions:** Fill recipient details, enter address, select Fulfillment Mode (`DELIVERY` vs `PICKUP`), tap "Proceed to Payment".
- **Empty State:** Form with smart autocomplete and PIN code lookup for City/State.
- **Loading State:** Full-page checkout skeleton.
- **Error State:** Field-level validation flags (e.g. "Enter a valid 10-digit mobile number for delivery updates").
- **Mobile Considerations:** Single-column sequential form; auto-capitalization; numeric keypad for PIN code.
- **Desktop Considerations:** Two-column split: delivery and contact form on left; order summary, item list, taxes, and total on right.

---

### Screen 50: Payment
- **Purpose:** Secure transaction execution: select payment method (UPI, Card, Netbanking, or Mock Provider in dev).
- **Primary User:** Buyer completing payment.
- **Entry Point:** Screen 49 submission.
- **API Dependencies:** `POST /api/v1/payments/verify`.
- **Primary Actions:** Select payment method, authorize via payment gateway or one-click mock confirmation.
- **Empty State:** Pre-configured payment methods list.
- **Loading State:** "Securing your transaction with merchant... Do not refresh or press back."
- **Error State:** `PAYMENT_FAILED`: "Your payment could not be processed. Your card was not charged. Please try another method."
- **Mobile Considerations:** Direct UPI intent app triggers (GPay, PhonePe, Paytm); high-contrast security badge.
- **Desktop Considerations:** Embedded secure payment frame with clear refund guarantee and SSL lock icon.

---

### Screen 51: Order Confirmation
- **Purpose:** Reassure buyer immediately upon successful checkout: display order number, total in paise, and unguessable tracking link.
- **Primary User:** Buyer who just completed an order.
- **Entry Point:** Redirect from Screen 50 on successful payment.
- **API Dependencies:** Generated client confirmation payload; links to Screen 52.
- **Primary Actions:** "Track Your Order", "Save Order Details", "Continue Shopping", "Contact Store on WhatsApp".
- **Empty State:** N/A (always rendered with fresh order confirmation details).
- **Loading State:** Instant render.
- **Error State:** N/A.
- **Mobile Considerations:** Clean confirmation card with confetti micro-animation; 1-tap "Share Order to WhatsApp".
- **Desktop Considerations:** Formal receipt view with printable summary and delivery timeline expectation.

---

### Screen 52: Order Tracking
- **Purpose:** Secure, unguessable public order tracking: view fulfillment status, courier AWB, and live delivery milestones.
- **Primary User:** Buyer checking status of their shipment.
- **Entry Point:** Tracking URL (`/store/:slug/orders/:orderNumber?t=:trackingToken`) sent via SMS/WhatsApp or confirmation screen.
- **API Dependencies:** `GET /api/v1/storefront/:slug/orders/:orderNumber/track?t=...`.
- **Primary Actions:** View milestone progression (Placed -> Confirmed -> Packed -> Dispatched -> Delivered), view courier tracking link.
- **Empty State:** "Order not found or tracking link is invalid." (prevents brute-force enumeration attacks).
- **Loading State:** Milestone stepper skeleton.
- **Error State:** "Tracking session expired. Please use the original link from your confirmation message."
- **Mobile Considerations:** Clean vertical timeline with colored status nodes and carrier contact link.
- **Desktop Considerations:** Centered tracking card with map graphic, delivery address snapshot, and itemized items list.

---

### Screen 53: RFQ / Wholesale Enquiry Form
- **Purpose:** Dedicated modal/form for B2B wholesale quotation requests on `FOUNDRY` and custom catalogue products.
- **Primary User:** Commercial or bulk buyer requesting pricing.
- **Entry Point:** "Request Quotation" button on PDP (`/store/:slug/product/:id/enquiry`).
- **API Dependencies:** `POST /api/v1/enquiries`.
- **Primary Actions:** Specify target quantity, input company name, contact phone, email, and technical specifications message, tap "Submit RFQ".
- **Empty State:** Pre-populated with product name and variant SKU.
- **Loading State:** Submitting indicator.
- **Error State:** "Please enter your business contact details so the merchant can issue a quotation."
- **Mobile Considerations:** Full-screen bottom sheet with clear required fields.
- **Desktop Considerations:** Focused modal dialog with product datasheet summary on the side.

---

### Screen 54: Store Contact & Location
- **Purpose:** Physical business address, interactive Google Maps directions, phone, WhatsApp, and operating hours.
- **Primary User:** Buyer planning a store visit or needing direct merchant contact.
- **Entry Point:** Header/Footer navigation "Store Info" or "Visit Us" (`/store/:slug/contact`).
- **API Dependencies:** Included in `GET /api/v1/storefront/:slug`.
- **Primary Actions:** "Get Directions on Google Maps", "Call Store", "Message on WhatsApp", view today's opening hours.
- **Empty State:** "Contact information not configured by merchant."
- **Loading State:** Map container and info skeleton.
- **Error State:** "Unable to load store location."
- **Mobile Considerations:** 1-tap native phone dialer and WhatsApp intent links; tap-to-open Google Maps app.
- **Desktop Considerations:** Split layout: opening hours and address on left; embedded interactive map on right.

---

### Screen 55: Store Policy Pages
- **Purpose:** Merchant-specific store policies: Shipping policy, Returns & Refunds policy, Terms of service.
- **Primary User:** Shopper reviewing merchant-specific policy terms.
- **Entry Point:** Storefront footer links (`/store/:slug/policies/:policyType`).
- **API Dependencies:** Included in public store metadata.
- **Primary Actions:** Read policy prose, return to shopping.
- **Empty State:** Standard fallback policy text provided by platform template.
- **Loading State:** Typography skeleton.
- **Error State:** N/A.
- **Mobile Considerations:** Clean readable typography with back-to-store link.
- **Desktop Considerations:** Centered editorial column capped at `65ch` with clear merchant legal entity name.

---

## PART 5: PLATFORM ADMIN (SCREENS 56 – 66)

### Screen 56: Admin Dashboard
- **Purpose:** Executive mission control: total platform GMV in paise, active stores, live merchants, system health, and error alerts.
- **Primary User:** Platform administrator / AIKYAM operations lead.
- **Entry Point:** Root of admin portal (`/` on `:3002`).
- **API Dependencies:** `GET /api/v1/admin/overview`.
- **Primary Actions:** Inspect platform KPIs, view system health, filter by date range, jump to merchant investigation.
- **Empty State:** Zero-state placeholder if fresh database initialized.
- **Loading State:** High-density KPI metric card skeletons.
- **Error State:** "Admin session expired. Please re-authenticate."
- **Mobile Considerations:** Responsive summary cards with priority alert banner at top.
- **Desktop Considerations:** Multi-column layout with revenue charts, active tenant counts, and live system latency telemetry.

---

### Screen 57: Merchants
- **Purpose:** Global merchant directory: search, filter by subscription plan, inspection of account status (`ACTIVE`, `SUSPENDED`).
- **Primary User:** Platform administrator managing merchant relationships.
- **Entry Point:** Navigation "Merchants" (`/merchants`).
- **API Dependencies:** `GET /api/v1/admin/merchants`.
- **Primary Actions:** Search by merchant name/phone, filter by plan, click to view merchant details, export CSV.
- **Empty State:** "No merchants registered on platform."
- **Loading State:** High-density table skeleton with 10 row placeholders.
- **Error State:** "Failed to load merchant records."
- **Mobile Considerations:** High-density card list with merchant phone and status pill.
- **Desktop Considerations:** Full data table with tenant ID, store name, owner phone, active theme, subscription status, and action menu.

---

### Screen 58: Merchant Detail
- **Purpose:** Complete 360-degree inspection of a specific merchant: store status, owner identity, subscriptions, audit history, and suspension control.
- **Primary User:** Platform administrator auditing or supporting a merchant.
- **Entry Point:** Click merchant row from Screen 57 (`/merchants/:id`).
- **API Dependencies:** `GET /api/v1/admin/merchants/:id`, `POST /api/v1/admin/merchants/:id/suspend`, `POST .../reactivate`.
- **Primary Actions:** Inspect tenant details, view attached stores, "Suspend Merchant" (with mandatory audit reason), "Reactivate Merchant".
- **Empty State:** "Merchant record not found."
- **Loading State:** Comprehensive profile skeleton.
- **Error State:** "Action failed: Insufficient administrator permissions."
- **Mobile Considerations:** Vertical tabbed sections for Overview, Stores, Subscriptions, and Audit Trail.
- **Desktop Considerations:** Three-column view: business summary on left; store details in middle; dangerous action controls on right.

---

### Screen 59: Stores
- **Purpose:** Directory of all merchant storefronts on the platform: check status (`DRAFT`, `LIVE`, `SUSPENDED`), domains, and active themes.
- **Primary User:** Platform administrator monitoring live storefronts.
- **Entry Point:** Navigation "Stores" (`/stores`).
- **API Dependencies:** `GET /api/v1/admin/stores`.
- **Primary Actions:** Filter by theme archetype, search by slug, view public storefront in new tab, inspect domain mapping.
- **Empty State:** "No stores created yet."
- **Loading State:** Table skeleton.
- **Error State:** "Unable to retrieve stores catalog."
- **Mobile Considerations:** Compact list with theme key and status badge.
- **Desktop Considerations:** Data table with store slug, merchant name, theme archetype, fulfillment mode, and direct link to live URL.

---

### Screen 60: Commerce / Orders
- **Purpose:** Platform-wide order transaction inspector: view total orders, detect failed payments, and audit transaction integrity.
- **Primary User:** Platform administrator monitoring transaction health.
- **Entry Point:** Navigation "Commerce" (`/commerce`).
- **API Dependencies:** `GET /api/v1/admin/commerce/orders`.
- **Primary Actions:** Search by order number, inspect payment gateway response, audit inventory reservation state.
- **Empty State:** "No platform orders recorded."
- **Loading State:** Table skeleton.
- **Error State:** "Unable to load commerce transactions."
- **Mobile Considerations:** Compact card list with total in paise and status pill.
- **Desktop Considerations:** High-density table with order number, store slug, buyer phone, gateway transaction ID, total in paise, and status.

---

### Screen 61: Subscriptions
- **Purpose:** SaaS subscription ledger: track active plans, trial periods, past-due accounts, and renewal rates.
- **Primary User:** Platform billing manager.
- **Entry Point:** Navigation "Subscriptions" (`/subscriptions`).
- **API Dependencies:** `GET /api/v1/admin/subscriptions`.
- **Primary Actions:** Filter by status (`ACTIVE`, `PAST_DUE`, `EXPIRED`), inspect recurring billing health.
- **Empty State:** "No active subscriptions recorded."
- **Loading State:** Table skeleton.
- **Error State:** "Failed to load subscription metrics."
- **Mobile Considerations:** Summary cards with count of active vs past-due subscriptions.
- **Desktop Considerations:** Financial data table with tenant name, current plan, start date, expiry date, status, and manual renewal override.

---

### Screen 62: Billing & Invoicing
- **Purpose:** Platform subscription revenue ledger: inspect generated tax invoices, GST breakdowns, and Razorpay platform transactions.
- **Primary User:** Platform finance and compliance officer.
- **Entry Point:** Navigation "Billing" (`/billing`).
- **API Dependencies:** `GET /api/v1/admin/billing/invoices`.
- **Primary Actions:** Download platform invoice copies, inspect GST totals, reconcile gateway payouts.
- **Empty State:** "No billing records found."
- **Loading State:** Table skeleton.
- **Error State:** "Unable to load platform billing ledger."
- **Mobile Considerations:** Card list with invoice number and amount in paise.
- **Desktop Considerations:** Systematic accounting view with invoice number, merchant GSTIN, base amount, CGST/SGST, and payout reconciliation status.

---

### Screen 63: Themes Catalog Inspector
- **Purpose:** Internal registry of the 7 foundational themes: inspect versioning, active merchant distribution, and capability manifests.
- **Primary User:** Platform developer or UI lead.
- **Entry Point:** Navigation "Themes" (`/themes`).
- **API Dependencies:** `GET /api/v1/admin/themes`.
- **Primary Actions:** Inspect theme JSON contracts, view count of stores using each theme, verify capability slots.
- **Empty State:** Pre-populated with the 7 canonical themes (`ATELIER`, `PULSE`, `HARVEST`, `FOUNDRY`, `HABITAT`, `LOCAL`, `FEAST`).
- **Loading State:** Grid skeleton.
- **Error State:** "Unable to inspect themes manifest."
- **Mobile Considerations:** Stacked theme cards with active store count badge.
- **Desktop Considerations:** 7-column comparison grid with active adoption percentages and capability inspector modal.

---

### Screen 64: System Operations & Health
- **Purpose:** Infrastructure and service monitor: API status, database latency, Redis/job queues, and background outbox status.
- **Primary User:** Platform DevOps / site reliability engineer.
- **Entry Point:** Navigation "Operations" (`/operations`).
- **API Dependencies:** `GET /api/v1/admin/operations/health`.
- **Primary Actions:** View health check endpoints (`/health`), inspect dead-letter outbox events, trigger queue retry.
- **Empty State:** All systems healthy indicator (green checkmark).
- **Loading State:** Diagnostic pulse indicator.
- **Error State:** Prominent red banner with active failing service identifier.
- **Mobile Considerations:** Critical status cards with alert notifications.
- **Desktop Considerations:** Real-time telemetry dashboard with latency p50/p95/p99 graphs, queue depths, and server uptime stats.

---

### Screen 65: Audit Logs
- **Purpose:** Tamper-evident administrative audit trail: every login, merchant suspension, plan modification, and privileged query.
- **Primary User:** Platform security and compliance officer.
- **Entry Point:** Navigation "Audit Logs" (`/audit-logs`).
- **API Dependencies:** `GET /api/v1/admin/audit-logs`.
- **Primary Actions:** Filter by action type, filter by admin user, search by target ID, export signed audit log.
- **Empty State:** "No audit events matching criteria."
- **Loading State:** Table skeleton.
- **Error State:** "Failed to load audit trail."
- **Mobile Considerations:** Chronological event feed with timestamp and actor name.
- **Desktop Considerations:** Searchable forensic table with timestamp, admin ID, IP address, action code, resource target, and before/after JSON diff viewer.

---

### Screen 66: Platform Settings & Feature Flags
- **Purpose:** Global platform configuration: maintenance mode toggle, signup gates, SMS rate limits, and global announcement banners.
- **Primary User:** Super administrator.
- **Entry Point:** Navigation "Platform Settings" (`/settings`).
- **API Dependencies:** `GET /api/v1/admin/settings`, `PATCH /api/v1/admin/settings`.
- **Primary Actions:** Toggle global feature flags, update maintenance notice, save configuration changes.
- **Empty State:** Pre-filled with active environment settings.
- **Loading State:** Settings form skeleton.
- **Error State:** "Failed to update platform settings. Changes were not committed."
- **Mobile Considerations:** Clear toggle switches with destructive action confirmations.
- **Desktop Considerations:** Structured settings panel with immediate feedback and audit reason requirement for sensitive toggles.

---

## Screen Inventory Validation Summary

- **Total Screens Documented:** 66 / 66
- **Surface Breakdown:**
  - Platform Website: 12 screens (01 – 12)
  - Seller Auth & Onboarding: 10 screens (13 – 22)
  - Seller Application Workspace: 20 screens (23 – 42)
  - Buyer Storefront: 13 screens (43 – 55)
  - Platform Administration: 11 screens (56 – 66)
- **Completeness Check:** Every single screen includes all 10 mandatory properties: Purpose, Primary User, Entry Point, API Dependencies, Primary Actions, Empty State, Loading State, Error State, Mobile Considerations, and Desktop Considerations.
