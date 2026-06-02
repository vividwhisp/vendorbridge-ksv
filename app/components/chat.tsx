"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "../lib/supabase-db";
import type { LogFn, Product } from "../types";

type SpeechRecognitionResultLike = {
  [index: number]: { transcript: string };
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type AgentResponse = {
  action?: "update_stock" | "delete_product" | "add_product" | "query";
  productId?: number;
  newQuantity?: number;
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  message?: string;
};

type Message = {
  role: "ai" | "user";
  text: string;
  action?: Exclude<AgentResponse["action"], "query"> | null;
};

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
    { role: "ai", text: "Hey! I am your inventory agent. I can answer questions and take actions. Try add 20 units to iPhone or show low stock." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function speak(text: string) {
    if (!window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeak() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function startListen() {
    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!Recognition) {
      alert("Use Chrome or Edge for voice.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recRef.current = recognition;
    setListening(true);
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join("");
      setInput(text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  function stopListen() {
    recRef.current?.stop();
    setListening(false);
  }

  function switchLang(nextLang: string) {
    setLang(nextLang);
    stopSpeak();
    setMsgs([
      {
        role: "ai",
        text: nextLang === "hi"
          ? "Namaste! Main aapka inventory agent hoon. Aap stock query ya update command de sakte hain."
          : "Hey! I am your inventory agent. I can answer questions and take actions. Try add 20 units to iPhone or show low stock.",
      },
    ]);
  }

  async function ask(text?: string) {
    const q = text || input.trim();

    if (!q || busy) {
      return;
    }

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
        body: JSON.stringify({
          system: buildAgentSystem(products, lang),
          messages: [{ role: "user", content: q }],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }

      const raw = data?.message || "{}";

      let parsed: AgentResponse;
      try {
        parsed = JSON.parse(raw) as AgentResponse;
      } catch {
        parsed = { action: "query", message: raw };
      }

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
      const message = error instanceof Error ? error.message : "Unknown error";
      setMsgs((prev) => [...prev, { role: "ai", text: "Error - try again." }]);
      log("LLM", `Error: ${message}`, false, true);
    }

    setBusy(false);
  }

  const tips = lang === "hi"
    ? ["iPhone mein 20 units add karo", "Low stock products dikhao", "Total inventory value kya hai?", "Magic Keyboard delete karo"]
    : ["Add 20 units to iPhone", "Which products are low on stock?", "What is my total inventory value?", "Delete Magic Keyboard"];

  return (
    <div style={{ position: "fixed", bottom: 72, right: 20, width: 330, height: 460, background: "#1e293b", border: "1px solid #334155", borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 200 }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: speaking ? "#4ade80" : "#6366f1", boxShadow: speaking ? "0 0 8px #4ade80" : "none", transition: "all 0.3s" }} />
          <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>AI Agent</span>
          <span style={{ color: "#334155", fontSize: 9, fontFamily: "monospace" }}>openrouter</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["en", "hi"].map((item) => (
            <button key={item} onClick={() => switchLang(item)} style={{ background: lang === item ? "#6366f1" : "transparent", color: lang === item ? "white" : "#475569", border: "1px solid #334155", borderRadius: 4, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>
              {item === "hi" ? "HI" : "EN"}
            </button>
          ))}
          <span onClick={onClose} style={{ color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1, marginLeft: 2 }}>x</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((message, index) => (
          <div key={`${message.role}-${index}`} style={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start", flexDirection: "column", alignItems: message.role === "user" ? "flex-end" : "flex-start" }}>
            {message.action && <span style={{ background: "#1e3a1e", color: "#4ade80", fontSize: 9, borderRadius: 4, padding: "2px 7px", marginBottom: 4, fontWeight: 700 }}>{actionBadge[message.action] || message.action}</span>}
            <div style={{ maxWidth: "86%", background: message.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#0f172a", border: message.role === "ai" ? "1px solid #1e293b" : "none", borderRadius: message.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", padding: "9px 12px", color: "white", fontSize: 12, lineHeight: 1.6 }}>
              {message.text}
            </div>
          </div>
        ))}
        {busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px 12px 12px 3px", padding: "10px 14px", display: "flex", gap: 4 }}>
              {[0, 1, 2].map((item) => <div key={item} style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", animation: `bounce 1s ${item * 0.2}s infinite` }} />)}
            </div>
            <span style={{ color: "#334155", fontSize: 10 }}>thinking...</span>
          </div>
        )}
        <div ref={ref} />
      </div>

      {msgs.length <= 2 && !busy && (
        <div style={{ padding: "0 10px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
          {tips.map((tip) => (
            <div key={tip} onClick={() => ask(tip)} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 7, padding: "7px 10px", color: "#475569", fontSize: 11, cursor: "pointer", lineHeight: 1.4 }}>{tip}</div>
          ))}
        </div>
      )}

      <div style={{ padding: "8px 10px", borderTop: "1px solid #334155", display: "flex", gap: 6, alignItems: "center" }}>
        <button onClick={listening ? stopListen : startListen} style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid #334155", background: listening ? "#dc2626" : "#0f172a", color: listening ? "white" : "#64748b", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: listening ? "pulse 1s infinite" : "none" }}>
          {listening ? "stop" : "mic"}
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && ask()}
          placeholder={listening ? (lang === "hi" ? "Boliye..." : "Listening...") : (lang === "hi" ? "Command dijiye..." : "Type or speak a command...")}
          style={{ flex: 1, background: "#0f172a", border: `1px solid ${listening ? "#dc2626" : "#1e293b"}`, borderRadius: 7, padding: "7px 10px", color: "white", fontSize: 12, outline: "none" }}
        />
        {speaking && <button onClick={stopSpeak} style={{ width: 32, height: 32, borderRadius: 7, border: "none", background: "#6366f1", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>mute</button>}
        <button onClick={() => ask()} disabled={busy || !input.trim()} style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", opacity: busy || !input.trim() ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ^
        </button>
      </div>
    </div>
  );
}
