"use client";

import { useEffect, useRef, useState } from "react";
import { apiUpdate, apiRemove, apiInsert, apiGetAll } from "../lib/api-helper";
import { appConfig, type TableConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import { canDelete, canEdit, type Role } from "../lib/rbac";
import type { LogFn, Row } from "../types";

type SpeechRecognitionResultLike = { [index: number]: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type AgentAction = {
  action: "update_stock" | "delete_item" | "add_item" | "update_status" | "query";
  productId?: number; newQuantity?: number; newStatus?: string;
  [key: string]: unknown;
};

type AgentResponse = {
  actions: AgentAction[];
  message: string;
};

type Message = { role: "ai" | "user"; text: string; actions?: AgentAction[] };

type ChatProps = {
  items: Row[];
  table: TableConfig;
  onItemsChange: (items: Row[]) => void;
  log: LogFn;
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
  const fieldList = table.fields.map((f) => `${f.key}${f.required ? " (required)" : ""}`).join(", ");
  const entityName = table.entity.name;
  const plural = table.entity.plural;
  const lowField = table.lowStockField;
  const lowThreshold = table.lowStockThreshold;
  const workflow = table.workflow;

  return `You are an AI data management agent. You can answer questions AND take real actions on the database.

You manage ${plural}. Each ${entityName} has these fields: ${fieldList}.${lowField ? ` An ${entityName} is considered "low stock" when ${lowField} < ${lowThreshold}.` : ""}${workflow ? `

The ${entityName} lifecycle has these states: ${workflow.join(" → ")}. The first state is the default. Use the "update_status" action to move a ${entityName} through the lifecycle.` : ""}

Current records in the database:
${JSON.stringify(items, null, 2)}

CRITICAL: You must ALWAYS respond with valid JSON only in this exact format. No extra text, no markdown, no backticks.

{
  "actions": [
    { "action": "update_stock", "productId": <id>, "newQuantity": <number> },
    { "action": "delete_item", "productId": <id> },
    { "action": "add_item", "<field_key>": <value>, ... },
    { "action": "update_status", "productId": <id>, "newStatus": "<one of: ${workflow ? workflow.join(", ") : "n/a"}>" }
  ],
  "message": "<your short response to the user>"
}

RULES:
- The "actions" array can have MULTIPLE actions or be empty for queries.
- The "message" field is what you say to the user (keep it under 2 sentences).
- For "update_stock": "newQuantity" is the FINAL absolute quantity (not a delta).
- For "delete_item": only productId is needed.
- For "add_item": include the required fields and any sensible defaults.
- For "update_status": "newStatus" MUST be one of the workflow states listed above.
- For "query": return an empty actions array and put the answer in "message".
- Match ${entityName} names flexibly (case-insensitive, partial match).`;
}

export default function Chat({ items, table, onItemsChange, log, onClose, role = "user" }: ChatProps) {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: "ai", text: appConfig.ai.welcome },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    panelRef.current?.classList.remove("animate-fadeInUp");
    void panelRef.current?.offsetWidth;
    panelRef.current?.classList.add("animate-fadeInUp");
  }, []);

  function speak(text: string) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeak() { window.speechSynthesis?.cancel(); setSpeaking(false); }

  function startListen() {
    const W = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor; };
    const Recognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Recognition) { alert("Use Chrome or Edge for voice."); return; }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recRef.current = recognition;
    setListening(true);
    recognition.onresult = (event) => { setInput(Array.from(event.results).map((r) => r[0].transcript).join("")); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  function stopListen() { recRef.current?.stop(); setListening(false); }

  async function executeActions(actions: AgentAction[]) {
    for (const act of actions) {
      if (!canEdit(role) && act.action !== "query") {
        log("AGENT", `Skipped ${act.action}: role "${role}" lacks edit permission`);
        continue;
      }
      if (!canDelete(role) && act.action === "delete_item") {
        log("AGENT", `Skipped delete_item: role "${role}" lacks delete permission`);
        continue;
      }
      if (act.action === "update_stock" && act.productId && typeof act.newQuantity === "number") {
        log("AGENT", `UPDATE ${table.tableName ?? table.id} SET ${table.lowStockField ?? "quantity"}=${act.newQuantity} WHERE id=${act.productId}`);
        log("API", `PUT /api/${table.id}/${act.productId}`);
        await apiUpdate(table.id, act.productId, { [table.lowStockField ?? "quantity"]: act.newQuantity });
        log("API", `Updated: item ${act.productId} -> ${act.newQuantity}`, true);
      } else if (act.action === "delete_item" && act.productId) {
        log("AGENT", `DELETE FROM ${table.tableName ?? table.id} WHERE id=${act.productId}`);
        log("API", `DELETE /api/${table.id}/${act.productId}`);
        await apiRemove(table.id, act.productId);
        log("API", `Item ${act.productId} deleted`, true);
      } else if (act.action === "add_item" && act.name) {
        const insertable: Record<string, unknown> = {};
        for (const f of table.fields) {
          if (act[f.key] !== undefined) insertable[f.key] = act[f.key];
        }
        log("AGENT", `INSERT INTO ${table.tableName ?? table.id} (${Object.keys(insertable).join(", ")})`);
        log("API", `POST /api/${table.id}`);
        await apiInsert(table.id, insertable);
        log("API", `Item "${act.name}" added`, true);
      } else if (act.action === "update_status" && act.productId && typeof act.newStatus === "string") {
        if (!hasWorkflow(table) || !table.workflow!.includes(act.newStatus)) {
          log("AGENT", `Skipped update_status: "${act.newStatus}" is not a valid state`);
          continue;
        }
        log("AGENT", `UPDATE ${table.tableName ?? table.id} SET status='${act.newStatus}' WHERE id=${act.productId}`);
        log("API", `PUT /api/${table.id}/${act.productId}`);
        await apiUpdate(table.id, act.productId, { status: act.newStatus });
        log("API", `Item ${act.productId} -> status=${act.newStatus}`, true);
      }
    }
  }

  async function ask(text?: string) {
    const q = text || input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);

    log("LLM", `User: ${q}`);
    log("AGENT", "Analyzing intent...");
    log("API", `POST /api/chat -> ${items.length} items in context (table: ${table.id})`);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: buildAgentSystem(items, table), messages: [{ role: "user", content: q }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed");

      const raw = data?.message || "";
      log("LLM", `Raw response: ${raw.substring(0, 200)}`, true);

      let parsed: AgentResponse;
      try {
        parsed = JSON.parse(raw) as AgentResponse;
        if (!Array.isArray(parsed.actions)) throw new Error("missing actions array");
      } catch {
        parsed = { actions: [], message: raw };
      }

      log("LLM", `${parsed.actions.length} action(s) detected`, true);

      if (parsed.actions.length > 0) {
        await executeActions(parsed.actions);
        const fresh = await apiGetAll(table.id);
        onItemsChange(fresh);
      } else {
        log("AGENT", "Query only - no DB action needed");
      }

      const reply = parsed.message || "Done!";
      log("UI", "Rendering agent response", true);
      setMsgs((prev) => [...prev, { role: "ai", text: reply, actions: parsed.actions }]);
      speak(reply);
    } catch (error) {
      setMsgs((prev) => [...prev, { role: "ai", text: "Error - try again." }]);
      log("LLM", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, false, true);
    }
    setBusy(false);
  }

  const tips = appConfig.ai.suggestions;

  return (
    <div ref={panelRef} className="fixed bottom-20 right-5 w-[calc(100vw-2.5rem)] sm:w-[330px] h-[460px] bg-surface border border-border rounded-xl flex flex-col z-50 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${speaking ? "bg-accent shadow-[0_0_8px_var(--accent-glow)]" : "bg-muted"}`} />
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
        <button onClick={listening ? stopListen : startListen} className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] flex-shrink-0 transition-colors ${listening ? "bg-danger border-danger text-fg animate-pulse" : "bg-bg border-border text-muted hover:border-muted"}`}>
          {listening ? "stop" : "mic"}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={listening ? "Listening..." : "Type or speak a command..."} className={`flex-1 bg-bg border rounded-lg px-3 py-1.5 text-fg text-xs outline-none transition-colors ${listening ? "border-danger" : "border-surface focus:border-muted"}`} />
        {speaking && <button onClick={stopSpeak} className="w-8 h-8 rounded-lg bg-accent text-bg text-[10px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-accent-hover">mute</button>}
        <button onClick={() => ask()} disabled={busy || !input.trim()} className="w-8 h-8 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-lg text-bg text-sm flex items-center justify-center flex-shrink-0 transition-colors">&uarr;</button>
      </div>
    </div>
  );
}
