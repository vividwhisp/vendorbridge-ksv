# DataHub — Hackathon Starter

A reusable full-stack starter built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Supabase**, **recharts** and an **AI agent** integration.

Designed to be **adapted to any problem statement in minutes** by editing a single config file. Built for the Odoo X KSV Hackathon 2026 in Gandhinagar.

---

## What's included

- **Auth** — Supabase email/password login + signup (`/login`, `/signup`)
- **Multi-table CRUD** — Token-aware API routes under `app/api/[table]/*` (GET / POST / PUT / DELETE / seed) — supports any number of entities
- **Workflow system** — Optional `workflow: string[]` per table; auto-derived stats, status badges, timeline, dropdowns, and AI `update_status` action
- **Dashboard** — Auth-aware navbar, sidebar nav, vertical list, search + filters, edit modal, slide-in log panel, table picker
- **Charts** — Auto-derived bar + pie charts (recharts) themed from the active color palette
- **Realtime sync** — Live INSERT / UPDATE / DELETE events from Supabase stream into the dashboard across all open sessions; "LIVE" indicator in the sidebar
- **File uploads** — Drop a field of `type: "file"` into any `TableConfig`; `FileUpload` + `ImagePreview` handle images, PDFs, and docs against a single shared Supabase Storage bucket
- **Toast system** — React context, no extra deps
- **Command palette** — `⌘K` / `Ctrl+K` to search items and run commands
- **AI agent** — Floating chat widget, takes real actions on the DB via JSON actions; system prompt auto-rebuilds per active table
- **AI utility layer** — Reusable typed helpers (`summarize`, `classify`, `prioritize`, `recommend`, `extractInsights`) over a provider-agnostic `AIProvider` interface. See the [AI utility layer](#ai-utility-layer) section.
- **Voice I/O** — Speech recognition + speech synthesis (Chrome/Edge)
- **Settings / Profile pages** — Auth-guarded routes
- **Landing page** — Public home with features, how-it-works, use cases, and footer
- **Dev log** — Color-coded console panel showing every layer (UI, API, AUTH, LLM, AGENT, REALTIME, WORKFLOW, STORAGE, DB)
- **Row-level security** — Per-user data isolation via Supabase RLS
- **RBAC** — Lightweight role system (`admin` / `user`); `<Can action="…">` component and `requireRole()` helper keep checks out of components

---

## Tech stack

| Layer      | Choice                              |
|------------|-------------------------------------|
| Framework  | Next.js 16 (App Router, Turbopack)  |
| Language   | TypeScript 5                        |
| UI         | React 19 + Tailwind CSS 4           |
| Backend    | Supabase (Auth + Postgres)          |
| AI         | OpenRouter chat completions         |
| Charts     | recharts                            |
| Fonts      | Geist + Geist Mono                  |

---

## Quick start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENROUTER_API_KEY=your-openrouter-key
   OPENROUTER_MODEL=openrouter/free
   ```

3. **Create the Supabase schema**
   Run `supabase-schema.sql` in the Supabase SQL editor (Dashboard → SQL Editor → New Query). The file ships with the `products` table + RLS plus a commented `reviews` example showing how to add more tables.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

5. **Log in**
   The login form is pre-filled with a demo user (`kori@dev.com` / `1234`). Sign up first if the user doesn't exist yet.

---

## ⭐ The one file you edit to adapt this starter

**`app/lib/config.ts`** — the single source of truth for branding, data shape, and AI behavior.

```ts
export const appConfig = {
  // ---------- Branding ----------
  name: "DataHub",
  tagline: "AI-powered data workspace",
  description: "Manage any data with search, filters, and an AI agent.",
  accent: "green" as ThemeName,  // green | blue | purple | red | orange

  // ---------- Tables ----------
  // Declare every entity your app manages here. The first table
  // is the "primary" one. The dashboard sidebar shows a table
  // picker when there is more than one entry.
  tables: [
    {
      id: "items",            // URL slug: /api/items, dashboard tab
      tableName: "products",  // real Postgres table name (default: id)

      entity: {
        name: "item",         // singular: "task", "recipe", "bookmark"
        plural: "items",
        title: "Items",
        statuses: [...],
      },

      fields: [               // form fields + table columns
        { key: "name",     label: "Name",     type: "text",   required: true },
        { key: "price",    label: "Price",    type: "number", required: true },
        { key: "quantity", label: "Quantity", type: "number", required: true },
        { key: "category", label: "Category", type: "text" },
      ],

      searchFields: ["name", "category"],
      lowStockField: "quantity",         // optional; drives the red dot + low filter
      lowStockThreshold: 10,

      samples: [/* demo data for the "Load samples" button */],
    },
    // Append more TableConfig entries to add entities:
    // { id: "reviews", entity: {...}, fields: [...], ... }
  ] as readonly TableConfig[],

  // ---------- AI Agent ----------
  ai: {
    name: "AI Agent",
    welcome: "Hey! I can answer questions and take actions.",
    suggestions: ["Show low items", "Total value?", "Add 10 units"],
  },
};
```

The legacy `appConfig.entity`, `appConfig.fields`, etc. getters still mirror `tables[0]` for backwards compat — new code should read from `appConfig.tables[i]` directly.

---

## Adapting to a new problem statement

### Scenario A — Change the theme color

1. Edit `app/lib/config.ts`:
   ```ts
   accent: "purple",  // green | blue | purple | red | orange
   ```
   The palette is applied as CSS variables on `<body>` by `app/layout.tsx`, so every accent-colored element (buttons, badges, glow, hover states, charts) re-skins instantly.

   To change the dark surface/border/text colors, edit the CSS variables in `app/globals.css` (those are static and theme-wide).

### Scenario B — Change the data shape of the primary table

1. Edit `tables[0]` in `app/lib/config.ts`:
   - Change `entity.name/plural/title` to match the new domain
   - Replace `fields` with your new column definitions
   - Update `searchFields`, `lowStockField`, `samples`
2. Add the matching columns in Supabase:
   ```sql
   alter table products add column status text default 'pending';
   alter table products add column priority text default 'normal';
   ```
3. The dashboard, edit modal, form, AI agent, command palette, charts, and toasts all adapt automatically.

### Scenario C — Add a brand-new entity (different table)

This is the most common move during a hackathon when the problem statement has 2+ entity types (e.g. items + reviews, tasks + comments, products + orders).

1. **Append a new `TableConfig`** to `tables` in `app/lib/config.ts` with a unique `id` (URL slug) and matching `tableName`. Example:
   ```ts
   const REVIEWS_TABLE: TableConfig = {
     id: "reviews",
     entity: { name: "review", plural: "reviews", title: "Reviews", ... },
     fields: [
       { key: "item_id", label: "Item",   type: "number", required: true },
       { key: "rating",  label: "Rating", type: "number", required: true },
       { key: "comment", label: "Comment", type: "text" },
     ],
     searchFields: ["comment"],
     samples: [{ item_id: 1, rating: 5, comment: "Great product!" }],
   };

   export const appConfig = {
     ...
     tables: [ITEMS_TABLE, REVIEWS_TABLE] as readonly TableConfig[],
   };
   ```

2. **Add the matching Postgres table** by copying the commented `reviews` example at the bottom of `supabase-schema.sql`, uncommenting, renaming, and pasting into the Supabase SQL editor.

3. **Done.** A new sidebar entry appears in the dashboard table picker, the AI agent rebuilds its system prompt for the new schema, search/filter/form/edit/seed/charts all work for the new entity — zero other code changes.

### Scenario D — Add a new page

1. Create `app/<route>/page.tsx`. It becomes a route automatically.
2. Wrap it in auth if needed (see `app/dashboard/page.tsx` for the pattern).

### Scenario E — Add a custom API route

1. Create `app/api/<path>/route.ts`.
2. Export `GET`, `POST`, `PUT`, or `DELETE` functions.
3. Use `getUserFromToken(request)` from `app/lib/api-helper.ts` to enforce auth.

---

## Multi-table CRUD

The starter supports any number of entities through one mechanism: the `tables` array in `app/lib/config.ts`. The first entry is the primary one and is shown by default; the rest become accessible from a sidebar table picker that automatically appears when `tables.length > 1`.

**How it works end-to-end:**

- **URL routing** — every `TableConfig.id` becomes a URL segment. The dynamic route `app/api/[table]/route.ts` serves GET/POST for any declared table; `app/api/[table]/[id]/route.ts` handles PUT/DELETE; `app/api/[table]/seed/route.ts` loads samples.
- **Security** — `resolveTableName(id)` in `app/lib/api-helper.ts` validates the id against `appConfig.tables` before any DB call, so random URLs return 404.
- **DB name mapping** — `tableName` lets the DB table differ from the config id. The starter ships with `id: "items"` → `tableName: "products"` (legacy mapping). For new tables, just set both to the same value.
- **Per-table AI prompt** — the chat component rebuilds its system prompt from `currentTable.fields` + `currentTable.entity` + `currentTable.lowStockField` every time the user switches tables, so the agent automatically knows the active schema.
- **Per-table UI** — the dashboard, edit modal, form, search box, filters, command palette, and toasts all read from the active `currentTable`, so adding/removing fields in config instantly re-shapes the UI.

## Charts

Two auto-derived charts appear on the dashboard whenever there is data:

- **Bar chart** — count grouped by the first non-name non-numeric field. For items with a `category` field, this shows items per category. For tasks with a `status` field, this shows tasks per status.
- **Pie chart** — low-stock vs in-stock (only shown when `lowStockField` is set on the active table). When `workflow` is set, the pie is replaced by a per-state distribution.

Colors come from the active theme's `--chart-1` through `--chart-5` CSS variables, set on `<body>` in `app/layout.tsx`. The 5-color palette is defined per accent in `getAccentPalette()` (`app/lib/config.ts`). No extra config is needed — switching `accent` re-skins the charts instantly.

To add a new chart, import a recharts component into `app/components/dashboard.tsx` and pass `palette.chart1` etc. (read via `getComputedStyle(document.body)`) as the `fill` color.

## Workflow system

Every `TableConfig` can declare an optional `workflow: string[]`. When set, the entire UI adapts to that lifecycle — stats, filters, badges, and the AI agent all know the states.

### Declaring a workflow

```ts
{
  id: "tickets",
  entity: { name: "ticket", plural: "tickets", title: "Tickets" },
  fields: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "priority", label: "Priority", type: "select", required: true },
  ],
  searchFields: ["title"],
  workflow: ["Submitted", "Approved", "Assigned", "Resolved"],
  samples: [
    { title: "Login broken", priority: "High", status: "Submitted" },
  ],
}
```

The first state is the default; the list defines the order (used by `WorkflowTimeline`).

### What the workflow enables automatically

- **Auto-stats** — the dashboard replaces its fixed stat cards with `[Total] + [one card per workflow state] + [Filtered]`. Counts are derived via `countByState()` from the current items.
- **Filter pills** — sidebar + main filter buttons are derived from the workflow (e.g. "Submitted / Approved / Assigned / Resolved") instead of the legacy "Low / OK" pair. Tables without `workflow` keep the legacy behavior.
- **`<StatusBadge>`** — colored pill in each row, color taken from the chart palette by state index.
- **`<StatusDropdown>`** — inline `<select>` that calls `apiUpdate({status})` on change. Includes `useTransition` for non-blocking UX and a "WORKFLOW" log entry on every change.
- **`<WorkflowTimeline>`** — horizontal stepper rendered in the edit modal. Current state is filled with its color, past states show a checkmark, future states are outlined.
- **Pie chart** — auto-derived per-state distribution when `workflow` is set.
- **Add form** — gains a Status select defaulted to the first workflow state.
- **AI agent** — gains an `update_status` action. The system prompt lists the workflow states and tells the model which strings are valid.

### API validation

- `POST /api/[table]` — if `status` is in the body, it must match the workflow. If omitted, the default state is filled in automatically.
- `PUT /api/[table]/[id]` — if `status` is in the body, it must match the workflow.
- Invalid values return a 4xx with the valid states listed in the error message.

Both checks are implemented in `prepareInsertStatus()` and `prepareUpdateStatus()` in `app/lib/api-helper.ts`.

### DB requirement

A table that uses a workflow must have a `status text` column. Run this in Supabase:

```sql
alter table products add column status text not null default 'Active';
```

(or set the default to whatever the first state in your `workflow` array is).

### Caveat

State transitions are enforced **client-side and in the API** (i.e. an invalid status string is rejected), but the API does not currently restrict which state you can move *to* (you can skip from "Submitted" to "Resolved" in one step). For most hackathon demos this is fine. To enforce strict step-by-step transitions, add a check in `app/api/[table]/[id]/route.ts` that compares the current row's `status` with the new one.

### Components

- `app/components/workflow/status-badge.tsx` — colored pill
- `app/components/workflow/status-dropdown.tsx` — inline `<select>` with optimistic update
- `app/components/workflow/workflow-timeline.tsx` — horizontal stepper
- `app/components/workflow/index.ts` — barrel export

All three auto-style from the active theme's chart palette.

## Odoo X KSV Hackathon adaptation playbook

The Odoo X KSV hackathon problem statements are revealed on the spot. Use this checklist to go from problem statement to working demo as fast as possible:

1. **Minute 0-5** — Read the problem statement, identify the entity types (1-4 is typical), sketch a quick schema on paper.
2. **Minute 5-15** — Open `app/lib/config.ts`. Set `accent` to match any brand colors, then fill in `tables[]` with one `TableConfig` per entity. Use the entity name, 3-6 fields, and 5-8 sample rows per table. Keep field names short and obvious.
3. **Minute 15-25** — Open `supabase-schema.sql`. For each new table, copy the commented example, rename it, and uncomment it. Paste the full file into the Supabase SQL editor.
4. **Minute 25-35** — Sign up, sign in, click "Load samples" for each table, verify the dashboard. The table picker in the sidebar should switch entities cleanly; charts should render; search should work; the "LIVE" badge in the sidebar confirms realtime is connected.
5. **Minute 35-120** — Build the differentiating features on top. Common extensions:
   - **Lifecycle / status workflow** — add `workflow: ["Draft", "In Review", "Done"]` to the `TableConfig`. The dashboard auto-gains stat cards, filter pills, status badges, an inline `<StatusDropdown>`, a `<WorkflowTimeline>` in the edit modal, and an `update_status` action in the AI agent. See the [Workflow system](#workflow-system) section.
- **Role-based access** — wrap any button in `<Can action="edit">` and the dashboard auto-hides it for read-only users. See the [RBAC](#rbac-role-based-access) section.
   - **Detail view per row** — add `app/items/[id]/page.tsx` with a server-rendered detail page.
   - **Cross-table relations** — use a numeric `item_id` field on the second table; the AI agent already understands this.
   - **Map view** — add a `lat`/`lng` field and render with a Leaflet iframe.
   - **File upload** — add a field with `type: "file"` to any `TableConfig`. Images, PDFs, and docs up to 10MB are handled. See the [File uploads](#file-uploads) section.
6. **Pro tip** — keep the demo creds (`kori@dev.com` / `1234`) pre-filled on the login form so the judge can sign in instantly.
7. **Pro tip** — change `accent` to match the problem domain in one line. Purple for collaboration, blue for finance, green for inventory, red for emergencies, orange for marketplaces.

---

## File uploads

Any `FieldDef` can declare `type: "file"`. When it does, the form generator renders `<FileUpload />` instead of an `<input>`. The uploaded public URL is saved into the row automatically — no extra API call needed.

### Declaring a file field

```ts
{
  id: "products",
  fields: [
    { key: "name",      label: "Name",     type: "text",   required: true },
    { key: "image_url", label: "Photo",    type: "file" },
    { key: "manual",    label: "Manual",   type: "file" },
  ],
}
```

The matching Postgres column must be `text` (or `text null`) since the component writes a URL string:

```sql
alter table products add column image_url text;
alter table products add column manual text;
```

### Supported file types

Defined centrally in `app/lib/storage.ts` (`STORAGE.accept`):

| Category  | MIME types                                                                          |
|-----------|-------------------------------------------------------------------------------------|
| `image`   | `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `image/svg+xml`              |
| `pdf`     | `application/pdf`                                                                   |
| `document`| `msword`, `docx`, `xls`, `xlsx`, `text/plain`, `text/csv`, `text/markdown`         |

