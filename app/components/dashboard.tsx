"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../lib/supabase-db";
import { useLog } from "../lib/log-context";
import type { Product, User } from "../types";
import Chat from "./chat";
import EditModal from "./edit-modal";
import LogPanel from "./log-panel";
import Spin from "./spin";

type DashboardProps = {
  user: User;
};

const emptyForm = { name: "", price: "", quantity: "", category: "" };

const navItems = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "logs", label: "Logs" },
];

export default function DashboardView({ user }: DashboardProps) {
  const router = useRouter();
  const { log, logs, clearLogs } = useLog();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [activeNav, setActiveNav] = useState("products");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;
    db.getAll()
      .then((data) => {
        if (!cancelled) { setProducts(data); setLoading(false); log("DB", `${data.length} products loaded from Supabase`, true); }
      })
      .catch((error: unknown) => {
        if (!cancelled) { log("DB", error instanceof Error ? error.message : "Could not load products.", false, true); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [log]);

  async function add() {
    if (!form.name || !form.price || !form.quantity) return;
    setAdding(true);
    log("API", "POST /api/products");
    log("DB", `supabase.from('products').insert({name:'${form.name}'})`);
    try {
      const row = await db.insert({ name: form.name, price: Number(form.price), quantity: Number(form.quantity), category: form.category || "General" });
      log("DB", `Row inserted -> id:${row.id}`, true);
      setProducts((prev) => [...prev, row]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (error) {
      log("DB", error instanceof Error ? error.message : "Could not add product.", false, true);
    } finally { setAdding(false); }
  }

  async function save(id: number, data: Partial<Omit<Product, "id">>) {
    log("API", `PUT /api/products/${id}`);
    log("DB", `supabase.from('products').update(data).eq('id',${id})`);
    try {
      const updated = await db.update(id, data);
      log("DB", "Row updated", true);
      setProducts((prev) => prev.map((item) => item.id === id ? updated : item));
      setEditProduct(null);
    } catch (error) {
      log("DB", error instanceof Error ? error.message : "Could not update product.", false, true);
    }
  }

  async function del(id: number) {
    setDeleting(id);
    log("API", `DELETE /api/products/${id}`);
    log("DB", `supabase.from('products').delete().eq('id',${id})`);
    try {
      await db.remove(id);
      log("DB", "Deleted", true);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      log("DB", error instanceof Error ? error.message : "Could not delete product.", false, true);
    } finally { setDeleting(null); }
  }

  async function seedSamples() {
    setSeeding(true);
    log("DB", "Loading sample products for current Supabase user...");
    try {
      const rows = await db.seedStarterProducts();
      log("DB", `${rows.length} sample products inserted`, true);
      setProducts((prev) => [...prev, ...rows]);
    } catch (error) {
      log("DB", error instanceof Error ? error.message : "Could not load sample products.", false, true);
    } finally { setSeeding(false); }
  }

  async function logout() {
    log("AUTH", "supabase.auth.signOut()");
    await db.signOut();
    log("AUTH", "Session cleared", true);
    router.push("/");
  }

  const totalVal = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const lowCount = products.filter((p) => p.quantity < 10).length;
  const okCount = products.filter((p) => p.quantity >= 10).length;
  const filtered = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || (filter === "low" && p.quantity < 10) || (filter === "ok" && p.quantity >= 10);
    return ms && mf;
  });

  const stats = [
    { label: "Total Products", value: products.length },
    { label: "Total Value", value: `INR ${totalVal.toLocaleString()}`, accent: true },
    { label: "Low Stock", value: lowCount, danger: lowCount > 0 },
    { label: "In Stock", value: okCount },
  ];

  function handleNav(id: string) {
    setActiveNav(id);
    if (id === "logs") { setShowLogs((prev) => !prev); return; }
    setShowLogs(false);
    if (id === "overview") setActiveNav("products");
  }

  return (
    <div className="min-h-screen flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-56 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative`}>
        <div className="flex items-center gap-2 h-14 px-5 border-b border-border">
          <span className="text-accent text-lg">&#9632;</span>
          <span className="text-fg font-semibold text-sm">Inventory</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`text-left text-sm rounded-lg px-3 py-2 transition-colors ${
                activeNav === item.id && item.id !== "logs"
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:text-fg hover:bg-border/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-border">
          <div className="text-xs text-muted mb-2 truncate">{user.email}</div>
          <button onClick={logout} className="w-full text-xs text-muted hover:text-danger border border-border hover:border-danger rounded-lg py-1.5 transition-colors">
            Sign Out
          </button>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-3 right-3 text-muted hover:text-fg">&times;</button>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted hover:text-fg text-lg">&#9776;</button>
              <span className="text-fg font-medium text-sm hidden sm:inline">Products</span>
              <span className="text-muted text-[10px] font-mono hidden sm:inline">{products.length} items</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowLogs((prev) => !prev); log("UI", showLogs ? "Logs closed" : "Logs opened"); }}
                className={`text-xs rounded-lg px-3 py-1.5 border transition-colors ${showLogs ? "bg-accent text-bg border-accent" : "text-muted border-border hover:text-fg hover:border-muted"}`}
              >
                Logs
              </button>
              <span className="text-muted text-xs hidden sm:inline">{user.email}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          <main className={`flex-1 min-w-0 transition-all duration-200 ${showLogs ? "lg:max-w-[calc(100%-280px)]" : ""}`}>
            <div className="px-4 sm:px-6 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fadeIn">
                {stats.map((s, i) => (
                  <div key={s.label} className={`bg-surface border border-border rounded-xl px-4 sm:px-5 py-4 animate-fadeInUp delay-${i + 1}`}>
                    <p className="text-muted text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 font-medium">{s.label}</p>
                    <p className={`text-xl sm:text-2xl font-semibold ${s.accent ? "text-accent" : s.danger ? "text-danger" : "text-fg"}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center animate-fadeInUp delay-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none">&#x1F50D;</span>
                  <input value={search} onChange={(e) => { setSearch(e.target.value); log("UI", `Search: "${e.target.value}"`); }} placeholder="Search products or category..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-fg text-sm outline-none focus:border-muted transition-colors" />
                </div>
                <div className="flex gap-1.5">
                  {([["all", "All"], ["low", "Low"], ["ok", "OK"]] as const).map(([v, l]) => (
                    <button key={v} onClick={() => { setFilter(v); log("UI", `Filter: ${l}`); }} className={`text-xs sm:text-sm rounded-lg px-3.5 py-2 border transition-colors ${filter === v ? "bg-accent text-bg border-accent font-medium" : "bg-transparent text-muted border-border hover:border-muted hover:text-subtle"}`}>{l}</button>
                  ))}
                </div>
                <button onClick={() => setShowForm((prev) => !prev)} className={`text-sm font-medium rounded-xl px-4 py-2.5 transition-colors whitespace-nowrap ${showForm ? "border border-border text-muted bg-surface" : "bg-accent hover:bg-accent-hover text-bg"}`}>
                  {showForm ? "Cancel" : "+ Add"}
                </button>
              </div>

              {showForm && (
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-6 animate-fadeIn">
                  <p className="text-muted text-[10px] font-mono mb-3">POST /api/products &rarr; supabase.from(&apos;products&apos;).insert(body)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {([["Name", "name", "text"], ["Price", "price", "number"], ["Qty", "quantity", "number"], ["Category", "category", "text"]] as const).map(([l, k, t]) => (
                      <div key={k}>
                        <label className="text-muted text-[10px] uppercase block mb-1.5 font-medium">{l}</label>
                        <input type={t} value={form[k]} onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))} className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-fg text-sm outline-none focus:border-muted transition-colors" />
                      </div>
                    ))}
                  </div>
                  <button onClick={add} disabled={adding} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg text-sm font-semibold rounded-lg px-4 py-2 transition-colors flex items-center gap-2">
                    {adding ? <><Spin s={11} /><span>Inserting...</span></> : "Save to Database"}
                  </button>
                </div>
              )}

              {(search || filter !== "all") && (
                <p className="text-muted text-xs mb-4 animate-fadeIn">
                  Showing {filtered.length} of {products.length} products
                  {search && <> matching &ldquo;<span className="text-subtle">{search}</span>&rdquo;</>}
                  {filter !== "all" && <> &mdash; <span className="text-subtle">{filter === "low" ? "Low Stock" : "In Stock"}</span></>}
                </p>
              )}

              {loading ? (
                <div className="text-center py-20 text-muted animate-fadeIn">
                  <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-mono">SELECT * FROM products...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl animate-fadeIn">
                  <p className="text-2xl mb-2 text-muted">&#x2205;</p>
                  <p className="text-sm text-muted mb-4">{products.length === 0 ? "No products yet." : "No products match your search."}</p>
                  {products.length === 0 && (
                    <button onClick={seedSamples} disabled={seeding} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors">
                      {seeding ? "Loading samples..." : "Load sample products"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="animate-fadeIn space-y-1.5">
                  {filtered.map((product, i) => (
                    <div
                      key={product.id}
                      className={`animate-slideInLeft flex items-center gap-3 sm:gap-4 bg-surface border border-border rounded-xl px-4 sm:px-5 py-3.5 hover:border-muted transition-all duration-200 hover:translate-x-0.5 ${deleting === product.id ? "opacity-40" : ""}`}
                      style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${product.quantity < 10 ? "bg-danger" : product.quantity < 25 ? "bg-warning" : "bg-accent"}`} />
                      <span className="text-muted text-[10px] font-mono w-8 flex-shrink-0">#{product.id}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-fg text-sm font-medium truncate">{product.name}</span>
                          {product.quantity < 10 && <span className="text-[10px] font-semibold text-danger bg-low-bg border border-low-border rounded px-1.5 py-0.5 flex-shrink-0">LOW</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                          <span>{product.category}</span>
                          <span>&middot;</span>
                          <span>{product.quantity} units</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-fg text-sm font-semibold">INR {Number(product.price).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => { setEditProduct(product); log("UI", `Edit modal opened for "${product.name}"`); }} className="border border-border text-muted hover:text-fg hover:border-muted rounded-lg px-3 py-1.5 text-xs transition-colors">
                          Edit
                        </button>
                        <button onClick={() => del(product.id)} disabled={deleting === product.id} className="border border-border text-muted hover:text-danger hover:border-danger rounded-lg px-3 py-1.5 text-xs transition-colors flex items-center gap-1">
                          {deleting === product.id ? <><Spin s={10} /><span>...</span></> : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {showLogs && (
            <div className="hidden lg:block w-[280px] border-l border-border animate-slideInRight">
              <LogPanel logs={logs} onClear={clearLogs} />
            </div>
          )}
        </div>
      </div>

      {editProduct && <EditModal product={editProduct} onSave={save} onClose={() => setEditProduct(null)} />}

      <button onClick={() => { setShowChat((prev) => !prev); log("UI", showChat ? "Chat closed" : "AI Agent opened"); }} className={`fixed bottom-5 right-5 w-11 h-11 rounded-full border text-xs font-semibold transition-all duration-200 z-50 flex items-center justify-center shadow-lg hover:scale-105 ${showChat ? "bg-surface border-border text-muted" : "bg-accent hover:bg-accent-hover border-accent text-bg shadow-accent/20"}`}>
        {showChat ? "\u00D7" : "AI"}
      </button>

      {showChat && <Chat products={products} onProductsChange={setProducts} log={log} onClose={() => setShowChat(false)} />}
    </div>
  );
}
