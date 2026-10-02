# Simply E-Commerce - Buyer Storefront (PWA / Web)

This package represents the buyer-facing storefront application.

## Key Architectural Principles
- **No Mandatory Login**: Seamless anonymous guest checkout.
- **Mobile-First PWA**: Responsive web + installable Progressive Web App.
- **Dynamic Theming**: Configurable store sections and theme presets based on tenant branding.
- **Subscription-Gated**: Served only when merchant subscription is `ACTIVE` and within `paid_through` timestamp.
- **Fast Performance**: Next.js App Router, SSR/SSG caching, minimal JavaScript overhead.
