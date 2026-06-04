"use client";

import { useState } from "react";
import type { Row } from "../types";
import type { TableConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import { useCan } from "./role";
import { WorkflowTimeline, StatusDropdown } from "./workflow";
import { FileUpload, ImagePreview } from "./upload";
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
  const [currentState, setCurrentState] = useState<string>(
    String(item.status ?? (hasWorkflow(table) ? table.workflow![0] : "")),
  );
  const useWorkflow = hasWorkflow(table);
  const canEdit = useCan("edit");

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = {};
    for (const f of table.fields) {
      const v = form[f.key];
      if (v === undefined || v === "") continue;
      payload[f.key] = f.type === "number" ? Number(v) : v;
    }
    if (useWorkflow && currentState) {
      payload.status = currentState;
    }
    await onSave(Number(item.id), payload);
    setBusy(false);
  }

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-fg text-lg font-medium">Edit {table.entity.name}</h3>
          <button onClick={onClose} className="text-muted hover:text-fg text-lg transition-colors">&times;</button>
        </div>
        <p className="text-muted text-[10px] font-mono mb-5">PUT /api/{table.id}/{String(item.id)}</p>
        {useWorkflow && (
          <div className="mb-5 p-3 bg-bg border border-border rounded-xl">
            <p className="text-muted text-[10px] uppercase tracking-wider font-medium mb-3">Workflow</p>
            <WorkflowTimeline state={currentState} table={table} />
            {canEdit && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-muted text-xs">Set state:</span>
                <StatusDropdown
                  item={{ ...item, status: currentState }}
                  table={table}
                  onUpdated={(next) => setCurrentState(String(next.status ?? ""))}
                />
              </div>
            )}
          </div>
        )}
        {table.fields.map((f) => (
          <div key={f.key} className="mb-4">
            <label className="text-muted text-xs block mb-1">
              {f.label}{f.required && <span className="text-danger ml-0.5">*</span>}
            </label>
            {f.type === "file" ? (
              <div className="flex flex-col gap-2">
                {form[f.key] && <ImagePreview url={form[f.key]} size="md" />}
                {canEdit && (
                  <FileUpload
                    value={form[f.key]}
                    onChange={(url) => setField(f.key, url ?? "")}
                    tableId={table.id}
                  />
                )}
              </div>
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
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-border text-muted hover:text-fg rounded-xl py-2.5 text-sm transition-colors">Cancel</button>
          <button onClick={save} disabled={busy || !canEdit} className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
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
