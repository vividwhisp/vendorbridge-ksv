"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role } from "./rbac";
import { normalizeRole } from "./rbac";

type RoleContextValue = {
  role: Role;
  loading: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { role?: unknown } | null) => {
        if (cancelled) return;
        setRole(normalizeRole(data?.role));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleContext.Provider value={{ role, loading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useUserRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "user", loading: true };
  return ctx;
}
