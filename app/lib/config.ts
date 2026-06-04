// =============================================================
//  ★ SINGLE SOURCE OF TRUTH FOR THE STARTER  ★
// =============================================================
//  To adapt this starter to a new problem statement, edit ONLY
//  this file (and optionally the Supabase SQL schema).
//
//  - Change `accent` to swap the entire color theme.
//  - Add/remove/reorder entries in `tables` to support multiple
//    entities. The first table is shown by default; the rest are
//    accessible from the dashboard's sidebar table picker.
//  - Each table has its own entity, fields, search behavior,
//    low-stock logic, and sample data.
// =============================================================

export type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
};

export type TableConfig = {
  // URL segment used by /api/[id] and as the table picker key.
  // Must be unique and URL-safe.
  id: string;
  // Actual Postgres table name. Defaults to `id` if omitted.
  tableName?: string;
  // Display + data shape
  entity: {
    name: string;
    plural: string;
    title: string;
  };
  fields: readonly FieldDef[];
  searchFields: readonly string[];
  // Drives the red dot + low-stock filter. Omit if not applicable.
  lowStockField?: string;
  lowStockThreshold?: number;
  // Optional workflow: ordered list of states this entity moves through.
  // If set, the matching Postgres table must have a `status` text column
  // (defaulted to the first state). The dashboard auto-derives stats,
  // a "By status" bar chart, and a status dropdown per row.
  workflow?: readonly string[];
  // Optional: per-table sample data for the "Load samples" button
  samples: readonly Record<string, string | number>[];
};

// =============================================================
//  Tables — declare every entity your app manages here.
// =============================================================
//  The first table is the "primary" one. Legacy `appConfig.entity`,
//  `appConfig.fields`, etc. mirror this table for backwards compat.
// =============================================================
const PRIMARY_TABLE: TableConfig = {
  id: "items",
  tableName: "products",  // legacy: keep DB name as "products"
  entity: {
    name: "item",
    plural: "items",
    title: "Items",
  },
  fields: [
    { key: "name",     label: "Name",     type: "text",   required: true, placeholder: "e.g. iPhone 15" },
    { key: "price",    label: "Price",    type: "number", required: true, placeholder: "0" },
    { key: "quantity", label: "Quantity", type: "number", required: true, placeholder: "0" },
    { key: "category", label: "Category", type: "text",                   placeholder: "General" },
  ],
  searchFields: ["name", "category"],
  lowStockField: "quantity",
  lowStockThreshold: 10,
  workflow: ["Active", "Low"],
  samples: [
    { name: "MacBook Air M3", price: 99999,  quantity: 12, category: "Laptops",    status: "Active" },
    { name: "iPhone 15 Pro",  price: 134999, quantity: 3,  category: "Phones",     status: "Low"    },
    { name: "AirPods Pro",    price: 24999,  quantity: 89, category: "Audio",      status: "Active" },
    { name: "iPad Mini",      price: 49999,  quantity: 7,  category: "Tablets",    status: "Low"    },
    { name: "Apple Watch S9", price: 41999,  quantity: 2,  category: "Wearables",  status: "Low"    },
    { name: "Magic Keyboard", price: 11999,  quantity: 45, category: "Accessories", status: "Active" },
  ],
};

// Add more tables here as your problem statement demands.
// Example: a "tickets" table for a helpdesk problem.
//
// const TICKETS_TABLE: TableConfig = {
//   id: "tickets",
//   entity: { name: "ticket", plural: "tickets", title: "Tickets" },
//   fields: [
//     { key: "title",    label: "Title",    type: "text",     required: true },
//     { key: "priority", label: "Priority", type: "select",   required: true },
//     { key: "notes",    label: "Notes",    type: "textarea" },
//   ],
//   searchFields: ["title", "notes"],
//   workflow: ["Submitted", "Approved", "Assigned", "Resolved"],
//   samples: [
//     { title: "Login broken", priority: "High", status: "Submitted" },
//   ],
// };

