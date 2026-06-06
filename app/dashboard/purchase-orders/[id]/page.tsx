"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Truck, Package, XCircle } from "lucide-react"
import { canEdit, canView } from "@/lib/permissions"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
      {status}
    </span>
  )
}

const NEXT_STATUS: Record<string, { label: string; status: string; icon: React.ReactNode }[]> = {
  PENDING: [
    { label: "Confirm Order", status: "CONFIRMED", icon: <Package className="size-4" /> },
    { label: "Cancel", status: "CANCELLED", icon: <XCircle className="size-4" /> },
  ],
  CONFIRMED: [
    { label: "Mark Shipped", status: "SHIPPED", icon: <Truck className="size-4" /> },
    { label: "Cancel", status: "CANCELLED", icon: <XCircle className="size-4" /> },
  ],
  SHIPPED: [
    { label: "Mark Delivered", status: "DELIVERED", icon: <Package className="size-4" /> },
  ],
}

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState("")
  const [updating, setUpdating] = useState(false)
  const [actionMsg, setActionMsg] = useState("")

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      if (!session?.user?.role || !canView(session.user.role)) {
        router.push("/dashboard")
        return
      }
      setUserRole(session.user.role)

      const res = await fetch(`/api/purchase-orders/${id}`)
      if (!res.ok) {
        setError("Purchase order not found")
        setLoading(false)
        return
      }
      setPo(await res.json())
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleStatusUpdate(newStatus: string) {
    setUpdating(true)
    setActionMsg("")
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        setActionMsg(err.error || "Failed to update")
        setUpdating(false)
        return
      }
      setPo(await res.json())
    } catch {
      setActionMsg("Network error")
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !po) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/dashboard/purchase-orders")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Purchase Orders
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error || "Purchase order not found"}</p>
        </div>
      </div>
    )
  }

  const q = po.quotation
  const canUpdate = canEdit(userRole)
  const nextActions = NEXT_STATUS[po.status] || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/purchase-orders" className="hover:text-foreground">Purchase Orders</Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">{po.poNumber}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{po.poNumber}</h1>
          <p className="text-muted-foreground">{q.vendor.companyName} — {q.rfq.title}</p>
        </div>
        <StatusBadge status={po.status} />
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionMsg}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{q.vendor.companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{q.vendor.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{q.vendor.phone}</span></div>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-bold text-lg">₹{Number(q.totalAmount).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Days</span><span className="font-medium">{q.deliveryDays}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(po.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RFQ</span><span className="font-medium">{q.rfq.title}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium text-right">Quantity</th>
              <th className="pb-2 font-medium text-right">Unit Price</th>
              <th className="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {po.items.map((item: any, i: number) => (
              <tr key={item.id}>
                <td className="py-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">₹{Number(item.unitPrice).toLocaleString()}</td>
                <td className="py-2 text-right tabular-nums font-medium">₹{Number(item.totalPrice).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-lg font-bold pt-2 border-t">
          Total: ₹{Number(q.totalAmount).toLocaleString()}
        </div>
      </div>

      {canUpdate && nextActions.length > 0 && (
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Update Status</h2>
          <div className="flex flex-wrap gap-3">
            {nextActions.map((action) => (
              <button
                key={action.status}
                onClick={() => handleStatusUpdate(action.status)}
                disabled={updating}
                className={`inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  action.status === "CANCELLED"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-accent text-bg hover:bg-accent-hover"
                }`}
              >
                {action.icon}
                {updating ? "Processing..." : action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
