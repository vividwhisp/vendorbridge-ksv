"use client";

import { useState } from "react";
import type { Product } from "../types";
import Spin from "./spin";

type EditModalProps = {
  product: Product;
  onSave: (id: number, data: Partial<Omit<Product, "id">>) => Promise<void> | void;
  onClose: () => void;
};

export default function EditModal({ product, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    quantity: String(product.quantity),
    category: product.category,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(product.id, { ...form, price: Number(form.price), quantity: Number(form.quantity) });
    setBusy(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: 24, width: 340 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ color: "white", fontSize: 16, fontWeight: 700 }}>Edit Product</h3>
          <span onClick={onClose} style={{ color: "#64748b", cursor: "pointer", fontSize: 20 }}>x</span>
        </div>
        <p style={{ color: "#334155", fontSize: 9, fontFamily: "monospace", marginBottom: 14 }}>PUT /api/products/{product.id} -&gt; supabase.from(&apos;products&apos;).update(data)</p>
        {[
          ["Product Name", "name", "text"],
          ["Price (INR)", "price", "number"],
          ["Quantity", "quantity", "number"],
          ["Category", "category", "text"],
        ].map(([label, key, type]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ color: "#475569", fontSize: 11, display: "block", marginBottom: 4 }}>{label.toUpperCase()}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, padding: "8px 10px", color: "white", fontSize: 13, boxSizing: "border-box", outline: "none" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid #334155", color: "#64748b", borderRadius: 8, padding: "9px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={busy} style={{ flex: 1, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 8, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {busy ? (
              <>
                <Spin s={11} />
                <span>Saving...</span>
              </>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
