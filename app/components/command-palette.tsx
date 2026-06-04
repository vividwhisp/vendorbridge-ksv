"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Row } from "../types";
import { appConfig, type TableConfig } from "../lib/config";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
};

type Props = {
  items: Row[];
  table: TableConfig;
  onAdd?: () => void;
  onAI?: () => void;
};

export default function CommandPalette({ items, table, onAdd, onAI }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setActiveIndex(0);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const allCommands: CommandItem[] = [
    ...(onAdd ? [{ id: "add", label: `Add new ${table.entity.name}`, hint: "A", action: () => { onAdd(); setOpen(false); } }] : []),
    ...(onAI ? [{ id: "ai", label: `Open ${appConfig.ai.name}`, hint: "AI", action: () => { onAI(); setOpen(false); } }] : []),
    { id: "nav-home", label: "Go to home", action: () => { router.push("/"); setOpen(false); } },
    { id: "nav-settings", label: "Go to settings", action: () => { router.push("/settings"); setOpen(false); } },
    { id: "nav-profile", label: "Go to profile", action: () => { router.push("/profile"); setOpen(false); } },
    ...items.slice(0, 20).map((it) => ({
      id: `item-${it.id}`,
      label: String(it.name ?? `#${it.id}`),
      hint: `#${it.id}`,
      action: () => { setOpen(false); },
    })),
  ];

  const filtered = query.trim()
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  function run() {
    const cmd = filtered[activeIndex];
    if (cmd) cmd.action();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh] px-4 animate-fadeIn" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
              if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
              if (e.key === "Enter")     { e.preventDefault(); run(); }
            }}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-fg text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-muted text-sm">No results</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={run}
              className={`w-full text-left text-sm px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${
                i === activeIndex ? "bg-accent/10 text-fg" : "text-muted"
              }`}
            >
              <span>{cmd.label}</span>
              {cmd.hint && <span className="text-[10px] text-muted font-mono">{cmd.hint}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[10px] text-muted">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span className="font-mono">⌘K</span>
        </div>
      </div>
    </div>
  );
}
