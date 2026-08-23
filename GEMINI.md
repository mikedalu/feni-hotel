# GEMINI.md — Feni Hospitality SaaS (SenForge)

This file is the persistent context for agentic development sessions on this project.
Read this in full before making any changes. It reflects real decisions already made
and code already written — do not re-litigate settled architecture choices without
a strong, explicitly stated reason.

---

## 1. What This Project Is

A hospitality SaaS system (hotels, restaurants, bars) built under the software agency
**SenForge**, base package `com.backend.feni`. The system must keep operating fully
during total internet outages, since facilities cannot depend on stable connectivity.

## 2. Architecture — Edge-to-Cloud (Local Master)

- The **local facility is the absolute source of truth**. Data flows one-way: Local → Cloud.
- The cloud is a synchronized read replica + global admin view, never a point of write
  authority for facility operations (bookings, sales, inventory).
- The system must be **usable with zero internet connectivity**. Every core workflow
  (check-in, POS sale, inventory intake) completes fully against the local DB alone.

### Stack

| Layer                            | Technology                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Local Frontend (PWA, kiosk mode) | Next.js (React), TypeScript, Tailwind                                                                          |
| Local Backend ("The Hub")        | Java Spring Boot 4 (Spring Security 7 / lambda DSL only — no `WebSecurityConfigurerAdapter`, no `antMatchers`) |
| Local DB                         | PostgreSQL, Dockerized on Ubuntu Server (mini-PC / NUC)                                                        |
| Cloud Frontend (Admin Dashboard) | Next.js, TypeScript, Tailwind, recharts                                                                        |
| Cloud Backend                    | Next.js API routes (no separate Spring service in the cloud)                                                   |
| Cloud DB                         | Managed Postgres (Neon/Supabase)                                                                               |
| File storage                     | Local File System (ID scans, generated PDFs) mapped via Spring WebMvc config                                   |
| Sync mechanism                   | Transactional Outbox pattern, `@Scheduled` polling (NOT WebSockets — decided deliberately, see §6)             |
| Hardware                         | Raw TCP sockets — ESC/POS (receipt printers), ZPL (label printers), port 9100                                  |
| Auth                             | Self-issued JWT (HS256, Nimbus), stateless, role-based                                                         |

### Facility hardware assumptions

- All devices (server, tablets, printers) on the same subnet.
- Local server reachable at `http://hotel-hub.local` via Avahi/mDNS.
- Barcode scanners are keyboard-emulation devices, not a separate input API.

---

## 3. Core Domain Model — Already Decided, Do Not Redesign

### Double-entry accounting (mandatory on every financial event)

Every sale, intake, and booking creates exactly **one `JournalEntry`** with **N balanced
`JournalLine` rows** (sum of DEBITs == sum of CREDITs, enforced in code before commit).

Standard sale (4 lines):

```
DEBIT  Cash                 CREDIT Sales Revenue
DEBIT  Cost of Goods Sold   CREDIT Inventory Asset
```

Inventory intake (2 lines):

```
DEBIT  Inventory Asset      CREDIT Accounts Payable
```

**Rules:**

- `BigDecimal` only for money. Never `double`/`float`.
- Validation (`UnbalancedJournalException`) happens inside the `@Transactional` method,
  before save — an unbalanced entry must roll back everything in that transaction
  (inventory decrement, outbox event, all of it).
- Never delete a `JournalEntry`. To void a sale, create a **reversing entry**. Preserve
  the audit trail always.

### Product types

```java
enum ProductType { RAW_GOOD, PREPARED_DISH }
```

- `RAW_GOOD`: physically stocked, barcode-tracked, `stockQty` decremented on sale.
- `PREPARED_DISH`: made-to-order (kitchen meals, cocktails). No stock count exists —
  `stockQty` is unused/null. Still books COGS/Inventory Asset lines using a
  manager-entered **estimated** unit cost. Do NOT build ingredient-level recipe costing
  — explicitly descoped for v1.

### Hybrid POS input

Barcode scan and touchscreen tap both call the **same** `addToCart()` → same
`/api/pos/sale` endpoint → same `PosSaleService.completeSale()`. The service does not
know or care which input method produced the SKU. Do not fork this logic.

