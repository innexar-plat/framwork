# Tenant Modules — Implementation Plan

## 1. API contracts summary

All tenant APIs live under `/api/v1`, require **JWT** (Bearer token with `tenant_id`), and enforce **module guard**: the tenant’s plan+niche must have the corresponding module enabled (`require_active_module("property" | "blog" | "leads" | "schedule" | "media")`). Standard response shape: `{ success: boolean, data: T | null, error: string | null }`.

### 1.1 Property (`/api/v1/property`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/items` | List (query: `limit`, `offset`) |
| GET | `/items/{item_id}` | Get by id |
| POST | `/items` | Create |
| DELETE | `/items/{item_id}` | Delete |

**Note:** No PATCH. UI can only Create + Delete (or backend adds PATCH later).

- **PropertyItemOut:** `id`, `tenant_id`, `title`, `address` (optional), `status`
- **PropertyItemCreate:** `title` (required, 1–500), `address` (optional, max 500), `status` (default `"draft"`, max 50)

---

### 1.2 Blog (`/api/v1/blog`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts` | List (query: `status`, `limit`, `offset`) |
| GET | `/posts/{post_id}` | Get by id |
| POST | `/posts` | Create |
| PATCH | `/posts/{post_id}` | Update (partial) |
| DELETE | `/posts/{post_id}` | Delete |

- **BlogPostOut:** `id`, `tenant_id`, `title`, `slug`, `content` (optional), `status`
- **BlogPostCreate:** `title` (1–500), `slug` (1–500), `content` (optional, max 50k), `status` (default `"draft"`, max 50)
- **BlogPostUpdate:** all optional: `title`, `slug`, `content`, `status` (same limits)

---

### 1.3 Leads (`/api/v1/leads`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `` | List (query: `limit`, `offset`) — path is base `/leads` |
| GET | `/{lead_id}` | Get by id |
| POST | `` | Create |

**Note:** No PATCH, no DELETE. Leads are list + view + optional manual create only.

- **LeadOut:** `id`, `tenant_id`, `name`, `email`, `source` (optional), `message` (optional)
- **LeadCreate:** `name` (1–255), `email` (EmailStr), `source` (optional, max 100), `message` (optional, max 2000)

---

### 1.4 Schedule (`/api/v1/schedule`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/items` | List (query: `start_from`, `end_before`, `status`, `limit`, `offset`) |
| GET | `/items/{item_id}` | Get by id |
| POST | `/items` | Create |
| PATCH | `/items/{item_id}` | Update (partial) |
| DELETE | `/items/{item_id}` | Delete |

- **ScheduleItemOut:** `id`, `tenant_id`, `title`, `start_at`, `end_at`, `status`, `contact_name`, `contact_email`, `notes`
- **ScheduleItemCreate:** `title` (1–500), `start_at` (datetime), `end_at` (datetime), `status` (default `"scheduled"`, max 50), `contact_name` (optional, 255), `contact_email` (optional, 255), `notes` (optional, 2000)
- **ScheduleItemUpdate:** all optional, same fields and limits; `start_at`/`end_at` as datetime

---

### 1.5 Media (`/api/v1/media`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/items` | List (query: `limit`, `offset`) |
| GET | `/items/{item_id}` | Get by id |
| POST | `/items` | Create (metadata after upload) |
| DELETE | `/items/{item_id}` | Delete |

**Note:** No PATCH. Create expects `storage_key` (file already stored). **No upload endpoint in API** — either add a file-upload endpoint that returns `storage_key`, or Phase 1: list + delete only; create when upload exists.

- **MediaItemOut:** `id`, `tenant_id`, `name`, `storage_key`, `mime_type`, `size_bytes`
- **MediaItemCreate:** `name` (1–500), `storage_key` (1–500), `mime_type` (optional, max 100), `size_bytes` (optional)

---

## 2. Admin frontend — patterns to reuse

- **Catalog:** `waas/apps/admin/src/app/admin/catalog/` — sections per entity (Plans, Niches, Modules, Matrix) with:
  - Table list + “Add” button
  - Modal for create/edit (form with `defaultValue` for edit)
  - `ConfirmDialog` for delete
  - API client: `waas/apps/admin/src/lib/catalog-admin-api.ts` — types (Out, Create, Update where applicable), `request()` with Bearer + 401 retry via `tryRefresh`, then `list*`, `create*`, `update*`, `delete*`
- **Auth:** Tenant pages use `useAuth()` → `getAccessToken()`, `tryRefresh()`, `hasTenant`; same pattern as catalog’s `getAccessToken` + `tryRefresh`.
- **Placeholder pages:** `waas/apps/admin/src/app/app/{properties,blog,leads,schedule,media}/page.tsx` — all use `TenantLayout`, guard with `isAuthenticated` + `hasTenant`, title via `t("nav.*")`, “Em breve.” placeholder.
- **UI:** `@/components/ui/modal`, `@/components/ui/confirm-dialog`; i18n: `lib/i18n`, keys under `common.*`, `catalog.*`; nav already has `nav.properties`, `nav.blog`, etc. and sidebar filters by `enabled_modules`.

