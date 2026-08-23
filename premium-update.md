# Feni Hotel - Premium Market Updates (Nigeria)

This document tracks the roadmap and implementation progress for adapting the Feni Hotel ERP/PMS/POS system to the specific operational, financial, and regulatory standards of the Nigerian hospitality market.

## 1. Point of Sale (POS) & Payments Integration
- [ ] **Smart POS Terminal Tracking (Manual Verification):** Update the UI so cashiers/staff can manually select which physical smart POS device (e.g., Moniepoint-1, OPay-Main) confirmed a payment (both card insertions and transfers to the device's account number). This eliminates the strict need for a virtual account API for in-person payments.
- [ ] **Dynamic Virtual Accounts (Optional/Remote):** Integrate with Paystack, Monnify, or Korapay to generate dynamic virtual accounts *only* for remote payments (e.g., in-room QR dining, self check-in) where a cashier is not present to check a physical terminal receipt.
- [ ] **Split Tenders:** Update the POS UI and backend to explicitly support splitting a single bill across multiple payment methods (e.g., Cash + Smart POS Terminal).

## 2. ERP & Inventory (Fraud Prevention)
- [ ] **Strict Authorization Controls:** Implement a "Manager PIN" override system for high-risk actions, including voiding printed receipts, canceling kitchen tickets, and making manual stock adjustments.
- [ ] **Unit of Measure (UoM) Engine:** Build a UoM conversion system. Allow receiving inventory in bulk (e.g., Cartons, Crates, Sacks) and automatically convert them into saleable units (e.g., Bottles, Plates) based on configurable ratios.
- [ ] **Shrinkage Alerting:** Automatically flag un-billed kitchen tickets (orders sent to the kitchen printer that were never paid or attached to a room) on the Admin Dashboard.

## 3. ERP & Accounting (Taxation & Compliance)
- [ ] **General Ledger Viewer:** Build a dedicated UI on the Admin Dashboard for accountants and auditors to view raw double-entry accounting data (Journal Entries and Journal Lines). This must include the ability to filter by account name (e.g., Sales Revenue, Inventory Asset), date range, and export to CSV/Excel.
- [ ] **Dynamic Multi-State Tax Engine:** Move away from hardcoded tax rates. Build a configurable tax engine that allows facility admins to define multiple tax brackets based on their jurisdiction (e.g., 7.5% Federal VAT + 5% Lagos Consumption Tax, or specific levies for Plateau, Nasarawa, and Abuja FCT).
- [ ] **Tax Liability Ledger:** Update the double-entry accounting engine to automatically calculate and route collected taxes into dedicated liability accounts (e.g., `Taxes Payable - VAT`, `Taxes Payable - State Consumption`).
- [ ] **Configurable Service Charge:** Add a toggleable Service Charge percentage (e.g., 5-10%) that automatically applies to POS/Room bills and routes to a dedicated ledger account.

## 4. Property Management (PMS) & Guest Experience
- [ ] **Extended Stays & Dynamic Pricing:** Refine the booking extension flow to handle mid-stay extensions seamlessly, accommodating fluctuating daily rates (e.g., adjusting room rates based on diesel costs).
- [ ] **Enhanced KYC (Know Your Customer):** Upgrade the Cloud Clipboard check-in flow to extract or explicitly require National Identification Numbers (NIN) or Passport Numbers alongside the ID image upload.
- [ ] **Incidental Deposits:** Create a dedicated workflow for capturing, holding, and refunding large cash/transfer deposits for incidentals without booking them as earned revenue.

## 5. Dashboard UI/UX Parity Updates
- [ ] **Local P&L Report:** Ensure the Profit & Loss (P&L) report is built directly into the Local Dashboard. If the internet goes down for a week, the local manager must still be able to pull offline financial performance reports without relying on the cloud.
- [ ] **Cloud Admin Settings:** Add a `/admin/settings` page to the Cloud Dashboard to allow Super Admins to update their email address and change their password.
- [ ] **Cloud Facility Management:** Add a `/admin/facilities` route on the Cloud Dashboard for SaaS Super Admins to manually create new Facilities and generate `CLOUD_SYNC_API_KEY`s natively via UI (replacing the manual seed script).
- [ ] **UoM UI Updates:** Add "Bulk Unit" and "Conversion Ratio" input fields to the `/admin/products` creation form on the Local Dashboard.
- [ ] **Tax Configuration UI:** Add a new "Tax Engine" tab within `/admin/settings` on the Local Dashboard for managers to configure their state-specific tax rates.
