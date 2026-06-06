"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import { canApproveQuotation, canView } from "@/lib/permissions"

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  }
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="size-4" />,
    APPROVED: <CheckCircle className="size-4" />,
    REJECTED: <XCircle className="size-4" />,
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
      {icons[status]}
      {status}
    </span>
  )
}

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [approval, setApproval] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState("")
  const [remarks, setRemarks] = useState("")
  const [submitting, setSubmitting] = useState(false)
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

      const res = await fetch(`/api/approvals/${id}`)
      if (!res.ok) {
        setError("Approval not found")
        setLoading(false)
        return
      }
      const data = await res.json()
      setApproval(data)
      setRemarks(data.remarks || "")
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleApprove() {
    setSubmitting(true)
    setActionMsg("")
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      })
      if (!res.ok) {
        const err = await res.json()
        setActionMsg(err.error || "Failed to approve")
        setSubmitting(false)
        return
      }
      const updated = await res.json()
      setApproval(updated)
    } catch {
      setActionMsg("Network error")
    }
    setSubmitting(false)
  }

  async function handleReject() {
    if (!remarks.trim()) {
      setActionMsg("Please provide a reason for rejection")
      return
    }
    setSubmitting(true)
    setActionMsg("")
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      })
      if (!res.ok) {
        const err = await res.json()
        setActionMsg(err.error || "Failed to reject")
        setSubmitting(false)
        return
      }
      const updated = await res.json()
      setApproval(updated)
    } catch {
      setActionMsg("Network error")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !approval) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/dashboard/approvals")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Approvals
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error || "Approval not found"}</p>
        </div>
      </div>
    )
  }

  const q = approval.quotation
  const canAct = canApproveQuotation(userRole) && approval.status === "PENDING"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/approvals" className="hover:text-foreground">Approvals</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{q.vendor.companyName} — {q.rfq.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{q.rfq.title}</h1>
          <p className="text-muted-foreground">Quotation from {q.vendor.companyName}</p>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      {actionMsg && (
        <div className={`rounded-lg border p-4 text-sm ${actionMsg.includes("Error") || actionMsg.includes("error") || actionMsg.includes("reason") ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
          {actionMsg}
        </div>
      )}

      {/* Quotation Info */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quotation Information</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">Total Amount</span>
            <p className="text-lg font-bold mt-0.5">₹{Number(q.totalAmount).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Delivery Days</span>
            <p className="text-lg font-bold mt-0.5">{q.deliveryDays}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Submitted</span>
            <p className="text-lg font-bold mt-0.5">{new Date(q.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {q.remarks && (
          <div>
            <span className="text-xs text-muted-foreground">Quotation Remarks</span>
            <p className="text-sm mt-1 bg-muted/30 rounded p-2">{q.remarks}</p>
          </div>
        )}

        {/* Items table */}
        <div>
          <span className="text-xs text-muted-foreground block mb-2">Line Items</span>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Unit Price</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {q.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium">{item.productName}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right tabular-nums">₹{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums font-medium">₹{Number(item.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{q.vendor.companyName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{q.vendor.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{q.vendor.phone}</span></div>
        </div>
      </div>

      {/* RFQ Info */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">RFQ Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-medium">{q.rfq.title}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-medium">{new Date(q.rfq.deadline).toLocaleDateString()}</span></div>
          {q.rfq.description && (
            <div>
              <span className="text-muted-foreground block mb-1">Description</span>
              <p className="bg-muted/30 rounded p-2">{q.rfq.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Actions */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {approval.status === "PENDING" ? "Decision" : "Review Notes"}
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            {approval.status === "PENDING" ? "Remarks / Comments" : "Remarks"}
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            placeholder={approval.status === "PENDING" ? "Add your remarks..." : ""}
            readOnly={!canAct}
          />
        </div>

        {approval.approvedBy && (
          <div className="text-xs text-muted-foreground">
            Reviewed by: {approval.approvedBy.name} ({approval.approvedBy.email})
          </div>
        )}

        {canAct && (
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white px-6 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="size-4" />
              {submitting ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-6 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="size-4" />
              {submitting ? "Processing..." : "Reject"}
            </button>
            <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline ml-auto">
              Cancel
            </button>
          </div>
        )}

        {approval.status !== "PENDING" && (
          <div className={`rounded-lg border p-4 text-sm ${
            approval.status === "APPROVED"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {approval.status === "APPROVED" ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
              Quotation {approval.status}
            </div>
            {approval.remarks && (
              <p className="mt-1 text-sm opacity-80">Remarks: {approval.remarks}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