---

## 3. Module summary table

| Module   | API base path   | List endpoint        | List columns (for table) | Create/Edit fields |
|----------|-----------------|----------------------|---------------------------|---------------------|
| Property | `/api/v1/property` | GET `/items`         | title, address, status    | title, address, status (Create + Delete only; no Edit unless API adds PATCH) |
| Blog     | `/api/v1/blog`     | GET `/posts`         | title, slug, status       | title, slug, content, status (full CRUD) |
| Leads    | `/api/v1/leads`     | GET `` (base)        | name, email, source       | name, email, source, message (Create only in UI; list + view detail) |
| Schedule | `/api/v1/schedule`  | GET `/items`         | title, start_at, end_at, status | title, start_at, end_at, status, contact_name, contact_email, notes (full CRUD) |
| Media    | `/api/v1/media`     | GET `/items`         | name, storage_key, mime_type, size_bytes | name, storage_key, mime_type, size_bytes (Create only if upload exists; else list + delete) |

---

## 4. Per-module design

### 4.1 Property

- **API client (types + functions):**
  - Types: `PropertyItemOut`, `PropertyItemCreate` (mirror API: `id`, `tenant_id`, `title`, `address`, `status`).
  - Functions: `listPropertyItems(token, tryRefresh, params?)`, `getPropertyItem(id, token, tryRefresh)`, `createPropertyItem(body, token, tryRefresh)`, `deletePropertyItem(id, token, tryRefresh)`.
- **Page structure:** List page with table (columns: title, address, status), “Add property” → modal form (title, address, status). Row actions: Delete (confirm dialog). No edit until API has PATCH.
- **i18n keys:** e.g. `property.title`, `property.address`, `property.status`, `property.addProperty`, `property.editProperty`, `property.confirmDelete` (reuse `common.edit`, `common.delete`, `common.add` where possible).

**Files to create or modify:**

- Create: `lib/tenant-api.ts` (or `lib/tenant-api/property.ts`) — types + API functions for property.
- Modify: `app/app/properties/page.tsx` — replace placeholder with list + modal create + delete confirm (section component or inline).

---

### 4.2 Blog

- **API client:** Types: `BlogPostOut`, `BlogPostCreate`, `BlogPostUpdate`. Functions: `listBlogPosts(token, tryRefresh, params?)`, `getBlogPost(id, token, tryRefresh)`, `createBlogPost(body, token, tryRefresh)`, `updateBlogPost(id, body, token, tryRefresh)`, `deleteBlogPost(id, token, tryRefresh)`.
- **Page structure:** List with table (title, slug, status); filter by status (optional). Actions: Add, Edit, Delete. Modal: create/edit form with title, slug, content (textarea), status.
- **i18n:** `blog.title`, `blog.slug`, `blog.content`, `blog.status`, `blog.addPost`, `blog.editPost`, `blog.confirmDelete`, `blog.filterByStatus`.

**Files:**

- Create or extend: `lib/tenant-api.ts` (or `lib/tenant-api/blog.ts`) — blog types + functions.
- Modify: `app/app/blog/page.tsx` — list + modal form (create/edit) + confirm delete; optional status filter.

---

### 4.3 Leads

- **API client:** Types: `LeadOut`, `LeadCreate`. Functions: `listLeads(token, tryRefresh, params?)`, `getLead(id, token, tryRefresh)`, `createLead(body, token, tryRefresh)`. No update/delete.
- **Page structure:** List table (name, email, source, truncated message); “Add lead” → modal with name, email, source, message. Row action: View (detail in modal or inline). No edit/delete.
- **i18n:** `leads.name`, `leads.email`, `leads.source`, `leads.message`, `leads.addLead`, `leads.viewLead`, `leads.detail`.

**Files:**

- Create or extend: `lib/tenant-api.ts` (or `lib/tenant-api/leads.ts`) — lead types + list/get/create.
- Modify: `app/app/leads/page.tsx` — list + “Add lead” modal + view-detail modal.

---

### 4.4 Schedule

