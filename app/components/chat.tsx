"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "../lib/supabase-db";
import type { LogFn, Product } from "../types";

type SpeechRecognitionResultLike = { [index: number]: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type AgentResponse = {
  action?: "update_stock" | "delete_product" | "add_product" | "query";
  productId?: number; newQuantity?: number; name?: string;
  price?: number; quantity?: number; category?: string; message?: string;
};

type Message = { role: "ai" | "user"; text: string; action?: Exclude<AgentResponse["action"], "query"> | null };

type ChatProps = {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  log: LogFn;
  onClose: () => void;
};

const actionBadge: Record<string, string> = {
  update_stock: "Stock Updated",
  delete_product: "Product Deleted",
  add_product: "Product Added",
};

function buildAgentSystem(products: Product[], lang: string) {
  return `You are an AI inventory management agent. You can answer questions AND take real actions on the database.

Current products in database:
${JSON.stringify(products, null, 2)}

You must ALWAYS respond with valid JSON only. No extra text, no markdown, no backticks.

For actions, respond with:
{ "action": "update_stock", "productId": <id>, "newQuantity": <number>, "message": "<confirmation in ${lang === "hi" ? "Hindi" : "English"}>" }
{ "action": "delete_product", "productId": <id>, "message": "<confirmation>" }
{ "action": "add_product", "name": "<name>", "price": <number>, "quantity": <number>, "category": "<category>", "message": "<confirmation>" }
{ "action": "query", "message": "<answer to question in ${lang === "hi" ? "Hindi" : "English"}>" }

Match product names flexibly. For update_stock, calculate the new quantity if user says add or remove.
${lang === "hi" ? "Respond entirely in Hindi. Message field must be in Hindi." : "Respond in English."}`;
}

export default function Chat({ products, onProductsChange, log, onClose }: ChatProps) {
  const [lang, setLang] = useState("en");
  const [msgs, setMsgs] = useState<Message[]>([
    { role: "ai", text: "Hey! I am your inventory agent. I can answer questions and take actions. Try \"add 20 units to iPhone\" or \"show low stock\"." },
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
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
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
    recognition.lang = lang === "hi" ? "hi-IN" : "en-US";
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

  function switchLang(nextLang: string) {
    setLang(nextLang);
    stopSpeak();
    setMsgs([{
      role: "ai",
      text: nextLang === "hi" ? "Namaste! Main aapka inventory agent hoon. Aap stock query ya update command de sakte hain." : "Hey! I am your inventory agent. I can answer questions and take actions. Try \"add 20 units to iPhone\" or \"show low stock\".",
    }]);
  }

  async function ask(text?: string) {
    const q = text || input.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((prev) => [...prev, { role: "user", text: q }]);
    setBusy(true);

    log("LLM", `User: ${q}`);
    log("AGENT", `Analyzing intent... (lang: ${lang === "hi" ? "Hindi" : "English"})`);
    log("API", `POST /api/chat -> building agent prompt with ${products.length} products`);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: buildAgentSystem(products, lang), messages: [{ role: "user", content: q }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed");

      const raw = data?.message || "{}";
      let parsed: AgentResponse;
      try { parsed = JSON.parse(raw) as AgentResponse; } catch { parsed = { action: "query", message: raw }; }

      log("LLM", `Intent: ${parsed.action ?? "query"}`, true);

      if (parsed.action === "update_stock" && parsed.productId && typeof parsed.newQuantity === "number") {
        log("AGENT", `UPDATE products SET quantity=${parsed.newQuantity} WHERE id=${parsed.productId}`);
        log("DB", `supabase.from('products').update({ quantity }).eq('id', ${parsed.productId})`);
        await db.update(parsed.productId, { quantity: parsed.newQuantity });
        onProductsChange(await db.getAll());
        log("DB", "Stock updated", true);
      } else if (parsed.action === "delete_product" && parsed.productId) {
        log("AGENT", `DELETE FROM products WHERE id=${parsed.productId}`);
        log("DB", `supabase.from('products').delete().eq('id', ${parsed.productId})`);
        await db.remove(parsed.productId);
        onProductsChange(await db.getAll());
        log("DB", "Product deleted", true);
      } else if (parsed.action === "add_product" && parsed.name) {
        log("AGENT", `INSERT INTO products (name,price,quantity) VALUES ('${parsed.name}',${parsed.price ?? 0},${parsed.quantity ?? 0})`);
        log("DB", "supabase.from('products').insert({...})");
        await db.insert({ name: parsed.name, price: parsed.price ?? 0, quantity: parsed.quantity ?? 0, category: parsed.category || "General" });
        onProductsChange(await db.getAll());
        log("DB", "Product added", true);
      } else {
        log("AGENT", "Query only - no DB action needed");
      }

      const reply = parsed.message || "Done!";
      log("UI", "Rendering agent response and speaking", true);
      setMsgs((prev) => [...prev, { role: "ai", text: reply, action: parsed.action !== "query" ? parsed.action : null }]);
      speak(reply);
    } catch (error) {
      setMsgs((prev) => [...prev, { role: "ai", text: "Error - try again." }]);
      log("LLM", `Error: ${error instanceof Error ? error.message : "Unknown error"}`, false, true);
    }
    setBusy(false);
  }

  const tips = lang === "hi"
    ? ["iPhone mein 20 units add karo", "Low stock products dikhao", "Total inventory value kya hai?", "Magic Keyboard delete karo"]
    : ["Add 20 units to iPhone", "Which products are low on stock?", "What is my total inventory value?", "Delete Magic Keyboard"];

  return (
    <div ref={panelRef} className="fixed bottom-20 right-5 w-[calc(100vw-2.5rem)] sm:w-[330px] h-[460px] bg-surface border border-border rounded-xl flex flex-col z-50 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${speaking ? "bg-accent shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted"}`} />
          <span className="text-fg text-sm font-medium">AI Agent</span>
          <span className="text-muted text-[10px] font-mono">openrouter</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["en", "hi"] as const).map((item) => (
            <button key={item} onClick={() => switchLang(item)} className={`text-[10px] rounded px-1.5 py-0.5 border transition-colors ${lang === item ? "bg-accent text-bg border-accent font-medium" : "bg-transparent text-muted border-border hover:border-muted"}`}>
              {item.toUpperCase()}
            </button>
          ))}
          <button onClick={onClose} className="text-muted hover:text-fg text-lg leading-none ml-1 transition-colors">&times;</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
        {msgs.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"} animate-fadeIn`} style={{ animationDelay: `${index * 0.05}s` }}>
            {message.action && (
              <span className="text-[10px] font-semibold text-accent bg-ok-bg border border-ok-border rounded px-1.5 py-0.5 mb-1">
                {actionBadge[message.action] || message.action}
              </span>
            )}
            <div className={`max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed ${
              message.role === "user" ? "bg-accent text-bg rounded-2xl rounded-br-sm" : "bg-bg border border-surface text-fg rounded-2xl rounded-bl-sm"
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
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={listening ? (lang === "hi" ? "Boliye..." : "Listening...") : (lang === "hi" ? "Command dijiye..." : "Type or speak a command...")} className={`flex-1 bg-bg border rounded-lg px-3 py-1.5 text-fg text-xs outline-none transition-colors ${listening ? "border-danger" : "border-surface focus:border-muted"}`} />
        {speaking && <button onClick={stopSpeak} className="w-8 h-8 rounded-lg bg-accent text-bg text-[10px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-accent-hover">mute</button>}
        <button onClick={() => ask()} disabled={busy || !input.trim()} className="w-8 h-8 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-lg text-bg text-sm flex items-center justify-center flex-shrink-0 transition-colors">&uarr;</button>
      </div>
    </div>
  );
}