### Transactional Outbox pattern

Every write that must reach the cloud (`BOOKING_CREATED`, `SALE_COMPLETED`,
`INVENTORY_RECEIVED`) writes its business row **and** an `OutboxEvent` row in the
**same local `@Transactional` method**. This atomicity is the entire point — never
split them into separate transactions.

Sync worker: `@Scheduled(fixedDelay = 5000)`, pulls top 50 `PENDING` events, POSTs to
cloud, marks `SYNCED` on 200 or leaves `PENDING` on failure for retry next tick. Batch
capped at 50 so a long outage doesn't try to flush thousands of events in one tick.

**Do not implement WebSockets for this sync path.** Already evaluated and rejected —
polling degrades gracefully during outages and matches "local is master, cloud
catches up eventually." WebSockets are reserved only for the Cloud Clipboard
receptionist-polling UX (see §5), and even there, plain 1–2s polling is currently
preferred over a socket unless it's proven laggy in practice.

### Cloud idempotency

Cloud `/api/sync/events` endpoint must **upsert by event ID**, never blind-insert —
local retries can double-send if a 200 response is lost in transit.

---

## 4. Security Model

- Spring Security 7, lambda DSL (`SecurityFilterChain` bean, `authorizeHttpRequests`,
  `oauth2ResourceServer(...).jwt(...)`).
- Stateless (`SessionCreationPolicy.STATELESS`), CSRF disabled (pure REST API, no
  browser form posts).
- JWT self-issued locally via `JwtService` (Nimbus, HS256). Cloud sync auth is a
  **separate** mechanism — a shared `x-facility-api-key` header, not JWT.
- Roles: `ADMIN`, `INVENTORY_MANAGER`, `FRONT_DESK`, `BARTENDER`. Claim name is
  `role`, value is pre-prefixed `ROLE_<NAME>` at token-issue time — the
  `JwtAuthenticationConverter` authority prefix is set to `""` because the prefix is
  already baked into the claim. Do not re-add `ROLE_` prefixing in the converter or
  role checks silently break.
- `jwt.signing-key` must have **no default value** in `application-prod.yml` — fail
  loudly if unset. A dev-only fallback default is acceptable in base `application.yml`
  only, and must be obviously fake (never a plausible-looking secret).
- Swagger UI / OpenAPI endpoints (`/swagger-ui.html`, `/swagger-ui/**`,
  `/v3/api-docs/**`, `/webjars/**`) are `permitAll()` in dev, should be disabled
  entirely (`springdoc.swagger-ui.enabled=false`) in `application-prod.yml`.
- Kiosk tablets: JWT lives in memory/React state only, never `localStorage`. Clear on
  logout, idle timeout (~2 min), and app reload.

### First-boot bootstrap (already implemented — see §7)

`DataSeeder implements CommandLineRunner` seeds one `Facility` row and one `ADMIN`
`StaffUser` on first launch only (idempotent via existence checks). Password is either
read from `bootstrap.admin.password` env var or securely random-generated and logged
**once** to console, never persisted in plaintext. Seeded admin always has
`mustChangePassword = true`. `/api/auth/change-password` clears that flag. Do not
weaken this flow (e.g. don't add a plaintext password default, don't skip the
idempotency check).

---

## 5. Cloud Clipboard (Self Check-In)

Solves: guest's QR-code phone is on cellular data, can't reach the local server
directly.

1. Receptionist taps "Self Check-In" → local server creates `sessionId`, POSTs to
   cloud to open a Redis-backed waiting room (`checkin:{sessionId}`, 15 min TTL).
2. Tablet shows QR pointing to a **public cloud URL** (`app.senforge.com/checkin/{id}`).
3. Guest fills a public Next.js form on their own data connection → cloud stores
   submission in Redis.
4. Receptionist tablet polls the cloud every ~2s via React Query
   (`refetchInterval: 2000`). On first read of a `submitted` status, cloud **deletes**
   the Redis entry (clipboard clears).
5. Receptionist reviews, scans physical ID via `<input capture="environment">`,
   confirms.
