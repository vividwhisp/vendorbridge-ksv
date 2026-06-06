"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"
import { RoleBadge } from "@/components/role-badge"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const user = session?.user

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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
          <Link href="/" className="lg:hidden font-bold">DataHub</Link>
          <span className="hidden lg:inline">Dashboard</span>
        </h2>
      </div>

      <ThemeToggle />

      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-fg hover:bg-surface transition-colors"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-bg text-xs font-medium">
              {(user.name || user.email || "U")[0].toUpperCase()}
            </span>
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.name || user.email}
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-surface shadow-lg py-1 z-30">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-fg truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
              <div className="px-3 py-2 border-b border-border">
                <RoleBadge role={user.role} />
              </div>
              <Link
                href="/dashboard"
                onClick={() => setDropdownOpen(false)}
                className="block px-3 py-2 text-sm text-fg hover:bg-border/30 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  signOut({ callbackUrl: "/" })
                }}
                className="block w-full text-left px-3 py-2 text-sm text-danger hover:bg-border/30 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
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
