#!/usr/bin/env bash
# ==============================================================================
# Simply E-Commerce Production Restore Script (Linux / VPS / Hostinger)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${1:?Usage: $0 <path_to_backup_dir> [target_db_url] [target_media_dir]}"
TARGET_DB="${2:-${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/simply_ecommerce}}"
TARGET_MEDIA="${3:-/data/media}"

echo "🔄 Restoring backup from ${BACKUP_DIR}..."

# 1. Restore Database
DB_FILE=$(find "${BACKUP_DIR}" -name "*.dump" | head -n 1)
if [ -n "${DB_FILE}" ]; then
  echo "  -> Restoring database from ${DB_FILE}..."
  pg_restore -d "${TARGET_DB}" --clean --if-exists "${DB_FILE}" || true
  echo "  ✓ Database restore finished."
fi

# 2. Restore Media
MEDIA_FILE=$(find "${BACKUP_DIR}" -name "*.tar.gz" | head -n 1)
if [ -n "${MEDIA_FILE}" ]; then
  echo "  -> Restoring media to ${TARGET_MEDIA}..."
  mkdir -p "${TARGET_MEDIA}"
  tar -xzf "${MEDIA_FILE}" -C "${TARGET_MEDIA}"
  echo "  ✓ Media files restored."
fi

echo "✅ Restore process completed successfully."
