"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

const LOG_COLORS: Record<string, string> = {
  UI: "#7a9a7a",
  REACT: "#60a5fa",
  API: "#a78bfa",
  AUTH: "#fb923c",
  DB: "#f87171",
  LLM: "#c084fc",
  AGENT: "#fbbf24",
  REALTIME: "#10b981",
  WORKFLOW: "#22d3ee",
};

type LogPanelProps = {
  logs: LogEntry[];
  onClear: () => void;
};

export default function LogPanel({ logs, onClear }: LogPanelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: "#050a05" }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
        <span className="text-xs text-muted flex-1">console</span>
        <button onClick={onClear} className="text-[10px] text-muted hover:text-subtle border border-border rounded px-2 py-0.5 transition-colors">
          clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
        {logs.length === 0 && (
          <p className="text-muted text-[11px] text-center mt-5 leading-relaxed">
            interact with the app
            <br />
            to see the flow &rarr;
          </p>
        )}
        {logs.map((log) => (
          <div key={log.id}>
            <div className="text-[10px] font-bold mb-0.5" style={{ color: LOG_COLORS[log.layer] || "#64748b" }}>{log.layer}</div>
            <div className="text-[11px] pl-1 leading-relaxed" style={{ color: log.ok ? "#4ade80" : log.err ? "#f87171" : "#3a5a3a" }}>{log.msg}</div>
          </div>
        ))}
        <div ref={ref} />
      </div>
    </div>
  );
}
