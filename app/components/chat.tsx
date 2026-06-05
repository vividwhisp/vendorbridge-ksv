"use client";

import { useEffect, useRef, useState } from "react";
import { apiUpdate, apiRemove, apiInsert, apiGetAll } from "../lib/api-helper";
import { appConfig, type TableConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import { canDelete, canEdit, type Role } from "../lib/rbac";
import { buildAgentPrompt } from "../lib/ai/prompts";
import type { AgentAction } from "../lib/ai";
import type { Row } from "../types";

type AgentResponse = {
  actions: AgentAction[];
  message: string;
};

type Message = { role: "ai" | "user"; text: string; actions?: AgentAction[] };

type ChatProps = {
  items: Row[];
  table: TableConfig;
  onItemsChange: (items: Row[]) => void;
  onClose: () => void;
  role?: Role;
};

const actionLabels: Record<string, string> = {
  update_stock: "Updated",
  delete_item: "Deleted",
  add_item: "Added",
  update_status: "Moved",
};

function buildAgentSystem(items: Row[], table: TableConfig) {
  return buildAgentPrompt({
    entityName: table.entity.name,
    plural: table.entity.plural,
    fields: table.fields,
    lowStockField: table.lowStockField,
    lowStockThreshold: table.lowStockThreshold,
    workflow: table.workflow,
    items,
  });
}

export default function Chat({ items, table, onItemsChange, onClose, role = "user" }: ChatProps) {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: "ai", text: appConfig.ai.welcome },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function executeActions(actions: AgentAction[]) {
    for (const act of actions) {
      if (!canEdit(role) && act.action !== "query") continue;
      if (!canDelete(role) && act.action === "delete_item") continue;
      if (act.action === "update_stock" && act.productId && typeof act.newQuantity === "number") {
        await apiUpdate(table.id, act.productId, { [table.lowStockField ?? "quantity"]: act.newQuantity });
      } else if (act.action === "delete_item" && act.productId) {
        await apiRemove(table.id, act.productId);
      } else if (act.action === "add_item" && act.name) {
        const insertable: Record<string, unknown> = {};
        for (const f of table.fields) {
          if (act[f.key] !== undefined) insertable[f.key] = act[f.key];
        }
        await apiInsert(table.id, insertable);
      } else if (act.action === "update_status" && act.productId && typeof act.newStatus === "string") {
        if (!hasWorkflow(table) || !table.workflow!.includes(act.newStatus)) continue;
        await apiUpdate(table.id, act.productId, { status: act.newStatus });
      }
    }
  }

  async function ask(text?: string) {
    const q = text || input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildAgentSystem(items, table),
          messages: [{ role: "user", content: q }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed");

      const raw = data?.message || "";
      let parsed: AgentResponse;
      try {
        parsed = JSON.parse(raw) as AgentResponse;
        if (!Array.isArray(parsed.actions)) throw new Error("missing actions array");
      } catch {
        parsed = { actions: [], message: raw };
      }

      if (parsed.actions.length > 0) {
        await executeActions(parsed.actions);
        const fresh = await apiGetAll(table.id);
        onItemsChange(fresh);
      }

      setMsgs((prev) => [...prev, { role: "ai", text: parsed.message || "Done!", actions: parsed.actions }]);
    } catch {
      setMsgs((prev) => [...prev, { role: "ai", text: "Error - try again." }]);
    }
    setBusy(false);
  }

  const tips = appConfig.ai.suggestions;

  return (
    <div className="fixed bottom-20 right-5 w-[calc(100vw-2.5rem)] sm:w-[330px] h-[460px] bg-surface border border-border rounded-xl flex flex-col z-50 shadow-2xl animate-fadeInUp">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <span className="text-fg text-sm font-medium">{appConfig.ai.name}</span>
          <span className="text-muted text-[10px] font-mono">openrouter</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-fg text-lg leading-none ml-1 transition-colors">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {msgs.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} animate-fadeIn`} style={{ animationDelay: `${index * 0.05}s` }}>
            {message.actions && message.actions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {message.actions.filter((a) => a.action !== "query").map((a, i) => (
                  <span key={i} className="text-[10px] font-semibold text-accent bg-ok-bg border border-ok-border rounded px-1.5 py-0.5">
                    {actionLabels[a.action] || a.action}
                  </span>
                ))}
              </div>
            )}
            <div className={`max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed ${message.role === "user" ? "bg-accent text-bg rounded-2xl rounded-br-sm" : "bg-bg border border-surface text-fg rounded-2xl rounded-bl-sm"
              }`}>
              {message.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <div className="bg-bg border border-surface rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
            <span className="text-muted text-[10px]">thinking...</span>
          </div>
        )}
        <div ref={ref} />
      </div>

      {msgs.length <= 2 && !busy && (
        <div className="px-3 pb-2 flex flex-col gap-1">
          {tips.map((tip, i) => (
            <div key={tip} onClick={() => ask(tip)} className="bg-bg border border-surface rounded-lg px-3 py-2 text-muted text-[11px] cursor-pointer leading-relaxed hover:border-muted transition-colors animate-fadeIn" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              {tip}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 px-3 py-2.5 border-t border-border">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask the AI agent..." className="flex-1 bg-bg border border-surface focus:border-muted rounded-lg px-3 py-1.5 text-fg text-xs outline-none transition-colors" />
        <button onClick={() => ask()} disabled={busy || !input.trim()} className="w-8 h-8 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-lg text-bg text-sm flex items-center justify-center flex-shrink-0 transition-colors">&uarr;</button>
      </div>
    </div>
  );
}
