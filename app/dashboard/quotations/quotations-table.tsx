"use client"

import { useRouter } from "next/navigation"

interface QuotationRow {
  id: string
  rfq: { title: string }
  vendor: { companyName: string }
  totalAmount: number
  status: string
  items: { id: string }[]
  createdAt: Date
}

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

export function QuotationsTable({ quotations }: { quotations: QuotationRow[] }) {
  const router = useRouter()

  return (
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
            <tr
              key={q.id}
              className="hover:bg-muted/30 cursor-pointer"
              onClick={() => router.push(`/dashboard/quotations/${q.id}`)}
            >
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
  )
}
