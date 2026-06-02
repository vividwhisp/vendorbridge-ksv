"use client";

import { useCallback, useState } from "react";
import type { LogEntry, PageView, User } from "../types";
import Auth from "./auth";
import Dashboard from "./dashboard";
import Landing from "./landing";

export default function InventoryApp() {
  const [page, setPage] = useState<PageView>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log = useCallback((layer: string, msg: string, ok = false, err = false) => {
    setLogs((prev) => [...prev, { layer, msg, ok, err, id: Date.now() + Math.random() }]);
  }, []);

  if (page === "landing") return <Landing go={setPage} />;
  if (page === "login") return <Auth mode="login" go={setPage} onAuth={(nextUser) => { setUser(nextUser); setPage("dashboard"); }} log={log} />;
  if (page === "signup") return <Auth mode="signup" go={setPage} onAuth={(nextUser) => { setUser(nextUser); setPage("dashboard"); }} log={log} />;
  if (page === "dashboard" && user) return <Dashboard user={user} onLogout={() => { setUser(null); setPage("landing"); }} log={log} logs={logs} onClearLogs={() => setLogs([])} />;

  return null;
}