Anything outside the allowlist is rejected client-side with a toast and a red error label.

Max size is `STORAGE.maxSizeMB` (default 10MB). Bump it in `app/lib/storage.ts` if you need larger files.

### Storage path convention

Files are uploaded to a single shared bucket called `uploads` with this path:

```
<user_id>/<table_id>/<timestamp>-<safe-filename>
```

Path-level RLS keeps every user scoped to their own folder — see the SQL snippet in `supabase-schema.sql`.

### One-time Supabase setup

1. In the Supabase dashboard: **Storage → New bucket → name: `uploads` → public**.
2. In the SQL editor, paste the uncommented policies from the bottom of `supabase-schema.sql` (or just run them as written).
3. The bucket is public so `<ImagePreview />` can show images without a signed-URL dance. To make it private, add the optional SELECT policy and use `getFileUrl(path, { signed: true })` (not implemented by default — hackathon-friendly is public).

### Components

- `app/components/upload/file-upload.tsx` — drop-in input with `useTransition` for non-blocking uploads, error display, and inline preview
- `app/components/upload/image-preview.tsx` — clickable thumbnail for images, generic file icon for PDFs/docs; sizes `xs | sm | md`

### Helpers (`app/lib/storage.ts`)

- `uploadFile(file, { tableId })` → `{ ok, url, path, category }` / `{ ok: false, error }`
- `deleteFile(path)` → `{ ok }` / `{ ok: false, error }`
- `validateFile(file)` — used internally; export it for custom flows
- `getFileCategory(mime)` — `"image" | "pdf" | "document" | "unknown"`
- `isImageUrl(url)` — used by `ImagePreview` to pick the right rendering
- `pathFromPublicUrl(url)` — reverse-helper if you need to delete a file referenced by URL

