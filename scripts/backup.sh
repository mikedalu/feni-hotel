#!/bin/bash

# ==============================================================================
# Feni Hotel - Disaster Recovery Backup Script
# Automatically creates compressed backups of the Postgres database and ID Scans
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="feni-postgres"
DB_USER="feni_user"
DB_NAME="feni_hotel"
UPLOAD_VOLUME="feni-hotel_feni_uploads"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Feni Hotel backup sequence..."

# 1. Backup PostgreSQL Database
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
echo "-> Backing up PostgreSQL database to $DB_BACKUP_FILE..."

# Execute pg_dump inside the running postgres container and gzip the output
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$DB_BACKUP_FILE"

# 2. Backup Uploads (Named Volume)
UPLOAD_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"
echo "-> Backing up uploads volume to $UPLOAD_BACKUP_FILE..."

# Run a temporary alpine container attached to the uploads volume to tar its contents
docker run --rm \
  -v "$UPLOAD_VOLUME":/volume \
  -v "$(pwd)/$BACKUP_DIR":/backup \
  alpine \
  tar -czf /backup/uploads_backup_$TIMESTAMP.tar.gz -C /volume .

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup sequence completed successfully!"
echo "Files created:"
echo " - $DB_BACKUP_FILE"
echo " - $UPLOAD_BACKUP_FILE"

# Optional: Clean up old backups (keep last 7 days)
# find "$BACKUP_DIR" -type f -name "*.gz" -mtime +7 -exec rm {} \;
