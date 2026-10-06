# SIMPLY E-COMMERCE — MOTION SYSTEM & INTERACTION GUIDE

**Document Version:** 1.0.0  
**Status:** Approved Motion Architecture  
**Scope:** All Frontend Applications (Platform Website, Seller Application, Buyer Storefronts, Admin)

---

## 1. Motion Principles

Motion in Simply E-Commerce is a **functional tool for spatial orientation, feedback, and intent**, not visual entertainment or decorative flair.

### Core Motion Tenets
1. **Fast:** Users should never wait for an animation to complete before they can act. Interactive animations range between `150ms` and `250ms`. Complex spatial transitions never exceed `350ms`.
2. **Natural:** Use custom cubic-bezier easing curves that mimic physical inertia (decelerate smoothly on arrival, accelerate naturally on departure). Never use linear motion for spatial elements.
3. **Subtle:** Micro-animations guide the eye without shouting. Shifts in opacity, tiny vertical offsets (`2px` - `8px`), and gentle scale changes (`0.98` to `1.0`) are preferred over dramatic swings.
4. **Purposeful:** Every animation must answer at least one UX question:
   - *Where did this element come from?* (Directional entry)
   - *Did the system receive my tap?* (Active scale/color response)
   - *Where is my newly added item?* (Cart badge bump)
   - *Has my change been saved?* (Subtle checkmark reveal)
5. **Selective:** **Do NOT animate everything.** Static text, non-interactive layouts, and standard data tables remain stable to maintain calm focus.

---

## 2. Motion Tokens & Timing Hierarchy

All transitions must use these standardized tokens to maintain cohesive temporal rhythm:

| Token Name | Duration | Timing Function | Primary Use Case |
| :--- | :--- | :--- | :--- |
| `motion-instant` | `75ms` | `linear` | Button active press, checkbox toggle, immediate hover color |
| `motion-fast` | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Tooltips, dropdown menus, variant chip selection, badge counter |
| `motion-base` | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Modals, bottom sheets, toast notifications, drawer slides |
| `motion-moderate`| `320ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, hero reveals, theme preview re-rendering |
| `motion-slow` | `450ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Staggered list reveals on initial screen load |

### 2.1 Standard Easing Curves
```css
:root {
  /* Emphasized deceleration: fast entrance that lands gracefully */
  --ease-out-natural: cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Sharp acceleration: elements departing the viewport swiftly */
  --ease-in-sharp: cubic-bezier(0.4, 0, 1, 1);
  
  /* Smooth symmetrical transition: continuous morphing */
  --ease-in-out-smooth: cubic-bezier(0.65, 0, 0.35, 1);
}
```

---

## 3. The 9 Canonical Motion Categories

```
┌────────────────────────────────────────────────────────────────────────┐
│                      9 CANONICAL MOTION CATEGORIES                     │
└────────────────────────────────────────────────────────────────────────┘
  1. Page Transition          2. Section Reveal         3. Drawer
  4. Modal                    5. Bottom Sheet           6. Cart Feedback
  7. Variant Image Transition 8. Theme Preview Switch   9. Save Confirmation
```

### 3.1 Category 1: Page Transition
- **Purpose:** Provide seamless spatial continuity between routes without jarring white flashes.
- **Specification:**
  - Departing page: `opacity: 1 -> 0`, duration `100ms`, `ease-in`.
  - Arriving page: `opacity: 0 -> 1`, `transform: translateY(4px) -> translateY(0)`, duration `200ms`, `ease-out`.
  - Never slide the entire viewport horizontally on desktop; use vertical settle.

### 3.2 Category 2: Section Reveal (Scroll)
- **Purpose:** Gently introduce high-value content blocks (e.g. editorial stories, categories) as the user scrolls.
- **Specification:**
  - Threshold: Trigger when section is `15%` visible.
  - Settle: `opacity: 0 -> 1`, `transform: translateY(12px) -> translateY(0)`.
  - Duration: `300ms`, single execution per page session (no re-triggering on scroll-up).

### 3.3 Category 3: Contextual Drawer (Slide-Over)
- **Purpose:** Used on desktop for side-by-side editing (product details, inventory adjustments, cart summary).
- **Specification:**
  - Backdrop: `opacity: 0 -> 0.4`, duration `200ms`.
  - Drawer Panel: `transform: translateX(100%) -> translateX(0)`, duration `250ms`, `var(--ease-out-natural)`.
  - Dismiss: `transform: translateX(0) -> translateX(100%)`, duration `180ms`, `var(--ease-in-sharp)`.

