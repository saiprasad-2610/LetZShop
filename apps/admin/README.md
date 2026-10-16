# LetzShop Platform Admin

The existing Admin app runs on port 3002 and uses the same PostgreSQL-backed API as Seller and Storefront.

From the monorepo root:

```powershell
pnpm dev
pnpm admin:seed
```

Open http://localhost:3002 and use the development admin credentials printed by the seed command. Seeding refuses production and Render. To provision a different development account, set ADMIN_DEV_EMAIL, ADMIN_DEV_PHONE and ADMIN_DEV_PASSWORD before running the seed command. Production accounts must be provisioned through your existing protected administrative process.

Admin sessions use an HttpOnly cookie and backend authorization. The browser reads only authenticated platform APIs; it never connects directly to PostgreSQL.

Light/Dark preference persists under `letzshop_admin_theme`, independently of the session.

Run `pnpm test:admin` from the root with the local development database and all four apps running. This uses actual Chrome, regular business APIs and real database comparisons; it removes only its tracked temporary records.

See [the route-by-route audit](../../docs/admin-live-data-report.md) for metric definitions, sources, limitations and verification.
