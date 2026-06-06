import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getQuotations, getPublishedRfqs } from "@/lib/services/quotation.service"
import { canSubmitQuotation, canApproveQuotation } from "@/lib/permissions"

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

export default async function QuotationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const quotations = await getQuotations(session.user.id, session.user.role)
  const rfqs = canSubmitQuotation(session.user.role) ? await getPublishedRfqs() : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            {session.user.role === "VENDOR" ? "Manage your submitted quotations" : "Review vendor quotations"}
          </p>
        </div>
        {canSubmitQuotation(session.user.role) && (
          <Link
            href={rfqs.length === 0 ? "#" : "/dashboard/quotations/new"}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              rfqs.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
            aria-disabled={rfqs.length === 0}
            tabIndex={rfqs.length === 0 ? -1 : undefined}
            title={rfqs.length === 0 ? "No published RFQs available" : undefined}
          >
            New Quotation
          </Link>
        )}
      </div>

      {quotations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No quotations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {session.user.role === "VENDOR"
              ? "Submit a quotation on a published RFQ to get started."
              : "No quotations have been submitted yet."}
          </p>
          {canSubmitQuotation(session.user.role) && rfqs.length > 0 && (
            <Link href="/dashboard/quotations/new" className="mt-4 inline-flex items-center text-sm text-primary hover:underline">
              Submit your first quotation
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">RFQ</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Items</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => window.location.href = `/dashboard/quotations/${q.id}`}>
                  <td className="px-4 py-3 font-medium">{q.rfq.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.vendor.companyName}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{Number(q.totalAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{q.items.length}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{new Date(q.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
