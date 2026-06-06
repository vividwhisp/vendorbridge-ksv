"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react"
import { canView } from "@/lib/permissions"

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }
  const icons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="size-3.5" />,
    APPROVED: <CheckCircle className="size-3.5" />,
    REJECTED: <XCircle className="size-3.5" />,
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {icons[status]}
      {status}
    </span>
  )
}

export default function ApprovalsPage() {
  const router = useRouter()
  const [approvals, setApprovals] = useState<any[]>([])
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

      const res = await fetch("/api/approvals")
      if (res.ok) {
        const data = await res.json()
        setApprovals(data)
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          {userRole === "VENDOR"
            ? "View the status of your submitted quotations"
            : "Review and decide on submitted quotations"}
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No approvals yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === "VENDOR"
              ? "Your quotations will appear here once they are reviewed."
              : "Pending quotations will appear here once vendors submit them."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 font-medium">RFQ</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Submitted</th>
                <th className="text-center px-4 py-3 font-medium w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {approvals.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{a.quotation.vendor.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.quotation.rfq.title}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    ₹{Number(a.quotation.totalAmount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {new Date(a.quotation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/dashboard/approvals/${a.id}`)}
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
