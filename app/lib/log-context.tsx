"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import type { LogEntry, LogFn } from "../types";

type LogContextType = {
  logs: LogEntry[];
  log: LogFn;
  clearLogs: () => void;
};

const LogContext = createContext<LogContextType | null>(null);

export function LogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const log: LogFn = useCallback((layer, msg, ok = false, err = false) => {
    setLogs((prev) => [...prev, { layer, msg, ok, err, id: Date.now() + Math.random() }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <LogContext.Provider value={{ logs, log, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog must be used within LogProvider");
  return ctx;
}
