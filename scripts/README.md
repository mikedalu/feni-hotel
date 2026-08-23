# Disaster Recovery Scripts

These scripts are designed to safely backup and restore Feni Hotel's production database and ID scan uploads directly from the Docker named volumes.

## Backup Process

Run the backup script manually:
```bash
./scripts/backup.sh
```
This will create two files in the `./backups/` directory (automatically created):
1. `db_backup_YYYYMMDD_HHMMSS.sql.gz` - The Postgres database dump.
2. `uploads_backup_YYYYMMDD_HHMMSS.tar.gz` - The archived guest ID scans.

### Automated Backups (Cron Job)

To ensure backups happen automatically every night at 2:00 AM, add this script to your server's cron jobs:

1. Open crontab:
   ```bash
   crontab -e
   ```
2. Add the following line (replace `/path/to/feni-hotel` with your actual path):
   ```cron
   0 2 * * * cd /path/to/feni-hotel && ./scripts/backup.sh >> ./backups/backup.log 2>&1
   ```

*(Note: Ensure that whatever user runs the cron job has permissions to execute `docker` commands).*

## Restoration Process

If the server crashes or the Docker volumes are wiped, you can restore everything using the `restore.sh` script.

1. Ensure the postgres container is running:
   ```bash
   docker compose up -d postgres
   ```
2. Run the restore script, passing the exact paths to the database and uploads backup files:
   ```bash
   ./scripts/restore.sh backups/db_backup_20260821_120000.sql.gz backups/uploads_backup_20260821_120000.tar.gz
   ```
3. Restart the backend container to ensure it reconnects to the newly restored database:
   ```bash
   docker compose restart backend
   ```
