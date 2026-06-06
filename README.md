# Vendor Bridge — Procurement ERP

A full-stack procurement management system built with **Next.js 16 (App Router)**, **Prisma 7**, **SQLite**, and **NextAuth v4**. Manage RFQs, quotations, approvals, purchase orders, and invoices end-to-end with role-based access control.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Prisma](https://img.shields.io/badge/Prisma-7-2d3748) ![SQLite](https://img.shields.io/badge/SQLite-0000ff) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Landing / Auth | ✅ | Public landing page, credentials auth, forgot/reset password, RBAC (Admin, Procurement Officer, Manager, Vendor) |
| RFQ Management | ✅ | Create, list, detail RFQs with line items, status workflow (DRAFT→PUBLISHED→CLOSED→CANCELLED) |
| Quotation Submission | ✅ | Vendors submit quotations against RFQs, auto-calc totals, DRAFT/SUBMITTED/ACCEPTED/REJECTED workflow |
| Quotation Comparison | ✅ | Side-by-side comparison table, price + delivery scoring, CSV/PDF export, best-value recommendation |
| Approval Workflow | ✅ | Manager approves/rejects quotations with remarks, auto-creates approval records, vendor notifications |
| Analytics Dashboard | ✅ | Summary cards, pie/line/bar charts (recharts), recent activity feed, top vendors table |
| Purchase Orders | ✅ | Generate POs from accepted quotations, auto PO number, status workflow (PENDING→CONFIRMED→SHIPPED→DELIVERED), cancellation |
| Invoices | ✅ | Generate invoices from POs, auto INV number, subtotal/tax/total, status workflow (DRAFT→SENT→PAID/OVERDUE), PDF download, printable preview |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 |
| Database | SQLite via Prisma 7 + better-sqlite3 |
| Auth | NextAuth v4 (Credentials) |
| Validation | Zod v4 |
| Charts | recharts |
| PDF | jspdf + jspdf-autotable |
| Icons | lucide-react |

---

## Quick start

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Default roles

Create users via `/register` — assign roles directly in the database, or use the seed script if available.

---

## Project structure

```
app/
├── api/                    # Route handlers for each module
│   ├── approvals/
│   ├── auth/
│   ├── comparison/
│   ├── dashboard/
│   ├── invoices/
│   ├── purchase-orders/
│   ├── quotations/
│   ├── rfqs/
│   └── vendor-profile/
├── dashboard/              # Protected pages
│   ├── approvals/
│   ├── invoices/
│   ├── purchase-orders/
│   ├── quotations/
│   └── rfqs/
│   └── vendor-profile/
├── components/             # Shared UI (sidebar, navbar, etc.)
├── layout.tsx
└── page.tsx

lib/
├── services/               # Business logic per module
│   ├── approval.service.ts
│   ├── comparison.service.ts
│   ├── dashboard.service.ts
│   ├── invoice.service.ts
│   ├── purchaseOrder.service.ts
│   └── quotation.service.ts
├── auth.ts                 # NextAuth config
├── permissions.ts          # RBAC helpers
├── prisma.ts               # PrismaClient singleton
└── ...

prisma/
├── schema.prisma           # Full data model
└── ...

features/rfq/               # Early module pattern (legacy)
```

---

## RBAC

| Permission | Admin | Procurement Officer | Manager | Vendor |
|------------|-------|-------------------|---------|--------|
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| Approve | ✅ | ❌ | ✅ | ❌ |
| Create RFQ | ✅ | ✅ | ❌ | ❌ |
| Submit Quotation | ✅ | ❌ | ❌ | ✅ |
| Compare Quotations | ✅ | ✅ | ✅ | ❌ |

---

## Status workflows

**RFQ**: DRAFT → PUBLISHED → CLOSED  
**Quotation**: DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED / REJECTED  
**Approval**: PENDING → APPROVED / REJECTED  
**Purchase Order**: PENDING → CONFIRMED → SHIPPED → DELIVERED *(any → CANCELLED)*  
**Invoice**: DRAFT → SENT → PAID *(or OVERDUE → PAID / WRITTEN_OFF / CANCELLED)*

---

## Useful scripts

```bash
npm run dev              # Dev server (LAN accessible)
npm run dev:local        # Dev server (localhost only)
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # ESLint
npx prisma db push       # Sync schema to SQLite
npx prisma studio        # Browse data via GUI
```

---

## Conventions

- **No comments in source files** — code is self-documenting.
- **Tailwind theme tokens** — `bg-bg`, `bg-surface`, `border-border`, `text-fg`, `text-muted`, `text-accent`, etc.
- **Page structure** — `"use client"` at top, session check on mount, loading/empty/error states for every page.
- **Service layer** — business logic lives in `lib/services/*.service.ts`, called from API routes.
- **API pattern** — `getServerSession` → permission check → service call → `NextResponse.json`.
- **Activity logging** — every state-changing operation creates an `ActivityLog` record with free-form strings.
- **Notifications** — vendors and procurement officers receive `Notification` records on key events.
- **Naming** — `params` / `searchParams` are Promises (Next.js 15+), must be `await`ed or unwrapped with `use()`.

---

## License

MIT — use, fork, ship.
