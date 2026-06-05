"use client"

import { useSession } from "next-auth/react"
import { hasPermission, type Permission } from "@/lib/permissions"

interface CanProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { data: session } = useSession()
  const role = session?.user?.role

  if (hasPermission(role, permission)) return <>{children}</>
  return <>{fallback}</>
}

interface CanAllProps {
  permissions: Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanAll({ permissions, children, fallback = null }: CanAllProps) {
  const { data: session } = useSession()
  const role = session?.user?.role

  const allowed = permissions.every((p) => hasPermission(role, p))
  if (allowed) return <>{children}</>
  return <>{fallback}</>
}

interface CanAnyProps {
  permissions: Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function CanAny({ permissions, children, fallback = null }: CanAnyProps) {
  const { data: session } = useSession()
  const role = session?.user?.role

  const allowed = permissions.some((p) => hasPermission(role, p))
  if (allowed) return <>{children}</>
  return <>{fallback}</>
}
