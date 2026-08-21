# Database Migration: Local Docker to Neon Cloud

This guide walks you through exporting your existing local PostgreSQL database (running in Docker) and importing it directly into your new Neon Cloud database.

## Step 1: Export Data from Local Docker

Ensure your local docker containers are currently running (`docker-compose up -d`). Then run this command in your terminal to create a dump file of your database:

```bash
docker exec feni-postgres pg_dump -U feni_user -d feni_hotel --clean --if-exists --no-owner > feni_dump.sql
```

*Note: The `--clean --if-exists` flags ensure that when we import this to Neon, it will cleanly overwrite any existing tables (like those created by Prisma) and perfectly replace them with your local schema and data.*

## Step 2: Import Data into Neon Cloud DB

Next, read the `feni_dump.sql` file and pipe it directly into your Neon database.

**Option A: If you have `psql` installed on your machine natively**
```bash
psql "postgresql://<USER>:<PASSWORD>@<HOST>/<DATABASE>?sslmode=require" < feni_dump.sql
```

**Option B: If you DON'T have `psql` installed natively**
You can use a temporary Docker container to run the `psql` command for you:
```bash
docker run --rm -i postgres:15-alpine psql "postgresql://<USER>:<PASSWORD>@<HOST>/<DATABASE>?sslmode=require" < feni_dump.sql
```

## Step 3: Verify Admin User (Optional)

Because this completely replaces your Neon database with your local database, the `admin@senforge.com` user previously seeded might be overwritten by whatever admin users existed in your local database. 

If you are unable to log into the Cloud Dashboard after this migration, you can just re-run the seed script to recreate the super admin on the Neon DB:

```bash
cd frontend
npx tsx scripts/seed-admin.ts
```