### 3.4 Category 4: Modal Dialog
- **Purpose:** High-focus confirmation dialogs (cancel order, delete media asset, unsaved changes).
- **Specification:**
  - Backdrop: `opacity: 0 -> 0.5`, duration `150ms`.
  - Dialog Window: `opacity: 0 -> 1`, `transform: scale(0.96) -> scale(1.0)`, duration `180ms`.
  - Dismissal: `opacity: 1 -> 0`, `transform: scale(1.0) -> scale(0.98)`, duration `120ms`.

### 3.5 Category 5: Mobile Bottom Sheet
- **Purpose:** Primary interaction surface for mobile editing, variant picking, and checkout steps.
- **Specification:**
  - Entry: `transform: translateY(100%) -> translateY(0)`, duration `260ms`, `var(--ease-out-natural)`.
  - Gesture: Supports drag-to-dismiss threshold (`> 80px` pull-down or velocity `> 0.5px/ms`).
  - Dismissal: `transform: translateY(0) -> translateY(100%)`, duration `200ms`.

### 3.6 Category 6: Cart Feedback (Micro-Interaction)
- **Purpose:** Confirm that a product variant was added to the cart without interrupting the browsing flow.
- **Specification:**
  - Button state: Label changes to *"Added"* with subtle green tint for `1200ms`.
  - Header Cart Badge: Scale bump `1.0 -> 1.25 -> 1.0` over `220ms` with count increment.
  - Optional mini-toast appears docked near thumb zone for `2500ms`.

### 3.7 Category 7: Variant Image Transition
- **Purpose:** When a buyer selects a different variant (e.g. changing color from "Navy" to "Cognac"), the gallery swaps images.
- **Specification:**
  - Active photo: Crossfade `opacity: 0.3 -> 1.0` over `180ms`.
  - Layout: Aspect ratio container is strictly fixed; zero layout shift occurs during image swap.

### 3.8 Category 8: Theme Preview Transition (Brand Studio)
- **Purpose:** When a seller switches themes (e.g. from `ATELIER` to `PULSE`) in Brand Studio, preview updates fluidly.
- **Specification:**
  - Preview frame: Subtle pulse overlay (`opacity: 0.2`) for `150ms` while CSS variables swap.
  - Typography & Colors: Smooth transition of CSS variables over `250ms`.

### 3.9 Category 9: Save Confirmation
- **Purpose:** Reassure the seller that changes to store settings, pricing, or product content are persisted.
- **Specification:**
  - Save button: Replaces label with checkmark icon and text *"Saved"*.
  - Settle time: `1500ms` before reverting back to default state.
  - Sound: Strictly silent; no browser audio triggers.

---

## 4. Accessibility & Reduced Motion

Respecting users who experience vestibular disorders or motion sickness is mandatory.

### 4.1 Strict `prefers-reduced-motion` Implementation
When the user has enabled reduced motion in their OS:
1. **Disable all spatial displacement:** No `translate`, `scale`, or `rotate` animations.
2. **Replace with instantaneous or pure opacity fades:**
   - Drawers and bottom sheets appear instantly or with a simple `80ms` opacity fade.
   - Page transitions become instant route swaps.
   - Section scroll reveals are disabled; content renders at full opacity immediately.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Fallback for essential state indicators */
  .motion-fade-reduced {
    transition: opacity 80ms ease !important;
  }
}
```

---

## 5. Performance Invariants

To guarantee 60fps/120fps performance across low-end mobile devices:
1. **GPU-Accelerated Properties Only:** Animate **ONLY** `transform` and `opacity`.
2. **Never Animate Layout Properties:** Never animate `width`, `height`, `margin`, `padding`, `top`, `left`, `bottom`, `right`, or `border-width`. Animating these causes continuous browser reflows (layout thrashing) and destroys battery life.
3. **Use `will-change` Sparingly:** Apply `will-change: transform, opacity` only to active drawers during touch drag gestures, and remove it once the drawer settles.
4. **Aspect-Ratio Reservation:** All media containers must reserve aspect ratio via CSS `aspect-ratio` or padding container rules before images load so animations do not jump. Aspect-ratio reservation minimizes/prevents image-induced layout shift. (Actual Core Web Vitals will be measured and benchmarked later).
