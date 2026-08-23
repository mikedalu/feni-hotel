# Feni Hotel - Facility Server Deployment Guide

This guide covers everything required to deploy the Feni Hotel system onto a brand new on-premise facility server (e.g., a Mini-PC or NUC) using the pre-built Docker containers from the GitHub Container Registry.

## 1. System Prerequisites

The facility server must be running **Ubuntu Server 22.04 LTS** (or newer) and be connected to the facility's local network router.

Run the following commands to install the required system dependencies:

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose -y

# Install Avahi for local network discovery (hotel-hub.local)
sudo apt install avahi-daemon avahi-utils -y

# Enable and start services
sudo systemctl enable docker avahi-daemon
sudo systemctl start docker avahi-daemon
```

## 2. GitHub Container Registry (GHCR) Authentication

Because the Feni Hotel Docker images are stored in a private GitHub registry, the server needs to authenticate with GitHub before it can pull them.

1. Go to your GitHub account settings: **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)**.
2. Generate a new token with the **`read:packages`** scope.
3. On the facility server, log in to Docker:

```bash
echo "YOUR_GITHUB_PAT" | sudo docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## 3. Environment Variables Configuration

Create a dedicated directory for the deployment and configure your `.env` file.

```bash
mkdir -p /opt/feni-hotel && cd /opt/feni-hotel
nano .env
```

Paste the following into your `.env` file and replace the placeholder values:

```env
# -----------------------------
# REQUIRED: JWT & Security
# -----------------------------
# MUST be a securely generated 256-bit (or longer) secret. Fail loudly if missing.
# Generate one via: openssl rand -base64 32
JWT_SECRET=replace_me_with_secure_random_string

# The password for the default 'admin' user created on first boot.
BOOTSTRAP_ADMIN_PASSWORD=your_secure_admin_password

# -----------------------------
# REQUIRED: Cloud Sync
# -----------------------------
# The URL of your Vercel-hosted Cloud Backend (e.g., https://app.senforge.com)
CLOUD_API_URL=https://your-cloud-url.vercel.app

# The API Key generated from the Cloud Dashboard (Settings -> API Integration)
CLOUD_API_KEY=your_generated_facility_api_key

# -----------------------------
# OPTIONAL: Email (Gmail SMTP)
# -----------------------------
GMAIL_SENDER_ADDRESS=your.hotel@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

## 4. Docker Compose Configuration

Create the production `docker-compose.yml` file to pull the pre-built images.

```bash
nano docker-compose.yml
```

Paste the following configuration:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: feni-postgres
    environment:
      POSTGRES_DB: feni_hotel
      POSTGRES_USER: feni_user
      POSTGRES_PASSWORD: feni_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: feni-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    image: ghcr.io/mikedalu/feni-hotel-backend:latest
    container_name: feni-backend
    env_file: 
      - .env
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/feni_hotel
      - SPRING_DATASOURCE_USERNAME=feni_user
      - SPRING_DATASOURCE_PASSWORD=feni_password
      - SPRING_DATA_REDIS_HOST=redis
      - SPRING_JPA_HIBERNATE_DDL_AUTO=update
    ports:
      - "8080:8080"
    volumes:
      - feni_uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    image: ghcr.io/mikedalu/feni-hotel-frontend:latest
    container_name: feni-frontend
    ports:
      - "80:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  feni_uploads:
```

> **Note**: In production, the frontend maps directly to port `80` so tablets can reach it at `http://hotel-hub.local` without specifying port `:3000`.

## 5. Starting the Server

1. **Pull the latest images** (This ensures you are running the exact code pushed via GitHub Actions):
   ```bash
   sudo docker-compose pull
   ```

2. **Start the containers** in detached mode:
   ```bash
   sudo docker-compose up -d
   ```

3. **Verify the logs** to ensure the backend started correctly and the `DataSeeder` created the default admin account:
   ```bash
   sudo docker-compose logs -f backend
   ```

## 6. Local Network Access

Once the containers are running, you can access the system from any device (tablet, laptop) on the same Wi-Fi network:

- **Frontend Application**: `http://hotel-hub.local`
- **Backend API Docs**: `http://hotel-hub.local:8080/swagger-ui.html`

## 7. Next Steps & Post-Install

1. **Log into the POS dashboard** at `http://hotel-hub.local` using the username `admin` and the `BOOTSTRAP_ADMIN_PASSWORD` you provided in `.env`.
2. **Force Password Reset**: You will be immediately prompted to change the admin password upon first login.
3. **Verify Cloud Connection**: The backend's Outbox Sync Worker will automatically begin attempting to hit your `CLOUD_API_URL` with the `CLOUD_API_KEY`. Check the cloud dashboard to confirm the facility appears as "Connected".

## 8. Testing and Staging Environments

If you want to test changes on a server before deploying them to the live production instance, you have two options:

**Option A: Separate Directory & Ports (Same Server)**
You can run a staging environment on the exact same server by creating a second directory (e.g., `/opt/feni-hotel-staging`).
1. Create a second `docker-compose.yml` and `.env` in the staging directory.
2. Change all the exposed ports in the staging `docker-compose.yml` to avoid conflicts (e.g., map frontend to `8080:3000`, backend to `8081:8080`, Postgres to `5433:5432`).
3. Change the image tags to pull a specific testing branch instead of `:latest` (e.g., `ghcr.io/mikedalu/feni-hotel-backend:develop`).
4. Access your staging environment at `http://hotel-hub.local:8080`.

**Option B: Separate Testing Device (Recommended)**
Since Feni is designed to run on relatively inexpensive Mini-PCs at the facility, the safest approach is to have a dedicated "Staging Mini-PC" at headquarters. You deploy your `develop` or testing branches to this device exactly as you would in production, verify everything works locally, and only then merge to `main` to trigger the production build for the actual facility servers.
