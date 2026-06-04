"use client";

import type { ReactNode } from "react";
import { useUserRole } from "../../lib/role-context";
import { can, type Action, type Role } from "../../lib/rbac";

type CanProps = {
  action: Action;
  role?: Role;
  fallback?: ReactNode;
  children: ReactNode;
};

export function Can({ action, role, fallback = null, children }: CanProps) {
  const { role: ctxRole } = useUserRole();
  const effective = role ?? ctxRole;
  return can(effective, action) ? <>{children}</> : <>{fallback}</>;
}

export function useCan(action: Action): boolean {
  const { role } = useUserRole();
  return can(role, action);
}
