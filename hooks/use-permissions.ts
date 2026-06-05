"use client"

import { useSession } from "next-auth/react"
import {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  hasPermission,
  type Permission,
  type Role,
} from "@/lib/permissions"

const isRole = (r: unknown): r is Role =>
  typeof r === "string" && ["admin", "user"].includes(r)

export function usePermissions() {
  const { data: session } = useSession()
  const role: Role | null = isRole(session?.user?.role)
    ? (session.user.role as Role)
    : null

  return {
    role,
    canView: () => canView(role),
    canCreate: () => canCreate(role),
    canEdit: () => canEdit(role),
    canDelete: () => canDelete(role),
    canApprove: () => canApprove(role),
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    isAdmin: role === "admin",
  }
}