export const appConfig = {
  // ---------- Branding ----------
  name: "DataHub",
  tagline: "AI-powered data workspace",
  description: "Manage any data with search, filters, and an AI agent.",

  // Accent: drives the entire theme. See getAccentPalette() below.
  accent: "green" as ThemeName,

  // ---------- Landing page copy ----------
  // Every string the public landing page displays lives here.
  // Edit this section to rebrand the marketing site in one place.
  landing: {
    pill: "Next.js 16 + Supabase + AI",
    heroAccent: "that talks back.",
    features: [
      { title: "Real-time sync",   desc: "Live updates from Supabase with row-level security. Your data, isolated per user." },
      { title: "AI agent",         desc: "Ask in plain English. The agent reads your data and takes real actions on it." },
      { title: "Voice commands",   desc: "Mic-in, speaker-out. Search, update, and delete by talking. Chrome + Edge." },
      { title: "Instant search",   desc: "Filter and search through your data with ⌘K command palette." },
      { title: "Toast feedback",   desc: "Every action gets a confirmation. Errors, successes, and info, all in one place." },
      { title: "Hackathon-ready",  desc: "One config file to swap branding, fields, and AI behavior. Ship in hours." },
    ],
    howItWorks: [
      { num: "01", title: "Edit one file", desc: "Change branding, fields, and AI prompts in `app/lib/config.ts`." },
      { num: "02", title: "Add a table",   desc: "Run the SQL schema in Supabase, or tweak it for your domain." },
      { num: "03", title: "Ship it",       desc: "Auth, CRUD, AI, and UI all adapt. Deploy to Vercel in minutes." },
    ],
    useCases: [
      "Inventory & stock tracking",
      "Task & project boards",
      "Recipe & meal planners",
      "Bookmark managers",
      "CRM & contact lists",
      "Reading lists & notes",
    ],
  },

  // ---------- Tables ----------
  // First entry = primary table. The dashboard, AI agent, and form
  // all operate on the active table (switchable from the sidebar).
  tables: [PRIMARY_TABLE] as readonly TableConfig[],

  // ---------- Legacy single-table accessors ----------
  // These mirror `tables[0]` for backwards compat with older code.
  // New code should use `tables.find(t => t.id === ...)` directly.
  get entity() { return PRIMARY_TABLE.entity; },
  get fields() { return PRIMARY_TABLE.fields; },
  get searchFields() { return PRIMARY_TABLE.searchFields; },
  get lowStockField() { return PRIMARY_TABLE.lowStockField ?? ""; },
  get lowStockThreshold() { return PRIMARY_TABLE.lowStockThreshold ?? 0; },
  get samples() { return PRIMARY_TABLE.samples; },

  // ---------- AI Agent ----------
  // Global AI config; the system prompt is built per active table
  // so the agent automatically knows the current schema.
  ai: {
    name: "AI Agent",
    welcome: "Hey! I can answer questions and take actions. Try the suggestions below.",
    suggestions: [
      "Show items with low stock",
      "What is the total value?",
      "Add 10 units to the first item",
    ],
  },
} as const;

// =============================================================
//  Helpers
// =============================================================

export function getTableById(id: string): TableConfig | undefined {
  return appConfig.tables.find((t) => t.id === id);
}

export function getPrimaryTable(): TableConfig {
  return appConfig.tables[0];
}

export function isLowStock(item: Record<string, unknown>, table: TableConfig = PRIMARY_TABLE): boolean {
  const field = table.lowStockField;
  if (!field) return false;
  const value = Number(item[field] ?? 0);
  return value < (table.lowStockThreshold ?? 0);
}

// =============================================================
//  Accent palette — drives the actual CSS color values
// =============================================================
export type ThemeName = "green" | "blue" | "purple" | "red" | "orange";

