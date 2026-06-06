"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, ClipboardList, CheckCircle, ShoppingCart, Receipt, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/rfqs", label: "RFQs", icon: FileText },
  { href: "/dashboard/quotations", label: "Quotations", icon: ClipboardList },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckCircle },
  { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  function handleNav() {
    onClose?.()
  }

  return (
    <aside className="flex h-full flex-col border-r border-border bg-surface animate-fade-in">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" onClick={handleNav} className="flex items-center gap-2 font-semibold text-fg hover:text-accent transition-colors duration-300">
          <span className="flex size-6 items-center justify-center rounded-md bg-accent text-bg text-xs font-bold">VB</span>
          Vendor Bridge
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNav}
              style={{ animationDelay: `${index * 0.05}s` }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 origin-left ${
                isActive
                  ? "bg-accent/10 text-accent shadow-sm"
                  : "text-muted hover:text-fg hover:bg-border/30"
              }`}
            >
              <Icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <Link
          href="/dashboard/settings"
          onClick={handleNav}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-fg hover:bg-border/30 transition-all duration-300 hover:scale-105 origin-left"
        >
          <Settings className="size-4 transition-transform duration-300 group-hover:rotate-90" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