### Logs

Every upload emits a `STORAGE` log entry (color-coded in the dev console):

```
STORAGE  Uploading invoice.pdf (342.1KB) -> products
STORAGE  Uploaded: abc.../products/1717...-invoice.pdf  ✓
```

Failures show the original Supabase error message verbatim.

---

## RBAC (role-based access)

Two roles ship out of the box: `admin` and `user`. New sign-ups get `user`; promote to `admin` with a one-line SQL update. Permissions are checked via a centralized `PERMISSIONS` table — components never see role strings.

### Permissions matrix

| Action  | `admin` | `user` |
|---------|---------|--------|
| `view`  | ✓       | ✓      |
| `edit`  | ✓       | ✓      |
| `delete`| ✓       | ✗      |
| `manage`| ✓       | ✗      |

`manage` is reserved for global actions like "Load samples" (admin-only).

### Adding a new role

Three lines in `app/lib/rbac.ts`:

```ts
export const ROLES = ["admin", "user", "editor"] as const;

const PERMISSIONS: Record<Role, Record<Action, boolean>> = {
  admin:  { view: true, edit: true, delete: true, manage: true },
  editor: { view: true, edit: true, delete: false, manage: false },
  user:   { view: true, edit: true, delete: false, manage: false },
};
```

No component changes — every `<Can action="…">` and `requireRole(request, "…")` call auto-adapts.

