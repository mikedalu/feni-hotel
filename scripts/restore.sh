#!/bin/bash

# ==============================================================================
# Feni Hotel - Disaster Recovery Restore Script
# Restores compressed backups of the Postgres database and ID Scans
# ==============================================================================

set -e

DB_CONTAINER="feni-postgres"
DB_USER="feni_user"
DB_NAME="feni_hotel"
UPLOAD_VOLUME="feni-hotel_feni_uploads"

if [ "$#" -ne 2 ]; then
    echo "Usage: ./restore.sh <path_to_db_backup.sql.gz> <path_to_uploads_backup.tar.gz>"
    echo "Example: ./restore.sh backups/db_backup_20260821_120000.sql.gz backups/uploads_backup_20260821_120000.tar.gz"
    exit 1
fi

DB_BACKUP_FILE=$1
UPLOAD_BACKUP_FILE=$2

if [ ! -f "$DB_BACKUP_FILE" ]; then
    echo "Error: Database backup file '$DB_BACKUP_FILE' not found."
    exit 1
fi

if [ ! -f "$UPLOAD_BACKUP_FILE" ]; then
    echo "Error: Uploads backup file '$UPLOAD_BACKUP_FILE' not found."
    exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Feni Hotel restoration sequence..."

# Ensure containers are running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo "Error: Database container '$DB_CONTAINER' is not running."
    echo "Please run 'docker compose up -d postgres' first."
    exit 1
fi

# 1. Restore PostgreSQL Database
echo "-> Dropping and recreating the database '$DB_NAME'..."
docker exec "$DB_CONTAINER" dropdb -U "$DB_USER" --if-exists "$DB_NAME"
docker exec "$DB_CONTAINER" createdb -U "$DB_USER" "$DB_NAME"

echo "-> Restoring PostgreSQL database from $DB_BACKUP_FILE..."
gunzip -c "$DB_BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

# 2. Restore Uploads (Named Volume)
echo "-> Restoring uploads volume from $UPLOAD_BACKUP_FILE..."

# Resolve absolute path for the tarball
UPLOAD_BACKUP_ABS_PATH=$(realpath "$UPLOAD_BACKUP_FILE")
BACKUP_DIR_ABS_PATH=$(dirname "$UPLOAD_BACKUP_ABS_PATH")
UPLOAD_FILENAME=$(basename "$UPLOAD_BACKUP_FILE")

# Run a temporary alpine container attached to the uploads volume to extract the tar
docker run --rm \
  -v "$UPLOAD_VOLUME":/volume \
  -v "$BACKUP_DIR_ABS_PATH":/backup \
  alpine \
  sh -c "rm -rf /volume/* && tar -xzf /backup/$UPLOAD_FILENAME -C /volume"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Restoration sequence completed successfully!"
echo "Please restart your backend container to ensure all data is loaded properly:"
echo "docker compose restart backend"
