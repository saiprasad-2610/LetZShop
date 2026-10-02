# Backup and Disaster Recovery Runbook

This document defines the backup, retention, offsite replication, and disaster recovery (DR) procedures for the **Simply E-Commerce** platform running on standard Linux VPS or Hostinger KVM instances.

---

## 1. Backup Strategy Overview

Simply E-Commerce uses a multi-layered disaster recovery architecture designed for recovery point objective (RPO) < 15 minutes and recovery time objective (RTO) < 30 minutes.

| Asset | Mechanism | Frequency | Storage Location | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | `pg_dump` Custom Format (`-F c`) | Daily @ 02:00 UTC | Local `/var/backups` + S3/Offsite | 14 days daily, 4 weekly |
| **Transaction Logs (WAL)** | Continuous Archiving (`pgBackRest`/`archive_command`) | Continuous (every 5m / 16MB) | S3 Object Storage bucket | 7 days continuous PITR |
| **Product Media Files** | Atomic Tarball / S3 Bucket replication | Daily @ 02:30 UTC | Local `/var/backups` + S3 Bucket | 14 days daily |
| **Configuration & Secrets** | Encrypted Git / Vault (`.env.production.enc`) | On change | Secure offsite repository | Immutable history |

---

## 2. Automated Backup Scripts

Production scripts are located in the `scripts/` directory:
- Linux / Bash: [`scripts/backup.sh`](file:///d:/Simply%20-%20E%20Commerce/scripts/backup.sh) and [`scripts/restore.sh`](file:///d:/Simply%20-%20E%20Commerce/scripts/restore.sh)
- Windows / PowerShell: [`scripts/backup.ps1`](file:///d:/Simply%20-%20E%20Commerce/scripts/backup.ps1) and [`scripts/restore.ps1`](file:///d:/Simply%20-%20E%20Commerce/scripts/restore.ps1)

### 2.1 Backup Process Execution

The backup script performs:
1. **PostgreSQL Custom Binary Dump**:
   ```bash
   pg_dump "${DATABASE_URL}" -F c -b -v -f "${TARGET_DIR}/db_${TIMESTAMP}.dump"
   ```
   *Note: Custom format (`-F c`) enables parallel restoration (`-j`), table-level selective recovery, and built-in compression.*
2. **Media Archive**:
   ```bash
   tar -czf "${TARGET_DIR}/media_${TIMESTAMP}.tar.gz" -C "${MEDIA_DIR}" .
   ```
3. **Manifest Creation**:
   Emits `manifest.json` containing ISO timestamps, checksums, and metadata for audit trails.
4. **Local Retention Cleanup**:
   Automatically deletes local backup directories older than 14 days.

---

## 3. Hostinger VPS / Linux Cron Setup

To schedule automated daily backups on Hostinger VPS or standard Ubuntu/Debian:

### Step 1: Ensure Prerequisites
```bash
sudo apt-get update && sudo apt-get install -y postgresql-client awscli
sudo mkdir -p /var/backups/simply-ecommerce /data/media
sudo chown -R deploy:deploy /var/backups/simply-ecommerce /data/media
```

### Step 2: Configure System Cron
Edit the deployment user crontab (`crontab -e`):

```cron
# Daily full backup at 02:00 AM UTC
0 2 * * * /opt/simply-ecommerce/scripts/backup.sh /var/backups/simply-ecommerce /data/media >> /var/log/simply-backup.log 2>&1

# Daily offsite replication to secure Cloudflare R2 / AWS S3 at 03:00 AM UTC
0 3 * * * aws s3 sync /var/backups/simply-ecommerce/ s3://simply-ecommerce-backups-mumbai/vps/ --delete >> /var/log/simply-sync.log 2>&1
```

---

## 4. Point-In-Time Recovery (PITR) Architecture

For environments requiring sub-hour RPO, enable continuous WAL archiving in `postgresql.conf`:

```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/backups/pg_wal/%f && cp %p /var/backups/pg_wal/%f'
# Or upload directly to S3 via pgBackRest/wal-g:
# archive_command = 'wal-g wal-push %p'
```

### PITR Restoration Procedure:
1. Stop the PostgreSQL service:
   ```bash
   sudo systemctl stop postgresql
   ```
2. Clean or move the corrupted `$PGDATA` directory.
3. Restore base backup snapshot into `$PGDATA`.
4. Create a `recovery.signal` file in `$PGDATA`.
5. Configure target recovery point in `postgresql.conf`:
   ```ini
   restore_command = 'cp /var/backups/pg_wal/%f %p'
   recovery_target_time = '2026-10-01 10:15:00 UTC'
   recovery_target_action = 'promote'
   ```
6. Start PostgreSQL service. Database replays WAL up to the specified microsecond.

---

## 5. Restoration Runbook (Disaster Recovery)

Follow this step-by-step procedure during a disaster recovery scenario (e.g. data corruption, server hardware failure, or host migration).

### Scenario A: Full Restore to New Server

1. **Provision New Hostinger VPS**:
   - Install OS (Ubuntu 24.04 LTS), Node.js 22 LTS, pnpm, and PostgreSQL 16+.
   - Clone codebase to `/opt/simply-ecommerce`.

2. **Download Latest Backup from Offsite Storage**:
   ```bash
   aws s3 sync s3://simply-ecommerce-backups-mumbai/vps/latest/ /var/backups/recovery/
   ```

3. **Verify Manifest**:
   ```bash
   cat /var/backups/recovery/manifest.json
   ```

4. **Execute Restore Script**:
   ```bash
   export DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/simply_ecommerce"
   /opt/simply-ecommerce/scripts/restore.sh /var/backups/recovery "${DATABASE_URL}" /data/media
   ```

5. **Run Pending Database Migrations** (if binary was from an earlier release):
   ```bash
   pnpm db:migrate:deploy
   ```

6. **Start Application Services**:
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

7. **Health Verification**:
   ```bash
   curl -f http://localhost:4000/health/ready
   # Expected: {"status":"ok","info":{"database":{"status":"up"},"storage":{"status":"up"}}}
   ```

---

## 6. Disaster Recovery Drills & Verification

Conduct DR drills quarterly:
- **Test Database Verification**:
  Automated CI pipeline restores the latest backup dump into a throwaway PostgreSQL container (`simply_ecommerce_test`) and runs `pnpm test:e2e` to verify foreign keys, sequences, and data integrity.
- **Media File Integrity**:
  Execute `tar -tzf media_<timestamp>.tar.gz` to verify gzip archive checksums without uncompressing the full disk.
- **Tenant Isolation Audit**:
  Post-restoration, verify that Tenant A and Tenant B data remain cleanly separated and no orphaned foreign keys exist.
