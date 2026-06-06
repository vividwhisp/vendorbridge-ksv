"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, Plus } from "lucide-react"
import { canView, canCreate } from "@/lib/permissions"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  )
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      if (!session?.user?.role || !canView(session.user.role)) {
        router.push("/dashboard")
        return
      }
      setUserRole(session.user.role)

      const res = await fetch("/api/purchase-orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders generated from approved quotations</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No purchase orders yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "VENDOR"
              ? "Purchase orders will appear here once they are created from your approved quotations."
              : "Create a purchase order from an approved quotation to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">PO Number</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">RFQ</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
                <th className="text-center px-4 py-3 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.quotation.vendor.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{po.quotation.rfq.title}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    ₹{Number(po.quotation.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={po.status} /></td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {new Date(po.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/purchase-orders/${po.id}`)}
                      className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
                    >
                      <Eye className="size-3.5 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
