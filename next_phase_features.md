# Feni Hotel - Next Phase Implementation Plan

This document outlines the architecture and implementation steps for the next major features discussed. It serves as the starting context for a new agent session.

## 1. Multi-Location Inventory Tracking
Currently, the system uses a single `stockQty` integer on the `Product` table. To support Nigerian market realities, we need to split this into physical locations (e.g., "Main Store/Warehouse" vs "Bar" vs "Kitchen Fridge").

### Architecture & Schema Changes
- **Entities:**
  - Create `InventoryLocation` (e.g., `id`, `name`, `type`).
  - Create `InventoryStock` (e.g., `id`, `product_id`, `location_id`, `quantity`).
  - Remove the global `stockQty` from the `Product` entity, replacing it with a `OneToMany` relationship to `InventoryStock`.
- **Intake Flow (`InventoryIntakeService`):**
  - Update the intake UI and backend to specify *which* location is receiving the goods (usually the Main Store).
- **POS Sale Flow (`PosSaleService`):**
  - Ensure sales are deducted from the correct local inventory (e.g., Bar sales deduct from the Bar stock, not the Main Store).
- **Stock Transfers:**
  - Build a new internal workflow/UI for transferring stock (e.g., requisitioning 2 crates of beer from the Main Store to the Bar).
  - This requires new double-entry ledger lines or an internal inventory movement ledger.

## 2. Local-Only Product Images
To improve the POS touchscreen experience without bloating cloud storage costs, we will add product images that exist *only* on the local facility server.

### Architecture & Schema Changes
- **Database:**
  - Add `imageUrl` (String) to the local `Product` entity in Postgres. Do not add this to the Cloud Prisma schema, and do not include it in the `OutboxSyncWorker` payload mapping.
- **Backend Storage:**
  - Create an endpoint `POST /api/products/{id}/image`.
  - Store the uploaded image file directly to the local file system (in the `uploads/` directory mapped via Spring WebMvc config and Docker volumes).
- **Frontend UI (Local Dashboard):**
  - Update `/admin/products` to include a file upload input.
  - Update `/pos` (Checkout Modal & Grid) to display the uploaded images on the product cards instead of just text/colors.
