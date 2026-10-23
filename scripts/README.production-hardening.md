# Production hardening checks

Apply the additive Prisma migrations before starting the updated API. Existing users may retain null email addresses; existing PIN login remains available. Legacy merchants without an email can verify one from Settings. Existing addresses are never replaced by this flow.

Registration requires real SMTP in development and production. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` (or `SMTP_PASS`) and `SMTP_FROM` outside source control. Production must use strong JWT/cookie secrets and `OTP_DEV_MOCK_ENABLED=false`. The mock SMS provider is test-only. Unconfigured SMS delivery fails closed; legacy recovery can use the verified email or a configured SMS gateway.

Email codes expire after ten minutes, allow five verification attempts and have a 60-second resend cooldown. Sends are limited to five per 15 minutes per normalized email and phone, with the existing IP throttling. Successful verification and PIN-setup proofs are single-use. Old fixed-code challenges are invalidated by the migration. Duplicate-account registration responses are generic and do not dispatch unsolicited codes to existing account addresses.

Set `NEXT_PUBLIC_SELLER_URL` (or the server-side seller origin setting) for the intended deployment. The initial origin is serialized with the landing page to preserve hydration and CTA routing.

Run these against local services and the local database; no production checkout or payment test is supported:

```powershell
pnpm --filter @simply/i18n build
pnpm --filter @simply/seller exec tsc --noEmit
pnpm --filter @simply/storefront exec tsc --noEmit
pnpm --filter @simply/api build
pnpm --filter @simply/api test -- --no-cache
pnpm --filter @simply/storefront build
pnpm --filter @simply/db exec prisma validate
pnpm --filter @simply/db exec prisma migrate status
node scripts/test-production-data.mjs
```

With API on port 4000, storefront on 3000 and Seller on 3001:

```powershell
$env:RUN_PRODUCTION_BROWSER='1'
$env:RUN_SELLER_UI='1'
$env:RUN_LOCAL_LOAD='1'
node scripts/test-production-data.mjs
Remove-Item Env:RUN_PRODUCTION_BROWSER, Env:RUN_SELLER_UI, Env:RUN_LOCAL_LOAD
node scripts/test-landing-journey.mjs
node scripts/test-landing-routing.mjs
node scripts/test-mobile-cart-notifications.mjs
node scripts/test-landing-screen4.mjs
node scripts/test-storefront-browsers.mjs
```

The data script creates uniquely named owned tenants, users, carts, customers and COD/prepaid order records, verifies their behavior, and cleans up its fixtures in `finally`. Mail/SMS/order notifications in fixture tests are intercepted. The browser checkout test also intercepts order/payment APIs; no gateway payment is made. The load harness makes read-only mixed-store requests at 25/50/100 concurrent users. These short local results do not establish deployment-host capacity. Browser binaries are required for Chrome, Edge, Firefox and Playwright WebKit; WebKit is not physical Safari.

Use `PLAYWRIGHT_BROWSERS_PATH`, `TEMP`, `TMP` and the supported artifact-directory environment variables to keep browser binaries, temporary files and evidence on a drive with sufficient free space. Scripts write JSON evidence and screenshots under `artifacts/`.
