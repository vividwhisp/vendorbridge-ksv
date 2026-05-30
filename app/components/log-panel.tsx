"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "../types";

const LOG_COLORS: Record<string, string> = {
  UI: "#4ade80",
  REACT: "#60a5fa",
  API: "#c084fc",
  AUTH: "#fb923c",
  DB: "#f87171",
  LLM: "#e879f9",
  AGENT: "#fbbf24",
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
    <div style={{ background: "#050a14", height: "100%", display: "flex", flexDirection: "column", fontFamily: "monospace" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #0f172a", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#ef4444", fontSize: 10 }}>o</span>
        <span style={{ color: "#eab308", fontSize: 10 }}>o</span>
        <span style={{ color: "#22c55e", fontSize: 10 }}>o</span>
        <span style={{ color: "#1e293b", fontSize: 10, flex: 1, marginLeft: 4 }}>console</span>
        <button onClick={onClear} style={{ fontSize: 9, color: "#334155", background: "none", border: "1px solid #1e293b", borderRadius: 3, padding: "2px 7px", cursor: "pointer" }}>
          clear
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
        {logs.length === 0 && (
          <p style={{ color: "#1e293b", fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.8 }}>
            interact with the app
            <br />
            to see the flow -&gt;
          </p>
        )}
        {logs.map((log) => (
          <div key={log.id}>
            <div style={{ color: LOG_COLORS[log.layer] || "#64748b", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{log.layer}</div>
            <div style={{ color: log.ok ? "#4ade80" : log.err ? "#f87171" : "#475569", fontSize: 11, paddingLeft: 4, lineHeight: 1.5 }}>{log.msg}</div>
          </div>
        ))}
        <div ref={ref} />
      </div>
    </div>
  );
}
