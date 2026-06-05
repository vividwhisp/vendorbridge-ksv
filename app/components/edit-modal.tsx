"use client";

import { useState } from "react";
import type { Row } from "../types";
import type { TableConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import { useCan } from "./role";
import { StatusDropdown } from "./workflow";
import { FileUpload } from "./upload";
import { useToast } from "../lib/toast-context";
import Spin from "./spin";

type EditModalProps = {
  item: Row;
  table: TableConfig;
  onSave: (id: number, data: Row) => Promise<void> | void;
  onClose: () => void;
};

export default function EditModal({ item, table, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of table.fields) {
      const v = item[f.key];
      initial[f.key] = v === undefined || v === null ? "" : String(v);
    }
    if (hasWorkflow(table)) {
      const fallback = table.workflow![0];
      initial.status = String(item.status ?? fallback);
    }
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const useWorkflow = hasWorkflow(table);
  const canEdit = useCan("edit");
  const { showToast } = useToast();

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (uploading) return;
    setBusy(true);
    const payload: Record<string, unknown> = {};
    for (const f of table.fields) {
      const v = form[f.key];
      if (v === undefined || v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : v;
    }
    if (useWorkflow && form.status) {
      payload.status = form.status;
    }
    try {
      await onSave(Number(item.id), payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showToast(`Update failed: ${message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="text-fg text-lg font-medium">Edit {table.entity.name}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-fg text-lg transition-colors"
          >
            &times;
          </button>
        </div>
        <p className="text-muted text-[10px] font-mono px-6 pb-4">
          PUT /api/{table.id}/{String(item.id)}
        </p>
        <div className="px-6 overflow-y-auto flex-1">
          {table.fields.map((f) => (
            <div key={f.key} className="mb-4">
              <label className="text-muted text-xs block mb-1">
                {f.label}
                {f.required && <span className="text-danger ml-0.5">*</span>}
              </label>
              {f.type === "file" ? (
                canEdit ? (
                  <FileUpload
                    value={form[f.key]}
                    onChange={(url) => {
                      setField(f.key, url ?? "");
                      setUploading(false);
                    }}
                    onUploadingChange={setUploading}
                    tableId={table.id}
                  />
                ) : form[f.key] ? (
                  <a
                    href={form[f.key]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent text-xs hover:underline break-all"
                  >
                    {form[f.key].split("/").pop()}
                  </a>
                ) : null
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={form[f.key] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(event) => setField(f.key, event.target.value)}
                  readOnly={!canEdit}
                  className="w-full bg-bg border border-border rounded-xl px-3.5 py-2.5 text-fg text-sm outline-none focus:border-muted transition-colors readOnly:opacity-70"
                />
              )}
            </div>
          ))}
          {useWorkflow && canEdit && (
            <div className="mb-4 p-3 bg-bg border border-border rounded-xl">
              <p className="text-muted text-[10px] uppercase tracking-wider font-medium mb-2">Status</p>
              <StatusDropdown
                item={item}
                table={table}
                onUpdated={(next) => setField("status", String(next.status ?? ""))}
              />
            </div>
          )}
        </div>
        <div className="p-6 pt-4 flex gap-3 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-border text-muted hover:text-fg rounded-xl py-2.5 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || !canEdit || uploading}
            className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {busy ? (
              <>
                <Spin s={11} />
                <span>Saving...</span>
              </>
            ) : uploading ? (
              <>
                <Spin s={11} />
                <span>Wait for upload...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
