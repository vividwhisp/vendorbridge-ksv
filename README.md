# DataHub — Hackathon Starter

A reusable full-stack starter built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Supabase**, **recharts** and an **AI agent** integration.

Designed to be **adapted to any problem statement in minutes** by editing a single config file. Built for the Odoo X KSV Hackathon 2026 in Gandhinagar.

---

## What's included

- **Auth** — Supabase email/password login + signup (`/login`, `/signup`)
- **Multi-table CRUD** — Token-aware API routes under `app/api/[table]/*` (GET / POST / PUT / DELETE / seed) — supports any number of entities
- **Dashboard** — Auth-aware navbar, sidebar nav, vertical list, search + filters, edit modal, slide-in log panel, table picker
- **Charts** — Auto-derived bar + pie charts (recharts) themed from the active color palette
- **Toast system** — React context, no extra deps
- **Command palette** — `⌘K` / `Ctrl+K` to search items and run commands
- **AI agent** — Floating chat widget, takes real actions on the DB via JSON actions; system prompt auto-rebuilds per active table
- **Voice I/O** — Speech recognition + speech synthesis (Chrome/Edge)
- **Settings / Profile pages** — Auth-guarded routes
- **Landing page** — Public home with features, how-it-works, use cases, and footer
- **Dev log** — Color-coded console panel showing every layer (UI, API, AUTH, LLM, AGENT, DB)
- **Row-level security** — Per-user data isolation via Supabase RLS

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
- **Pie chart** — low-stock vs in-stock (only shown when `lowStockField` is set on the active table).

Colors come from the active theme's `--chart-1` through `--chart-5` CSS variables, set on `<body>` in `app/layout.tsx`. The 5-color palette is defined per accent in `getAccentPalette()` (`app/lib/config.ts`). No extra config is needed — switching `accent` re-skins the charts instantly.

To add a new chart, import a recharts component into `app/components/dashboard.tsx` and pass `palette.chart1` etc. (read via `getComputedStyle(document.body)`) as the `fill` color.

## Odoo X KSV Hackathon adaptation playbook

The Odoo X KSV hackathon problem statements are revealed on the spot. Use this checklist to go from problem statement to working demo as fast as possible:

1. **Minute 0-5** — Read the problem statement, identify the entity types (1-4 is typical), sketch a quick schema on paper.
2. **Minute 5-15** — Open `app/lib/config.ts`. Set `accent` to match any brand colors, then fill in `tables[]` with one `TableConfig` per entity. Use the entity name, 3-6 fields, and 5-8 sample rows per table. Keep field names short and obvious.
3. **Minute 15-25** — Open `supabase-schema.sql`. For each new table, copy the commented example, rename it, and uncomment it. Paste the full file into the Supabase SQL editor.
4. **Minute 25-35** — Sign up, sign in, click "Load samples" for each table, verify the dashboard. The table picker in the sidebar should switch entities cleanly; charts should render; search should work.
5. **Minute 35-120** — Build the differentiating features on top. Common extensions:
   - **Filters by status** — add `statuses` to the entity and a filter pill in the sidebar.
   - **Detail view per row** — add `app/items/[id]/page.tsx` with a server-rendered detail page.
   - **Cross-table relations** — use a numeric `item_id` field on the second table; the AI agent already understands this.
   - **Map view** — add a `lat`/`lng` field and render with a Leaflet iframe.
   - **File upload** — use Supabase Storage with a `file_url` text field.
   - **Realtime** — wire `supabase.channel(...).on('postgres_changes', ...)` to refresh the list on inserts/updates.
6. **Pro tip** — keep the demo creds (`kori@dev.com` / `1234`) pre-filled on the login form so the judge can sign in instantly.
7. **Pro tip** — change `accent` to match the problem domain in one line. Purple for collaboration, blue for finance, green for inventory, red for emergencies, orange for marketplaces.

---

## Project structure

```
app/
├── api/
│   ├── chat/route.ts                 # OpenRouter proxy
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
│   └── toast-context.tsx             # toast React context
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