### One-time SQL setup

Paste the uncommented snippet in `supabase-schema.sql` into the Supabase SQL editor. It will:
1. Create the `profiles` table with a `role` column.
2. Create a trigger on `auth.users` that auto-inserts a `profiles` row with `role = 'user'` on every new sign-up.
3. Enable RLS so users can only read their own profile.

After the first admin signs up, run this once to promote them (the demo `kori@dev.com` is already in the SQL file as a commented snippet):

```sql
update profiles set role = 'admin'
where user_id = (select id from auth.users where email = 'kori@dev.com');
```

### Where checks live

**UI visibility** — wrap any element in `<Can action="…">` or use the `useCan("…")` hook:

```tsx
<Can action="delete">
  <button onClick={() => del(id)}>Delete</button>
</Can>
```

The `<RoleProvider>` is mounted in `app/layout.tsx`; it fetches `/api/me` once on mount. The role is cached in a `RoleContext` that every component can read via `useUserRole()`.

**API enforcement** — every route calls `requireRole(request, action)`:

```ts
export async function POST(request: Request, { params }) {
  requireRole(request, "edit");   // throws "Forbidden" if role lacks 'edit'
  // ...
}
```

`requireRole` reads the role from the `x-user-role` header that `middleware.ts` injects after validating the JWT and looking up the profile. If a user calls `/api/items` with a token that belongs to a `user` role, the response is `403 Forbidden` and the body says `Forbidden: role "user" cannot delete`.

