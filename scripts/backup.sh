#!/usr/bin/env bash
# ==============================================================================
# Simply E-Commerce Production Backup Script (Linux / VPS / Hostinger)
# ==============================================================================
set -euo pipefail

BACKUP_ROOT="${1:-/var/backups/simply-ecommerce}"
MEDIA_DIR="${2:-/data/media}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/simply_ecommerce}"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

echo "📦 [${TIMESTAMP}] Starting Simply E-Commerce Backup..."
mkdir -p "${TARGET_DIR}"

# 1. PostgreSQL custom-format compressed binary dump
echo "  -> Dumping PostgreSQL database..."
pg_dump "${DB_URL}" -F c -f "${TARGET_DIR}/db_${TIMESTAMP}.dump"

# 2. Archive Media Directory (atomic tar.gz)
if [ -d "${MEDIA_DIR}" ]; then
  echo "  -> Archiving media files..."
  tar -czf "${TARGET_DIR}/media_${TIMESTAMP}.tar.gz" -C "${MEDIA_DIR}" .
fi

# 3. Create Manifest
cat <<EOF > "${TARGET_DIR}/manifest.json"
{
  "timestamp": "${TIMESTAMP}",
  "db_dump": "db_${TIMESTAMP}.dump",
  "media_archive": "media_${TIMESTAMP}.tar.gz",
  "retention_days": ${RETENTION_DAYS}
}
EOF

# 4. Prune old backups older than RETENTION_DAYS
echo "  -> Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +

echo "✅ [${TIMESTAMP}] Backup completed successfully at ${TARGET_DIR}"
