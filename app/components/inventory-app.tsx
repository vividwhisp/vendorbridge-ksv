"use client";

import { useCallback, useState } from "react";
import type { LogEntry, PageView, User } from "../types";
import Auth from "./auth";
import Dashboard from "./dashboard";
import Landing from "./landing";
import LogPanel from "./log-panel";

export default function InventoryApp() {
  const [page, setPage] = useState<PageView>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = useCallback((layer: string, msg: string, ok = false, err = false) => {
    setLogs((prev) => [...prev, { layer, msg, ok, err, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", height: "100vh", background: "#0f172a", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ overflow: "auto", borderRight: "1px solid #0f172a", position: "relative" }}>
        {page === "landing" && <Landing go={setPage} />}
        {page === "login" && <Auth mode="login" go={setPage} onAuth={(nextUser) => { setUser(nextUser); setPage("dashboard"); }} log={log} />}
        {page === "signup" && <Auth mode="signup" go={setPage} onAuth={(nextUser) => { setUser(nextUser); setPage("dashboard"); }} log={log} />}
        {page === "dashboard" && user && <Dashboard user={user} onLogout={() => { setUser(null); setPage("landing"); }} log={log} />}
      </div>
      <div style={{ overflow: "hidden" }}>
        <LogPanel logs={logs} onClear={() => setLogs([])} />
      </div>
    </div>
  );
}