**Middleware** — `middleware.ts` (at the repo root) runs on every non-static request:
- Validates the Supabase access token from the cookie or `Authorization` header
- Reads the role from `profiles`
- Attaches `x-user-role` and `x-user-id` to the downstream request
- Redirects unauthenticated requests on protected pages (`/dashboard`, `/settings`, `/profile`) to `/login`
- Returns `401` for unauthenticated API calls

The auth checks inside each page component (`useEffect → getUser → router.push("/login")`) are still there as a UX safety net, but the actual security is now at the edge.

**AI agent** — destructive actions in `app/components/chat.tsx` are skipped with a log line if the user's role lacks the permission. The agent never reaches the network.

### Components & helpers

| File | Purpose |
|------|---------|
| `app/lib/rbac.ts` | `Role`, `ROLES`, `PERMISSIONS`, `canView/canEdit/canDelete/canManage/can`, `normalizeRole`, `ROLE_HEADER` |
| `app/lib/role-context.tsx` | `<RoleProvider>` + `useUserRole()` hook |
| `app/components/role/can.tsx` | `<Can action>` + `useCan()` |
| `app/components/role/role-badge.tsx` | `<RoleBadge role>` |
| `app/api/me/route.ts` | Returns `{ id, email, role }` for the current user |
| `middleware.ts` | Auth + role gate + header injection |
| `app/lib/api-helper.ts` | `getRoleFromRequest`, `requireRole` (re-exported for route handlers) |

