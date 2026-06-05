"use client"

import { useState } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/sidebar"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

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
