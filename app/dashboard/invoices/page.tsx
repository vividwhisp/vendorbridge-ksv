"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Eye, Plus, X } from "lucide-react"
import { canView, canCreate } from "@/lib/permissions"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500 line-through",
  WRITTEN_OFF: "bg-yellow-100 text-yellow-800",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  )
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPo, setSelectedPo] = useState("")
  const [tax, setTax] = useState("0")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      if (!session?.user?.role || !canView(session.user.role)) {
        router.push("/dashboard")
        return
      }
      setUserRole(session.user.role)

      const [invRes, poRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/purchase-orders"),
      ])
      if (invRes.ok) setInvoices(await invRes.json())
      if (poRes.ok) setPurchaseOrders(await poRes.json())

      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreate() {
    if (!selectedPo) return
    setCreating(true)
    setCreateError("")
    try {
      const res = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: selectedPo, tax: Number(tax) || 0 }),
      })
      if (!res.ok) {
        const err = await res.json()
        setCreateError(err.error || "Failed to create")
        setCreating(false)
        return
      }
      const inv = await res.json()
      setShowCreate(false)
      setSelectedPo("")
      setTax("0")
      setInvoices((prev) => [inv, ...prev])
    } catch {
      setCreateError("Network error")
    }
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const canUserCreate = canCreate(userRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage invoices generated from purchase orders</p>
        </div>
        {canUserCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-accent text-bg px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus className="size-4" />
            Create Invoice
          </button>
        )}
      </div>

      {showCreate && (
        <div className="rounded-lg border p-6 space-y-4 relative">
          <button onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
          <h2 className="text-lg font-semibold">Generate Invoice from Purchase Order</h2>
          <div className="grid gap-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Purchase Order</label>
              <select
                value={selectedPo}
                onChange={(e) => setSelectedPo(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="">Select a PO...</option>
                {purchaseOrders
                  .filter((po) => po.status !== "DRAFT" && po.status !== "CANCELLED")
                  .map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.quotation?.vendor?.companyName || "Unknown"} (₹{Number(po.quotation?.totalAmount || 0).toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tax Amount (₹)</label>
              <input
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <button
              onClick={handleCreate}
              disabled={creating || !selectedPo}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent text-bg px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {creating ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "VENDOR"
              ? "Invoices generated from purchase orders will appear here."
              : "Create an invoice from a purchase order to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium">PO</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-right px-4 py-3 font-medium">Subtotal</th>
                <th className="text-right px-4 py-3 font-medium">Tax</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
                <th className="text-center px-4 py-3 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inv.purchaseOrder?.poNumber}</td>
                  <td className="px-4 py-3">{inv.purchaseOrder?.quotation?.vendor?.companyName || "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">₹{Number(inv.subtotal).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">₹{Number(inv.tax).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">₹{Number(inv.totalAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
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