### Demo behavior

- `kori@dev.com` / `1234` (after running the SQL promote snippet) → sees full dashboard with Add / Edit / Delete / Seed buttons.
- A new sign-up → sees the same dashboard minus Delete and Load samples; can still view, search, filter, open the edit modal (read-only), and chat with the AI (read-only). The API returns 403 if they try to call a destructive endpoint directly.

---

## AI utility layer

The chat widget is just one consumer. The real reuse sits in `app/lib/ai/` — a small, provider-agnostic layer of typed helpers and prompts you can call from any component, route, or external system.

### Architecture

```
app/lib/ai/
├── provider.ts   # AIProvider interface + openRouterProvider() + mockProvider()
├── prompts.ts    # central PROMPTS object + buildAgentPrompt(opts) factory
├── run.ts        # Result<T> + runTask<T>() (JSON parse + 1 retry + backoff) + runText()
└── index.ts      # barrel: summarize, classify, prioritize, recommend, extractInsights, askAgent
```

- **`AIProvider`** is the only thing that talks to a real model. Its interface is intentionally tiny: `complete(messages) → string`. JSON-mode, streaming, and tool-use are deferred to provider-specific subclasses — none of which you need to implement for the defaults.
- **`runTask<T>()`** wraps any prompt with: schema-hint injection, ```json fence stripping, **one retry with a "fix it" nudge** on parse failure, and **exponential backoff (350ms / 700ms)** on network failure. Returns a `Result<T>` discriminated union — never throws on bad LLM output.
- **`prompts.ts`** is the single source of truth for prompt text. Edit once, every helper and the chat widget picks it up.

### Available helpers

| Helper | Input | Output |
|---|---|---|
| `summarize(text)` | free text | `{ summary: string, keyPoints: string[] }` |
| `classify(text, categories)` | text + category list | `{ category: string, confidence: "low"\|"medium"\|"high" }` |
| `prioritize(text)` | task / issue description | `{ priority: "P0"\|"P1"\|"P2"\|"P3", reason: string }` |
| `recommend(context)` | context about the user/situation | `{ recommendation: string, rationale: string, alternatives: string[] }` |
| `extractInsights(data)` | any JSON data | `{ insights: { title, detail, severity }[] }` |
| `askAgent(opts)` | entity config + items + user message | `{ actions: AgentAction[], message: string }` (powers the chat widget) |
| `runPlainText(system, user)` | raw prompt | free-form text reply |

All return a `Result<T>`: `{ ok: true, data, raw }` or `{ ok: false, error, raw? }`.

### Env vars

| Variable | Required? | Default | Notes |
|---|---|---|---|
| `OPENROUTER_API_KEY` | yes (for real calls) | — | If missing → app auto-falls back to `mockProvider`, so dev still boots |
| `OPENROUTER_MODEL` | no | `openrouter/free` | Any OpenRouter model ID |
| `OPENROUTER_REFERER` | no | — | Optional `HTTP-Referer` header |
| `OPENROUTER_TITLE` | no | — | Optional `X-Title` header |
| `AI_PROVIDER=mock` | no | — | Force the mock provider (useful in tests) |

### Swapping the provider

`provider.ts` is the only file you touch:

```ts
// app/lib/ai/provider.ts
import type { AIProvider, ChatMessage } from "./provider";

