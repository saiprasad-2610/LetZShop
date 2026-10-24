# LETZSHOP PRODUCTION ROLLBACK & CONTINGENCY PLAYBOOK

**Document ID:** LETZSHOP-ROLLBACK-2026-10-24
**Classification:** Operational Safety & Disaster Recovery
**Target Architecture:** Hostinger VPS / Docker / PostgreSQL / Vercel Frontends

---

## 1. Principles of Safe Rollback

1. **Forward Database Compatibility:** All 4 new Prisma migrations applied during the merge are purely additive (new columns with default/null values, new table `autopay_mandates`). Consequently, the previous Codebase A backend container can run against the updated database schema without errors or data collisions.
2. **Zero In-Place Overwrites:** Never delete or alter production databases or volumes during an incident. Always roll back through controlled container replacement or DNS traffic redirection.
3. **Decoupled Frontend & Backend:** The 3 Vercel frontends and the Hostinger VPS backend can be rolled back independently.

---

## 2. Decision Matrix: When to Initiate a Rollback

| Observed Incident Severity | Impacted Layer | Recommended Action | Estimated RTO |
| :--- | :--- | :--- | :--- |
| **Critical:** Backend container fails to boot or health check repeatedly returns 500/503. | Backend API | Roll back Docker container image to previous tag on VPS. | < 2 minutes |
| **High:** Frontend displays white screen, hydration errors, or broken route navigation on Vercel. | Frontends | Instant rollback of deployment on Vercel Dashboard. | < 30 seconds |
| **High:** Payment webhook processing fails or duplicate orders occur. | Payments / API | Revert API image to previous stable tag; check advisory lock logs. | < 5 minutes |
| **Catastrophic:** Corrupted database state or accidental table modification. | Database | Point-in-time restore from pre-merge pg_dump backup snapshot. | 15–30 minutes |

---

## 3. Step-by-Step Rollback Procedures

### 3.1 Backend Rollback on Hostinger VPS

If the newly deployed API container encounters unresolvable runtime errors:

1. **SSH into Hostinger VPS:**
   ```bash
   ssh user@your-hostinger-vps-ip
   cd /opt/letzshop
   ```

2. **Revert to Previous Docker Image Tag or Git Commit:**
   ```bash
   # If using git commit tag:
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>

   # Rebuild and restart the stable baseline container:
   docker compose -f docker-compose.production.yml build
   docker compose -f docker-compose.production.yml up -d
   ```

3. **Verify Health Endpoint:**
   ```bash
   curl -i http://localhost:4000/health
   # Verify HTTP 200 OK
   ```

4. **Note on Database:**
   Do **NOT** attempt to drop the new columns or the `autopay_mandates` table. The previous Codebase A version ignores unrecognized columns and operates safely.

---

### 3.2 Frontend Rollback on Vercel (Instant Instantaneous Rollback)

If any of the 3 frontend applications fail in production:

1. Open your **Vercel Team Dashboard**.
2. Select the affected project:
   - `letzshop-storefront`
   - `letzshop-seller`
   - `letzshop-admin`
3. Navigate to the **Deployments** tab.
4. Locate the previous stable production deployment (marked with a green checkmark).
5. Click the three dots (`...`) on the right and select **Promote to Production** (or **Instant Rollback**).
6. Vercel instantly routes 100% of incoming live edge traffic to the previous immutable build artifact within 5 seconds.

---

### 3.3 Database Emergency Restoration Procedure

If catastrophic database corruption occurs:

1. **Stop Incoming Traffic to Prevent Further Mutation:**
   ```bash
   # On Hostinger VPS, temporarily stop the API container:
   docker compose -f docker-compose.production.yml stop api
   ```

2. **Identify Pre-Merge Backup Dump:**
   ```bash
   ls -la /opt/backups/letzshop_backup_pre_merge_*.dump
   ```

3. **Restore Backup Snapshot using `pg_restore`:**
   ```bash
   # Clean existing schema and restore exact snapshot state:
   pg_restore -v --clean --if-exists --no-owner --no-privileges \
     -d "$DATABASE_URL" /opt/backups/letzshop_backup_pre_merge_20261024_XXXXXX.dump
   ```

4. **Verify Database Consistency:**
   ```sql
   -- Log into psql and run:
   SELECT count(*) FROM "tenants";
   SELECT count(*) FROM "products";
   SELECT count(*) FROM "orders";
   ```

5. **Restart API Container:**
   ```bash
   docker compose -f docker-compose.production.yml start api
   ```

6. **Confirm System Operational:**
   - Test Super Admin login at `https://admin.letzshop.store`.
   - Test merchant login at `https://seller.letzshop.store`.
   - Test storefront catalog at `https://www.letzshop.store`.

---

## 4. Post-Rollback Review & Incident Reporting

Following any rollback:
1. Preserve container logs: `docker compose -f docker-compose.production.yml logs --tail=1000 api > /opt/incident_logs.txt`.
2. Inspect logs for exception stack traces, failed database queries, or unhandled promise rejections.
3. Test fixes in an isolated staging environment before scheduling a new release window.