export type AccentPalette = {
  accent: string;
  accentHover: string;
  rgb: string;
  okBg: string;
  okBorder: string;
  glow: string;

  bg: string;
  surface: string;
  border: string;
  muted: string;
  subtle: string;
  fg: string;

  danger: string;
  dangerRgb: string;
  lowBg: string;
  lowBorder: string;

  // Extra colors for charts (variants of the accent)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

const ACCENT_PALETTES: Record<ThemeName, AccentPalette> = {
  green: {
    accent: "#22c55e", accentHover: "#16a34a", rgb: "34, 197, 94",
    okBg: "rgba(34, 197, 94, 0.08)", okBorder: "rgba(34, 197, 94, 0.25)", glow: "rgba(34, 197, 94, 0.5)",
    bg: "#080f08", surface: "#0d1a0d", border: "#162716", muted: "#3a5a3a", subtle: "#7a9a7a", fg: "#e0f0e0",
    danger: "#ef4444", dangerRgb: "239, 68, 68",
    lowBg: "rgba(239, 68, 68, 0.08)", lowBorder: "rgba(239, 68, 68, 0.25)",
    chart1: "#22c55e", chart2: "#84cc16", chart3: "#eab308", chart4: "#f59e0b", chart5: "#10b981",
  },
  blue: {
    accent: "#3b82f6", accentHover: "#2563eb", rgb: "59, 130, 246",
    okBg: "rgba(59, 130, 246, 0.08)", okBorder: "rgba(59, 130, 246, 0.25)", glow: "rgba(59, 130, 246, 0.5)",
    bg: "#080a10", surface: "#0d131a", border: "#1a223a", muted: "#3a4a6a", subtle: "#7a8aaa", fg: "#e8eef5",
    danger: "#ef4444", dangerRgb: "239, 68, 68",
    lowBg: "rgba(239, 68, 68, 0.08)", lowBorder: "rgba(239, 68, 68, 0.25)",
    chart1: "#3b82f6", chart2: "#06b6d4", chart3: "#8b5cf6", chart4: "#ec4899", chart5: "#10b981",
  },
  purple: {
    accent: "#a855f7", accentHover: "#9333ea", rgb: "168, 85, 247",
    okBg: "rgba(168, 85, 247, 0.08)", okBorder: "rgba(168, 85, 247, 0.25)", glow: "rgba(168, 85, 247, 0.5)",
    bg: "#0a0810", surface: "#130e1a", border: "#241a2b", muted: "#5a4a6a", subtle: "#9a8aaa", fg: "#f0e8f5",
    danger: "#ef4444", dangerRgb: "239, 68, 68",
    lowBg: "rgba(239, 68, 68, 0.08)", lowBorder: "rgba(239, 68, 68, 0.25)",
    chart1: "#a855f7", chart2: "#ec4899", chart3: "#f43f5e", chart4: "#f59e0b", chart5: "#10b981",
  },
  red: {
    accent: "#ef4444", accentHover: "#dc2626", rgb: "239, 68, 68",
    okBg: "rgba(239, 68, 68, 0.08)", okBorder: "rgba(239, 68, 68, 0.25)", glow: "rgba(239, 68, 68, 0.5)",
    bg: "#100808", surface: "#1a0d0d", border: "#2b1616", muted: "#6a3a3a", subtle: "#aa7a7a", fg: "#f5e8e8",
    danger: "#ef4444", dangerRgb: "239, 68, 68",
    lowBg: "rgba(239, 68, 68, 0.08)", lowBorder: "rgba(239, 68, 68, 0.25)",
    chart1: "#ef4444", chart2: "#f59e0b", chart3: "#eab308", chart4: "#a855f7", chart5: "#3b82f6",
  },
  orange: {
    accent: "#f97316", accentHover: "#ea580c", rgb: "249, 115, 22",
    okBg: "rgba(249, 115, 22, 0.08)", okBorder: "rgba(249, 115, 22, 0.25)", glow: "rgba(249, 115, 22, 0.5)",
    bg: "#100a08", surface: "#1a110d", border: "#2b1f16", muted: "#6a4a3a", subtle: "#aa8a7a", fg: "#f5eee8",
    danger: "#ef4444", dangerRgb: "239, 68, 68",
    lowBg: "rgba(239, 68, 68, 0.08)", lowBorder: "rgba(239, 68, 68, 0.25)",
    chart1: "#f97316", chart2: "#ef4444", chart3: "#eab308", chart4: "#84cc16", chart5: "#06b6d4",
  },
};

export function getAccentPalette(name: string): AccentPalette {
  return ACCENT_PALETTES[name as ThemeName] ?? ACCENT_PALETTES.green;
}