export function anthropicProvider(): AIProvider {
  return {
    name: "anthropic",
    async complete(messages: ChatMessage[]) { /* ... */ },
  };
}

// then in getProvider():
return process.env.ANTHROPIC_API_KEY ? anthropicProvider() : mockProvider();
```

No helper, route, or component needs to change.

### Calling from a server route

```ts
// app/api/ai/route.ts (already included)
POST { task: "summarize", text: "..." }
// → { ok: true, data: { summary, keyPoints }, raw }
```

### Calling from a client component

```ts
import { summarize } from "@/app/lib/ai"; // or import directly in a server component
const result = await summarize(notes);
if (result.ok) setKeyPoints(result.data.keyPoints);
```

> Note: helpers hit the provider directly, so they need a server context (API route, server component, server action). For browser-side calls, hit `/api/ai` instead.

### Adding a new AI task in 3 lines

1. Add a `translateglish` entry to `PROMPTS` in `prompts.ts` (template function).
2. Add `translateglish(input)` to the barrel in `index.ts` — call `runTask({ system, user, parse, schemaHint: '{ "translation": string }' })`.
3. (Optional) expose it in `/api/ai` by adding the case.

### Hackathon playbook — using AI elsewhere

- Need a "smart search" box? Call `classify(query, categories)` to bucket the query, then filter.
- Need a daily summary email? `summarize()` over a day's worth of activity in a cron route.
- Need anomaly detection? `extractInsights(items)` and check `severity === "high"`.
- Need auto-categorization on insert? Call `classify()` from the POST route handler before persisting.

---

## Project structure

```
app/
├── api/
│   ├── ai/route.ts                   # generic AI tasks (summarize, classify, ...)
│   ├── chat/route.ts                 # legacy free-form chat (delegates to provider)
│   ├── me/route.ts                   # current user + role
│   └── [table]/                      # dynamic, per declared table
│       ├── route.ts                  # GET / POST
│       ├── [id]/route.ts             # PUT / DELETE
│       └── seed/route.ts             # POST (load samples)
├── components/
│   ├── landing.tsx                   # public home
│   ├── auth.tsx                      # login + signup form
│   ├── navbar.tsx                    # auth-aware common navbar
│   ├── dashboard.tsx                 # main CRUD UI + charts + table picker
│   ├── edit-modal.tsx                # edit popover
│   ├── chat.tsx                      # AI agent widget
│   ├── command-palette.tsx           # ⌘K
│   ├── log-panel.tsx                 # dev console
│   ├── spin.tsx                      # loading spinner
│   └── charts/                       # recharts wrappers
│       ├── bar-chart.tsx
│       └── pie-chart.tsx
├── lib/
│   ├── config.ts                     # ★ SINGLE SOURCE OF TRUTH
│   ├── supabase-client.ts            # browser client factory
│   ├── supabase-db.ts                # auth helpers (signIn/Up/Out)
│   ├── api-helper.ts                 # client + server API helpers
│   ├── log-context.tsx               # dev log React context
│   ├── toast-context.tsx             # toast React context
│   ├── workflow.ts                   # state helpers (hasWorkflow, getStateColor, ...)
│   ├── storage.ts                    # file upload helpers
│   ├── rbac.ts                       # roles + PERMISSIONS matrix
│   ├── role-context.tsx              # <RoleProvider> + useUserRole()
│   └── ai/                           # provider-agnostic AI utility layer
│       ├── provider.ts               # AIProvider + openRouter + mock
│       ├── prompts.ts                # central PROMPTS + buildAgentPrompt
│       ├── run.ts                    # runTask<T> + runText + Result<T>
│       └── index.ts                  # summarize/classify/prioritize/...
├── dashboard/page.tsx                # auth-guarded dashboard
├── settings/page.tsx                 # auth-guarded settings
├── profile/page.tsx                  # auth-guarded profile
├── login/page.tsx                    # login form
├── signup/page.tsx                   # signup form
├── page.tsx                          # landing
├── layout.tsx                        # root layout (providers, theme vars)
└── globals.css                       # theme tokens + animations

