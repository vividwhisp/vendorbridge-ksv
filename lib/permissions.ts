export const ROLES = ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = ["view", "create", "edit", "delete", "approve"] as const
export type Permission = (typeof PERMISSIONS)[number]

const PERMISSIONS_MAP: Record<Role, Permission[]> = {
  ADMIN: ["view", "create", "edit", "delete", "approve"],
  PROCUREMENT_OFFICER: ["view", "create", "edit"],
  MANAGER: ["view", "edit", "approve"],
  VENDOR: ["view"],
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  const perms = PERMISSIONS_MAP[role as Role]
  return perms?.includes(permission) ?? false
}

export function canView(role: string | null | undefined): boolean {
  return hasPermission(role, "view")
}
export function canCreate(role: string | null | undefined): boolean {
  return hasPermission(role, "create")
}
export function canEdit(role: string | null | undefined): boolean {
  return hasPermission(role, "edit")
}
export function canDelete(role: string | null | undefined): boolean {
  return hasPermission(role, "delete")
}
export function canApprove(role: string | null | undefined): boolean {
  return hasPermission(role, "approve")
}

// Domain-specific RBAC helpers
export function canCreateRFQ(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "PROCUREMENT_OFFICER"
}

export function canApproveQuotation(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER"
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === "ADMIN"
}

export function canSubmitQuotation(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "VENDOR"
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "ADMIN"
}
