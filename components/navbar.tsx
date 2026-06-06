"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-bg/95 backdrop-blur px-4 lg:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface hover:text-fg transition-colors"
        aria-label="Open menu"
      >
        <span>☰</span>
      </button>

      <div className="flex-1">
        <h2 className="text-sm font-semibold text-fg">
          <Link href="/" className="lg:hidden font-bold">Vendor Bridge</Link>
          <span className="hidden lg:inline">Dashboard</span>
        </h2>
      </div>

      {user && (
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
          <span className="text-fg font-medium">{user.name || user.email}</span>
          <span className="text-xs border border-border rounded-full px-2 py-0.5">{user.role}</span>
        </div>
      )}

      <ThemeToggle />

      {user && (
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex h-8 items-center rounded-lg border border-border px-3 text-xs text-muted hover:bg-surface hover:text-fg transition-colors"
        >
          Logout
        </button>
      )}

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-60 bg-surface shadow-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-muted hover:text-fg hover:bg-border/30"
              aria-label="Close menu"
            >
              ✕
            </button>
            <Sidebar />
          </div>
        </div>
      )}
    </header>
  )
}
