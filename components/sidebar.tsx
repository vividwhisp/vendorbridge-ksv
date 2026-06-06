"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, ClipboardList, CheckCircle, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/rfqs", label: "RFQs", icon: FileText },
  { href: "/dashboard/quotations", label: "Quotations", icon: ClipboardList },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fg">
          <span className="flex size-6 items-center justify-center rounded-md bg-accent text-bg text-xs font-bold">VB</span>
          Vendor Bridge
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-fg hover:bg-border/30"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-border/30 transition-colors"
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
