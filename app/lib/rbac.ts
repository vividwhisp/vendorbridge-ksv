export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "user";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  user: "User",
};

export type Action = "view" | "edit" | "delete" | "manage";

const PERMISSIONS: Record<Role, Record<Action, boolean>> = {
  admin: { view: true, edit: true, delete: true, manage: true },
  user:  { view: true, edit: true, delete: false, manage: false },
};

export function canView(role: Role | undefined | null): boolean {
  if (!role) return false;
  return PERMISSIONS[role].view;
}

export function canEdit(role: Role | undefined | null): boolean {
  if (!role) return false;
  return PERMISSIONS[role].edit;
}

export function canDelete(role: Role | undefined | null): boolean {
  if (!role) return false;
  return PERMISSIONS[role].delete;
}

export function canManage(role: Role | undefined | null): boolean {
  if (!role) return false;
  return PERMISSIONS[role].manage;
}

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role][action];
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(value: unknown): Role {
  return isRole(value) ? value : DEFAULT_ROLE;
}

export const ROLE_HEADER = "x-user-role";
