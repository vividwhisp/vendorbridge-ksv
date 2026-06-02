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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-fg text-lg font-medium">Edit Product</h3>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg transition-colors">&times;</button>
        </div>
        <p className="text-muted text-[10px] font-mono mb-5">PUT /api/products/{product.id}</p>
        {[
          ["Product Name", "name", "text"],
          ["Price (INR)", "price", "number"],
          ["Quantity", "quantity", "number"],
          ["Category", "category", "text"],
        ].map(([label, key, type]) => (
          <div key={key} className="mb-4">
            <label className="text-muted text-xs block mb-1">{label}</label>
            <input
              type={type}
              value={form[key as keyof typeof form]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              className="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-muted transition-colors"
            />
          </div>
        ))}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-border text-muted hover:text-fg rounded-xl py-2.5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={busy} className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
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