6. **Only step 6 touches the local DB.** Local server creates the `Booking`,
   `JournalEntry`/`Lines`, `OutboxEvent`, and uploads the ID photo to R2 — all in one
   `@Transactional` method, same pattern as every other write.

The cloud never creates a booking and never touches accounting/inventory tables — it
is a disposable pass-through only. Do not let cloud logic write to booking/journal
tables directly.

**Known open gap, not yet resolved:** if the receptionist's tablet crashes/reloads
after the guest submits but before the poll reads it, the 15-min TTL Redis entry could
expire silently since it's deleted on first read. Current behavior is "ephemeral,
15-minute window, no recovery." Flag this to the user before building anything more
durable on top of it — don't silently fix it as a side effect of unrelated work.

---

## 6. Printing (ESC/POS + ZPL)

- Raw `java.net.Socket` to port 9100 on the printer's IP. No SDK/library.
- Connection opened **per print job**, not held persistent — hotel Wi-Fi drops
  connections unpredictably; short-lived connect/write/close is more reliable.
- 3-second connect timeout so a dead printer can't hang the async thread pool.
- `@Async` (custom `taskExecutor` bean from `AsyncConfig`, not the default
  `SimpleAsyncTaskExecutor`).
- Printing happens **outside** the sale's DB transaction boundary. A printer jam must
  never roll back or fail a completed, already-committed financial transaction.
  Exceptions inside printer calls are caught and logged, never rethrown.
- Manufacturer-barcoded `RAW_GOOD` items (bottled beer, canned soda) skip label
  printing on intake — only items needing an internal SKU sticker get printed. Check
  `product.hasManufacturerBarcode()` before calling `printInventoryLabelsAsync`.

---

## 7. Reporting Requirements

Two distinct audiences need reports, with different scope and access:

### Admin (full facility via cloud dashboard)

- **P&L statement** — already scoped in §8 remaining work: query `journal_lines`
  grouped by `account_name`/`entry_type`, render PDF, store in R2, return a signed
  link. This is the canonical report — build the query/aggregation logic once and
  reuse it for any other financial report (balance sheet, monthly summary) rather
  than writing a new aggregation per report type.
- **Sales report** — revenue by product/category/time range, sourced from
  `journal_lines` where `account_name = 'Sales Revenue'` joined back to the
  originating sale via `reference_id`, not from a separate sales table. The ledger is
  the source of truth for anything financial; don't duplicate revenue totals in a
  parallel table that can drift out of sync.
- **Inventory report** — current stock levels, low-stock flags, cost-of-goods trends.
  Only meaningful for `RAW_GOOD` products (see §3) — `PREPARED_DISH` items have no
  stock count to report on.
- **Staff activity report** — sales/bookings processed per staff member, useful for
  shift accountability. Sourced by joining journal entries back to whichever
  `StaffUser` processed the underlying sale/booking (note: this requires adding a
  `processedBy` reference on `Sale`/`Booking`/wherever the originating record lives —
  not yet on any entity; flag this as a schema addition when you get to this report).

### Front Desk (local, facility-scoped only — no cloud access needed)

- **Occupancy report** — current bookings, check-ins/check-outs for a given day or
  range, sourced from `Booking` directly (not the ledger — occupancy isn't a
  financial concept).
- **Daily shift summary** — check-ins handled, no-shows, upcoming arrivals. This is
  a local-only, same-day operational view; it should be fast and should never require
  the cloud to be reachable, since front desk needs this available during outages.

### Report generation pattern (applies to all of the above)

- All PDF generation happens on the **local** Spring Boot server for local/front-desk
  reports (must work offline), and can happen on the **cloud** Next.js side for
  cloud Admin views.
- Reuse the `pdf` skill/tooling conventions already established for R2-bound PDFs
  (self-check-in ID scans already upload to R2 — same client, same bucket
  conventions, different key prefix, e.g. `reports/{facilityId}/{reportType}/{date}.pdf`).
- Reports should be generated **on-demand** via an endpoint (`POST
/api/reports/{type}/generate`) returning a signed URL, not pre-generated on a
  schedule, unless a specific report is later identified as needing to be emailed on
  a cadence (see §8 below — the monthly P&L is the one exception, since it's also an
  email deliverable).