- **API client:** Types: `ScheduleItemOut`, `ScheduleItemCreate`, `ScheduleItemUpdate`. Functions: `listScheduleItems(token, tryRefresh, params?)`, `getScheduleItem(id, token, tryRefresh)`, `createScheduleItem(body, token, tryRefresh)`, `updateScheduleItem(id, body, token, tryRefresh)`, `deleteScheduleItem(id, token, tryRefresh)`.
- **Page structure:** List table (title, start_at, end_at, status, contact_name). Filters: optional date range (`start_from`, `end_before`), status. Actions: Add, Edit, Delete. Modal: create/edit — title, start_at, end_at (datetime inputs), status, contact_name, contact_email, notes.
- **i18n:** `schedule.title`, `schedule.startAt`, `schedule.endAt`, `schedule.status`, `schedule.contactName`, `schedule.contactEmail`, `schedule.notes`, `schedule.addItem`, `schedule.editItem`, `schedule.confirmDelete`, `schedule.filterByDate`, `schedule.filterByStatus`.

**Files:**

- Create or extend: `lib/tenant-api.ts` (or `lib/tenant-api/schedule.ts`) — schedule types + full CRUD.
- Modify: `app/app/schedule/page.tsx` — list + filters + modal form + confirm delete.

---

### 4.5 Media

- **API client:** Types: `MediaItemOut`, `MediaItemCreate`. Functions: `listMediaItems(token, tryRefresh, params?)`, `getMediaItem(id, token, tryRefresh)`, `createMediaItem(body, token, tryRefresh)`, `deleteMediaItem(id, token, tryRefresh)`.
- **Page structure (Phase 1 without upload):** List table (name, storage_key, mime_type, size_bytes). Action: Delete (confirm). No create in UI until upload endpoint exists.
- **Page structure (Phase 2 with upload):** Add “Upload” → upload file → API returns or frontend has storage_key → create media item with name, storage_key, mime_type, size_bytes.
- **i18n:** `media.name`, `media.storageKey`, `media.mimeType`, `media.sizeBytes`, `media.upload`, `media.confirmDelete`.

**Files:**

- Create or extend: `lib/tenant-api.ts` (or `lib/tenant-api/media.ts`) — media types + list/get/create/delete.
- Modify: `app/app/media/page.tsx` — list + delete; add upload + create when backend provides upload.

---

## 5. Shared API client layout

- **Option A — single file:** `lib/tenant-api.ts` with all tenant module types and functions; same `request()` pattern as `catalog-admin-api.ts`: base URL `NEXT_PUBLIC_API_URL`, prefix per resource (e.g. `/property`, `/blog`, `/leads`, `/schedule`, `/media`), Bearer token, 401 → `tryRefresh()` and retry. Parse `ApiResponse<T>` and return `data` or throw.
- **Option B — per-module files:** `lib/tenant-api/property.ts`, `blog.ts`, `leads.ts`, `schedule.ts`, `media.ts`, plus `lib/tenant-api/client.ts` for shared `request()` and base URL. Each file exports types and its functions.

Recommendation: Start with **Option A** for fewer files; split into Option B if `tenant-api.ts` grows beyond ~300 lines.

---

## 6. File list (create or modify)

| Action  | Path |
|---------|------|
| Create  | `waas/apps/admin/src/lib/tenant-api.ts` — tenant API client (types + functions for property, blog, leads, schedule, media) |
| Modify  | `waas/apps/admin/src/app/app/properties/page.tsx` — real list + create modal + delete confirm |
| Modify  | `waas/apps/admin/src/app/app/blog/page.tsx` — list + create/edit modal + delete confirm + optional status filter |
| Modify  | `waas/apps/admin/src/app/app/leads/page.tsx` — list + create modal + view detail (no edit/delete) |
| Modify  | `waas/apps/admin/src/app/app/schedule/page.tsx` — list + filters + create/edit modal + delete confirm |
| Modify  | `waas/apps/admin/src/app/app/media/page.tsx` — list + delete confirm; create when upload exists |
| Modify  | `waas/apps/admin/src/lib/i18n/messages/en.json` (and pt, es) — add keys for property, blog, leads, schedule, media (form labels, buttons, confirmations) |

Optional (if splitting): create `lib/tenant-api/client.ts`, `lib/tenant-api/property.ts`, etc.

---

## 7. Implementation order

1. **Property + Leads (first)** — Simplest: Property has no edit (create + delete); Leads has no update/delete (list + view + create). Delivers two modules and establishes `tenant-api.ts` + list/modal/confirm pattern.
2. **Blog** — Full CRUD; adds update flow and optional filter.
3. **Schedule** — Full CRUD + datetime fields + optional filters (date range, status).
4. **Media** — List + delete first; add create when backend has upload (or implement upload endpoint + then create in UI).

---

## 8. Backend gaps (optional follow-ups)

- **Property:** Add `PATCH /property/items/{item_id}` and `PropertyItemUpdate` schema if tenant should edit properties.
- **Leads:** Add `DELETE /leads/{lead_id}` (and optionally PATCH) if tenant should delete or update leads.
- **Media:** Add `POST /media/upload` (or similar) returning `storage_key` (and maybe `url`) so the tenant panel can implement “Upload file” then create media item.

---

*End of plan. No code produced; structure and contracts only.*
