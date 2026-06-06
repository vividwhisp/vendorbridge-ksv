import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getQuotationById } from "@/lib/services/quotation.service"
import { canSubmitQuotation } from "@/lib/permissions"

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

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const { id } = await params
  const quotation = await getQuotationById(id)
  if (!quotation) redirect("/dashboard/quotations")

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/quotations" className="hover:text-foreground">Quotations</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{quotation.id.slice(0, 8)}</span>
      </nav>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{quotation.rfq.title}</h1>
          <p className="text-muted-foreground">{quotation.vendor.companyName}</p>
        </div>
        <StatusBadge status={quotation.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium">₹{Number(quotation.totalAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Days</span>
              <span className="font-medium">{quotation.deliveryDays}</span>
            </div>
            {quotation.remarks && (
              <div>
                <span className="text-muted-foreground block mb-1">Remarks</span>
                <p className="bg-muted/30 rounded p-2">{quotation.remarks}</p>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{new Date(quotation.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium">{quotation.vendor.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{quotation.vendor.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{quotation.vendor.phone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</h2>
        </div>
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
            {quotation.items.map((item, i) => (
              <tr key={item.id}>
                <td className="py-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2 font-medium">{item.productName}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">₹{Number(item.unitPrice).toLocaleString()}</td>
                <td className="py-2 text-right font-medium">₹{Number(item.totalPrice).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-lg font-bold pt-2 border-t">
          Total: ₹{Number(quotation.totalAmount).toLocaleString()}
        </div>
      </div>

      {canSubmitQuotation(session.user.role) && quotation.status === "DRAFT" && (
        <div className="flex justify-end">
          <Link
            href={`/dashboard/quotations/${quotation.id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Edit Quotation
          </Link>
        </div>
      )}
    </div>
  )
}
