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
  - Update the intake UI and backend to specify _which_ location is receiving the goods (usually the Main Store).
- **POS Sale Flow (`PosSaleService`):**
  - Ensure sales are deducted from the correct local inventory (e.g., Bar sales deduct from the Bar stock, not the Main Store).
- **Stock Transfers:**
  - Build a new internal workflow/UI for transferring stock (e.g., requisitioning 2 crates of beer from the Main Store to the Bar).
  - This requires new double-entry ledger lines or an internal inventory movement ledger.

## 2. Local-Only Product Images

To improve the POS touchscreen experience without bloating cloud storage costs, we will add product images that exist _only_ on the local facility server.

### Architecture & Schema Changes

- **Database:**
  - Add `imageUrl` (String) to the local `Product` entity in Postgres. Do not add this to the Cloud Prisma schema, and do not include it in the `OutboxSyncWorker` payload mapping.
- **Backend Storage:**
  - Create an endpoint `POST /api/products/{id}/image`.
  - Store the uploaded image file directly to the local file system (in the `uploads/` directory mapped via Spring WebMvc config and Docker volumes).
- **Frontend UI (Local Dashboard):**
  - Update `/admin/products` to include a file upload input.
  - Update `/pos` (Checkout Modal & Grid) to display the uploaded images on the product cards instead of just text/colors.

## - There's a field to optionally upload guests id locally - but there's no way to view it from a guests list

- admin and receptionists should be able to click on a view details where the guests information will appear on a page with the image of the guest at the top right - this should only be at on the local dashboard - double check to ensure we've not implemented this yet

## The self checkin functionality

the local manual checking has the form set up in multi step but the cloud one should be converet to multip step and responsiveness should be given priority, the buttons in the checkin both on cloud and local need to be rechecked for proper visibility and useability on smaller screens, the buttons should have some padding and margin to prevent overlap on smaller screens.

## UI responsiveness and premium feel

# the mobile responsive design should be reviewed and improved - the fonts should be bigger, the cards should be bigger, the colors should be more premium - use google fonts for premium fonts` make the the design such that a hotel owner won't resist when its being pitched to him/her

## Spring AI

- Identify areas that may need an optional AI integration to streamline workflows, like report generation and analytics. You are at libertty to suggest here before we proceed with any implementation - I'll be using Google Gemini llm, but changing model shoult be flexible in the system