supabase-schema.sql                   # products table + RLS + example block
.env.example                          # env template
```

---

## How the auth + RLS flow works

1. User signs in via the Supabase browser client → JWT stored in localStorage.
2. Client calls `fetch('/api/{tableId}', { headers: { Authorization: 'Bearer <jwt>' } })`.
3. API route calls `getUserFromToken(request)` → creates a Supabase client with that token → verifies user.
4. All DB queries use the user-scoped client → RLS policies (`auth.uid() = user_id`) ensure users only see their own data.

You never need to write auth checks inside route handlers — `getUserFromToken` throws if the token is missing/invalid, and the catch block returns `401`.

---

## How realtime works

The dashboard subscribes to `postgres_changes` events on the active table via Supabase Realtime. Whenever any row is inserted, updated, or deleted (by any user, on any device), the dashboard refetches the table and the change appears in < 1 second. A "LIVE" badge in the sidebar confirms the connection.

**One-time SQL setup required.** Realtime is off by default for new tables. The starter schema includes the line:
```sql
alter publication supabase_realtime add table products;
```
Add a matching line for every additional table you create, e.g. `alter publication supabase_realtime add table reviews;`. Without this, the subscription connects but no events are delivered.

---

## How the AI agent works

1. The chat component (`app/components/chat.tsx`) builds a system prompt from the **active table's** config:
   - It lists the entity name and field keys (with required markers)
   - It includes the low-stock rule if `lowStockField` is set
   - It serializes the current data as JSON
   - It tells the model to respond with strict JSON: `{ actions: [...], message: "..." }`

2. The model returns an array of actions:
   - `{ action: "update_stock", productId, newQuantity }` — set absolute quantity on the `lowStockField`
   - `{ action: "delete_item", productId }` — remove
   - `{ action: "add_item", name, ...other fields }` — insert
   - `{ action: "update_status", productId, newStatus }` — move a record to a new workflow state (only when the active table has `workflow` set; `newStatus` must be one of the configured states)
   - `{ action: "query" }` (or empty actions) — just answer in `message`

3. The client executes each action by calling the existing API routes (`apiUpdate`, `apiRemove`, `apiInsert`) on the active `tableId`.

4. The UI re-fetches the list and shows what changed.

Because the system prompt is rebuilt from `currentTable.fields` every time the user switches tables (or fields are edited in `config.ts`), the agent **automatically knows the new schema** — no prompt engineering needed.

---

## Useful scripts

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # run the production build
npm run lint     # ESLint
```

---

## Conventions

- **No comments in source files** — code is self-documenting.
- **Tailwind theme tokens** — use `bg-bg`, `bg-surface`, `border-border`, `text-fg`, `text-muted`, `text-accent`, `text-danger`, `bg-ok-bg`, `bg-low-bg`, etc. (defined in `app/globals.css`).
- **Animations** — `animate-fadeIn`, `animate-fadeInUp`, `animate-slideInLeft`, `animate-slideInRight`, plus `delay-1`...`delay-8`.
- **Icons** — text symbols, not an icon library. Keep the bundle small for hackathons.
- **Tables** — always declare new entities as `TableConfig` entries in `app/lib/config.ts`. Never hardcode table names in components or API routes.

---

## License

MIT — use, fork, ship. Happy hacking!
