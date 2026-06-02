"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/supabase-db";
import type { LogFn, Product, User } from "../types";
import Chat from "./chat";
import EditModal from "./edit-modal";
import Spin from "./spin";

type DashboardProps = {
  user: User;
  onLogout: () => void;
  log: LogFn;
};

const emptyForm = { name: "", price: "", quantity: "", category: "" };

export default function Dashboard({ user, onLogout, log }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    db.getAll()
      .then((data) => {
        if (!cancelled) {
          setProducts(data);
          setLoading(false);
          log("DB", `${data.length} products loaded from Supabase`, true);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load products.";
          log("DB", message, false, true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [log]);

  async function add() {
    if (!form.name || !form.price || !form.quantity) {
      return;
    }

    setAdding(true);
    log("API", "POST /api/products");
    log("DB", `supabase.from('products').insert({name:'${form.name}'})`);
    try {
      const row = await db.insert({
        name: form.name,
        price: Number(form.price),
        quantity: Number(form.quantity),
        category: form.category || "General",
      });
      log("DB", `Row inserted -> id:${row.id}`, true);
      setProducts((prev) => [...prev, row]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add product.";
      log("DB", message, false, true);
    } finally {
      setAdding(false);
    }
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
      const message = error instanceof Error ? error.message : "Could not update product.";
      log("DB", message, false, true);
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
      const message = error instanceof Error ? error.message : "Could not delete product.";
      log("DB", message, false, true);
    } finally {
      setDeleting(null);
    }
  }

  async function seedSamples() {
    setSeeding(true);
    log("DB", "Loading sample products for current Supabase user...");

    try {
      const rows = await db.seedStarterProducts();
      log("DB", `${rows.length} sample products inserted`, true);
      setProducts((prev) => [...prev, ...rows]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load sample products.";
      log("DB", message, false, true);
    } finally {
      setSeeding(false);
    }
  }

  async function logout() {
    log("AUTH", "supabase.auth.signOut()");
    await db.signOut();
    log("AUTH", "Session cleared", true);
    onLogout();
  }

  const totalVal = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
  const lowStock = products.filter((product) => product.quantity < 10);
  const inStock = products.filter((product) => product.quantity >= 10);
  const filtered = products.filter((product) => {
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase()) || product.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "low" && product.quantity < 10) || (filter === "ok" && product.quantity >= 10);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "#0f172a" }}>
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "11px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Inventory</span>
          <span style={{ color: "#1e293b", fontSize: 9, fontFamily: "monospace", marginLeft: 8 }}>app/dashboard/page.tsx</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: "#334155", fontSize: 11 }}>{user.email}</span>
          <button onClick={logout} style={{ background: "none", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: "20px", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Products", value: products.length, color: "#818cf8" },
            { label: "Total Value", value: `INR ${totalVal.toLocaleString()}`, color: "#4ade80" },
            { label: "Low Stock", value: lowStock.length, color: "#f87171" },
            { label: "In Stock", value: inStock.length, color: "#fb923c" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#1e293b", borderRadius: 10, padding: "14px 16px", border: "1px solid #334155" }}>
              <p style={{ color: "#475569", fontSize: 10, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</p>
              <p style={{ color: stat.color, fontSize: 20, fontWeight: 700, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: 14 }}>?</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                log("UI", `Search: "${event.target.value}"`);
              }}
              placeholder="Search products or category..."
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px 8px 32px", color: "white", fontSize: 12, boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              ["all", "All"],
              ["low", "Low"],
              ["ok", "OK"],
            ].map(([value, label]) => (
              <button key={value} onClick={() => { setFilter(value); log("UI", `Filter: ${label}`); }} style={{ background: filter === value ? "#6366f1" : "transparent", color: filter === value ? "white" : "#475569", border: "1px solid #334155", borderRadius: 6, padding: "7px 12px", fontSize: 11, cursor: "pointer", fontWeight: filter === value ? 600 : 400 }}>{label}</button>
            ))}
          </div>
          <button onClick={() => setShowForm((prev) => !prev)} style={{ background: showForm ? "transparent" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: showForm ? "1px solid #334155" : "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {showForm && (
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <p style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", marginBottom: 10 }}>POST /api/products -&gt; supabase.from(&apos;products&apos;).insert(body)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                ["Name", "name", "text"],
                ["Price", "price", "number"],
                ["Qty", "quantity", "number"],
                ["Category", "category", "text"],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ color: "#475569", fontSize: 9, display: "block", marginBottom: 4, textTransform: "uppercase" }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]} onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "7px 9px", color: "white", fontSize: 12, boxSizing: "border-box", outline: "none" }} />
                </div>
              ))}
            </div>
            <button onClick={add} disabled={adding} style={{ background: "#15803d", color: "white", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {adding ? (
                <>
                  <Spin s={11} />
                  <span>Inserting...</span>
                </>
              ) : "Save to Database"}
            </button>
          </div>
        )}

        {(search || filter !== "all") && (
          <p style={{ color: "#334155", fontSize: 11, marginBottom: 12 }}>
            Showing {filtered.length} of {products.length} products
            {search && <span> matching &quot;<span style={{ color: "#818cf8" }}>{search}</span>&quot;</span>}
            {filter !== "all" && <span> - filter: <span style={{ color: "#818cf8" }}>{filter === "low" ? "Low Stock" : "In Stock"}</span></span>}
          </p>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#334155" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #1e293b", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 11, fontFamily: "monospace" }}>SELECT * FROM products...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
            {filtered.map((product) => (
              <div key={product.id} style={{ background: "#1e293b", borderRadius: 12, padding: 16, border: `1px solid ${product.quantity < 10 ? "#7c2d12" : "#334155"}`, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ color: "#334155", fontSize: 9, fontFamily: "monospace" }}>id:{product.id}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {product.quantity < 10 && <span style={{ background: "#7c2d12", color: "#fb923c", fontSize: 8, borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>LOW</span>}
                    <span style={{ background: "#1e293b", color: "#475569", fontSize: 8, borderRadius: 3, padding: "1px 5px", border: "1px solid #334155" }}>{product.category}</span>
                  </div>
                </div>
                <p style={{ color: "white", fontSize: 13, fontWeight: 600, margin: "0 0 6px", flex: 1 }}>{product.name}</p>
                <p style={{ color: "#818cf8", fontSize: 17, fontWeight: 700, margin: "0 0 3px" }}>INR {Number(product.price).toLocaleString()}</p>
                <p style={{ color: "#475569", fontSize: 11, margin: "0 0 12px" }}>Stock: {product.quantity} units</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditProduct(product); log("UI", `Edit modal opened for "${product.name}"`); }} style={{ flex: 1, background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 6, padding: "5px 0", fontSize: 11, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => del(product.id)} disabled={deleting === product.id} style={{ flex: 1, background: "none", border: "1px solid #7f1d1d", color: "#f87171", borderRadius: 6, padding: "5px 0", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {deleting === product.id ? (
                      <>
                        <Spin s={10} />
                        <span>...</span>
                      </>
                    ) : "Delete"}
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#334155" }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>?</p>
                <p style={{ fontSize: 13, marginBottom: 12 }}>
                  {products.length === 0 ? "No products yet." : "No products match your search."}
                </p>
                {products.length === 0 && (
                  <button
                    onClick={seedSamples}
                    disabled={seeding}
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    {seeding ? "Loading samples..." : "Load sample products"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {editProduct && <EditModal product={editProduct} onSave={save} onClose={() => setEditProduct(null)} />}

      <button onClick={() => { setShowChat((prev) => !prev); log("UI", showChat ? "Chat closed" : "AI Agent opened"); }} style={{ position: "fixed", bottom: 20, right: 20, width: 50, height: 50, borderRadius: "50%", background: showChat ? "#334155" : "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", cursor: "pointer", fontSize: 13, color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}>
        {showChat ? "close" : "AI"}
      </button>

      {showChat && <Chat products={products} onProductsChange={setProducts} log={log} onClose={() => setShowChat(false)} />}
    </div>
  );
}
