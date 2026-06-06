"use client"

import { useSession } from "next-auth/react"
import {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
  canCreateRFQ,
  canApproveQuotation,
  canManageUsers,
  canSubmitQuotation,
  hasPermission,
  type Permission,
  type Role,
} from "@/lib/permissions"

const isRole = (r: unknown): r is Role =>
  typeof r === "string" && ["ADMIN", "PROCUREMENT_OFFICER", "MANAGER", "VENDOR"].includes(r)

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
    canCreateRFQ: () => canCreateRFQ(role),
    canApproveQuotation: () => canApproveQuotation(role),
    canManageUsers: () => canManageUsers(role),
    canSubmitQuotation: () => canSubmitQuotation(role),
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    isAdmin: role === "ADMIN",
  }
}