---

## 8. Email Notifications

### Provider strategy — start on Gmail SMTP, migrate to Resend later

Build a single abstraction now so the provider swap later is a config change, not a
rewrite:

```java
package com.backend.feni.service.email;

public interface EmailSender {
    void send(String to, String subject, String htmlBody);
}
```

- **Phase 1 (now):** `GmailSmtpEmailSender implements EmailSender`, backed by
  `spring-boot-starter-mail` (`JavaMailSender`), configured against a regular Gmail
  account via SMTP + an app password (not the main account password — Gmail requires
  a generated app-specific password for SMTP auth).
- **Phase 2 (later):** `ResendEmailSender implements EmailSender`, calling Resend's
  HTTP API directly (`POST https://api.resend.com/emails`) via `RestClient`. No
  official Spring starter exists for Resend — it's a plain REST call with an API key
  in the `Authorization` header.
- The swap between phases should only require changing which `EmailSender` bean is
  `@Primary`/active (e.g. gated by a `email.provider=gmail|resend` property and a
  `@ConditionalOnProperty` on each implementation), never touching any calling code.
  **Do not let any service call `JavaMailSender` or a Resend client directly** —
  everything goes through the `EmailSender` interface so this migration stays clean.

### Dependency to add now

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### Config (Phase 1 — Gmail SMTP)

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_SENDER_ADDRESS}
    password: ${GMAIL_APP_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

No default values for `GMAIL_SENDER_ADDRESS`/`GMAIL_APP_PASSWORD` in
`application-prod.yml` — same "fail loudly if unset" rule as the JWT signing key and
the admin bootstrap password (§4). Never commit a real Gmail app password anywhere.

### Where email sending is actually needed (build these trigger points)

| Trigger | Recipient | Content | Priority |
| Booking confirmed (`BookingController` - general) | Guest | Booking confirmation, dates, facility details | Medium |
| Guest check-in completed | Guest (optional) | Digital receipt / welcome info | Low — nice-to-have, not blocking |
| Monthly P&L generated | Admin / hotel owner | The generated PDF (as an attachment or a link to the R2 signed URL) | Medium — this is the one report worth generating on a schedule (`@Scheduled`, monthly) specifically because it's routinely emailed, not just pulled on-demand |
| Outbox sync worker failing repeatedly (e.g. an event exceeds N retry attempts) | Admin | Ops alert — "facility X sync has been failing since [time]" | Medium — you don't currently have any alerting if the cloud sync silently stalls for hours; this is the operational blind spot worth closing |
| Low-stock inventory threshold crossed | Inventory Manager / Admin | Which SKU, current qty, threshold | Low — depends on whether low-stock thresholds get built as a feature at all; don't build this trigger before the threshold concept exists on `Product` |

### Conventions for email content

- All emails are HTML templates — keep templates as separate resources
  (`src/main/resources/templates/email/*.html`) rather than inline strings in Java, so
  non-technical copy edits don't require touching service code.
- Staff credentials (including for new accounts) are deliberately provided by the admin verbally. Do not add email requirements to staff accounts, as staff should not be forced to log into their personal email on shared POS/kiosk devices. If a staff member forgets their password, the admin must reset it via `POST /api/admin/staff/{id}/reset-password`.
- Email sending is fire-and-forget from the caller's perspective, same reasoning as
  printing (§6) — a failed email must never roll back or block the underlying
  transaction (a booking is valid whether or not the confirmation email successfully
  sent). Fire via the existing `@Async` executor from `AsyncConfig`, catch and log
  failures, never rethrow into the calling transaction.

---

## 9. What's Already Built (do not rebuild from scratch — extend/reference)

- `SecurityConfig` — filter chain, `JwtDecoder`, `JwtAuthenticationConverter`,
  `PasswordEncoder` bean, Swagger permit rules.
- `AsyncConfig` — `ThreadPoolTaskExecutor` bean (`corePoolSize=2, maxPoolSize=5,
queueCapacity=50`), `@EnableAsync`.
- `JwtService` — token generation (Nimbus, HS256, 8-hour expiry, `role` claim
  pre-prefixed with `ROLE_`).
- `GlobalExceptionHandler` (`@RestControllerAdvice`) — maps `IllegalArgumentException`
  → 400, `IllegalStateException`/`UnbalancedJournalException` → 409,
  `MethodArgumentNotValidException`/`ConstraintViolationException` → 400 with field
  errors, `BadCredentialsException` → 401, `AccessDeniedException` → 403,
  `DataIntegrityViolationException` → 409, generic `Exception` → 500 (message always
  generic, never leaks stack traces — log server-side instead).
- `UnbalancedJournalException`.
- Entities: `StaffUser` (+ `mustChangePassword` flag), `Facility`, `Product` (with
  `ProductType`), `Booking`, `Guest`, `JournalEntry`, `JournalLine`, `OutboxEvent`.
  Enums: `Role`, `ProductType`, `EntryType`.
- Repositories: `StaffUserRepository`, `FacilityRepository`, `ProductRepository`,
  `BookingRepository`, `JournalEntryRepository`, `OutboxEventRepository`.
- `AdminController` — `POST /api/admin/staff` (create), `GET /api/admin/staff` (list),
  `PATCH /api/admin/staff/{id}/deactivate` (soft-deactivate, never hard-delete staff).
- `AuthController` — `POST /api/auth/login`, `POST /api/auth/change-password`
  (identifies the caller via `@AuthenticationPrincipal Jwt`, never trusts a
  client-supplied username for whose password is being changed).
- `DataSeeder` (`CommandLineRunner`) — first-boot facility + admin bootstrap, see §4.
- `PosSaleService.completeSale()` — full 4-line journal logic, `RAW_GOOD` vs
  `PREPARED_DISH` stock-decrement branching, outbox event, async receipt print.
- `InventoryIntakeService.receiveShipment()` — 2-line journal logic, async label
  print, manufacturer-barcode skip logic.
- `ThermalPrinterService` — ESC/POS receipt building, ZPL label building, async
  socket writes for both.
- springdoc-openapi wired (Swagger UI + `/v3/api-docs`), `OpenApiConfig` bean for
  bearer-auth scheme in the Swagger "Authorize" button.

## 10. What's NOT Built Yet — Actual Remaining Work

- Phase 2 Email Provider (`ResendEmailSender` implementation) — deliberately deferred until Phase 1 (Gmail) is fully verified.
- Local Frontend Views for **Inventory Intake** (scan & print barcode labels) and **Shift Summary** (view daily occupancy & stats) — currently stubbed out as "Coming Soon" on the local dashboard.
- Any further polish or end-to-end testing of the full facility suite.

---

## 11. Conventions to Follow

- Package root: `com.backend.feni`. Sub-packages: `config`, `controller`, `service`
  (with `service.sync` for the outbox worker), `entity` (with `entity.enums`),
  `repository`, `dto.request`, `dto.response`, `exception`.
- Lombok (`@Data`, `@RequiredArgsConstructor`) throughout — don't hand-write
  getters/setters/constructors.
- DTOs, never entities, cross the controller boundary in either direction. Never
  return a JPA entity directly from a `@RestController` method, and never accept one
  as a `@RequestBody`.
- Every write-path service method that must sync to the cloud follows the same shape:
  business row(s) + `OutboxEvent` row, saved together, inside one `@Transactional`
  method, hardware/IO side effects (printing, R2 upload) fired async **after** that
  method's logical completion, never inside the DB transaction.
- New protected endpoints get their role rule added to `SecurityConfig`'s
  `authorizeHttpRequests` block — don't rely on default-deny alone without an explicit
  matcher, and don't scatter `@PreAuthorize` redundantly on endpoints already covered
  by a path-level rule (only use `@PreAuthorize` for finer-grained checks a path
  pattern can't express, e.g. voiding a specific sale).
- Money: `BigDecimal` everywhere, no exceptions.
- IDs: `UUID`, `@GeneratedValue`, everywhere.
\n## 12. Nigerian Market Premium Roadmap\nSee `premium-update.md` in the project root for the detailed feature roadmap regarding POS integrations, multi-state tax engines, and UoM inventory engines.
