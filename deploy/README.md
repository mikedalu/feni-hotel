# Facility Server Webhook Setup

This guide explains how to set up the facility server to automatically pull the latest Docker images and restart whenever the CD pipeline finishes.

## Prerequisites

1. Install `webhook` (a lightweight open-source tool written in Go):
   ```bash
   sudo apt-get install webhook
   ```

2. Make sure the deploy script is executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Ensure Docker is authenticated with `ghcr.io` if your packages are private:
   ```bash
   echo $YOUR_GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

## Configuration

1. Edit the `hooks.json` file.
2. Change the `"value": "Bearer my-super-secret-key"` to match the secret you put in your GitHub Actions Secrets (`FACILITY_WEBHOOK_SECRET`).
3. Ensure the `execute-command` and `command-working-directory` paths match the absolute path on your facility server.

## Running the Webhook Listener

Start the webhook listener (you may want to set this up as a systemd service for persistence):

```bash
webhook -hooks hooks.json -verbose -port 9000
```

By default, the webhook listener runs on port 9000. For our `cd-pipeline.yml` curl command (`https://hotel-hub.local/api/webhooks/deploy`) to hit this, you should configure your NGINX reverse proxy (`nginx-hotel-hub.conf`) to forward `/api/webhooks/deploy` to `http://localhost:9000/hooks/deploy`.

## Local Testing

You can manually trigger a deployment from another terminal to test if it works:

```bash
curl -X POST -H "Authorization: Bearer my-super-secret-key" http://localhost:9000/hooks/deploy
```
