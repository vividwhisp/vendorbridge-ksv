"use client"

interface RfqItem {
  id: string
  productName: string
  quantity: number
  specification: string | null
}

interface QuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Quotation {
  id: string
  vendorName: string
  totalAmount: number
  deliveryDays: number
  itemCount: number
  status: string
  createdAt: string
  items: QuotationItem[]
}

interface Highlights {
  lowestPriceId: string | null
  fastestDeliveryId: string | null
  recommendedId: string | null
}

function Badge({ label, variant }: { label: string; variant: "price" | "delivery" | "recommended" }) {
  const colors = {
    price: "bg-green-100 text-green-800 border-green-200",
    delivery: "bg-blue-100 text-blue-800 border-blue-200",
    recommended: "bg-amber-100 text-amber-800 border-amber-300",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[variant]}`}>
      {label}
    </span>
  )
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

export function ComparisonTable({
  rfqItems,
  quotations,
  highlights,
}: {
  rfqItems: RfqItem[]
  quotations: Quotation[]
  highlights: Highlights
}) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      {/* Overview table */}
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium min-w-[180px]">Vendor</th>
            <th className="text-right px-4 py-3 font-medium min-w-[120px]">Amount</th>
            <th className="text-center px-4 py-3 font-medium min-w-[100px]">Delivery</th>
            <th className="text-center px-4 py-3 font-medium min-w-[80px]">Items</th>
            <th className="text-center px-4 py-3 font-medium min-w-[110px]">Status</th>
            <th className="text-right px-4 py-3 font-medium min-w-[110px]">Date</th>
            <th className="text-center px-4 py-3 font-medium min-w-[100px]">Highlights</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {quotations.map((q) => (
            <tr
              key={q.id}
              className={`hover:bg-muted/30 transition-colors ${
                highlights.recommendedId === q.id ? "bg-amber-50/50" : ""
              }`}
            >
              <td className="px-4 py-3 font-medium">
                {q.vendorName}
                {highlights.recommendedId === q.id && (
                  <span className="ml-2 text-[10px] text-amber-700 font-semibold">★ Recommended</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                ₹{q.totalAmount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-center tabular-nums">{q.deliveryDays} days</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{q.itemCount}</td>
              <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
              <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                {new Date(q.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex flex-wrap justify-center gap-1">
                  {highlights.lowestPriceId === q.id && <Badge label="Lowest Price" variant="price" />}
                  {highlights.fastestDeliveryId === q.id && <Badge label="Fastest Delivery" variant="delivery" />}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Side-by-side line items table */}
      {rfqItems.length > 0 && quotations.length > 0 && (
        <div className="border-t">
          <div className="px-4 py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide bg-muted/20">
            Line Items — Unit Price Comparison
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Product</th>
                <th className="text-center px-4 py-2 font-medium w-20">Req. Qty</th>
                {quotations.map((q) => (
                  <th key={q.id} className="text-right px-3 py-2 font-medium min-w-[120px]">
                    {q.vendorName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rfqItems.map((item) => {
                const bestPrice = Math.min(
                  ...quotations.map((q) => {
                    const match = q.items.find(
                      (i) => i.productName.toLowerCase() === item.productName.toLowerCase()
                    )
                    return match ? match.unitPrice : Infinity
                  })
                )

                return (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <span className="font-medium">{item.productName}</span>
                      {item.specification && (
                        <p className="text-xs text-muted-foreground">{item.specification}</p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center tabular-nums">{item.quantity}</td>
                    {quotations.map((q) => {
                      const match = q.items.find(
                        (i) => i.productName.toLowerCase() === item.productName.toLowerCase()
                      )
                      const price = match ? match.unitPrice : null
                      const isBest = price === bestPrice && bestPrice !== Infinity

                      return (
                        <td
                          key={q.id}
                          className={`px-3 py-2 text-right tabular-nums ${
                            isBest ? "font-semibold text-green-700" : ""
                          }`}
                        >
                          {price !== null ? (
                            <span>
                              ₹{price.toLocaleString()}
                              {isBest && <span className="ml-1 text-[10px] text-green-600">✓</span>}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
