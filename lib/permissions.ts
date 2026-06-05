export const ROLES = ["admin", "user"] as const
export type Role = (typeof ROLES)[number]

export const PERMISSIONS = ["view", "create", "edit", "delete", "approve"] as const
export type Permission = (typeof PERMISSIONS)[number]

const PERMISSIONS_MAP: Record<Role, Permission[]> = {
  admin: ["view", "create", "edit", "delete", "approve"],
  user: ["view", "create", "edit"],
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
