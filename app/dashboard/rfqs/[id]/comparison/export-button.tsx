"use client"

import { useState } from "react"
import { Download, FileText, Table2 } from "lucide-react"
import type { ComparisonData } from "@/lib/services/comparison.service"

export function ExportButton({ rfqId, data }: { rfqId: string; data: ComparisonData }) {
  const [open, setOpen] = useState(false)

  function downloadCsv() {
    const params = new URLSearchParams({ format: "csv" })
    window.open(`/api/comparison/${rfqId}/export?${params}`, "_blank")
    setOpen(false)
  }

  async function downloadPdf() {
    const jsPDF = (await import("jspdf")).default
    await import("jspdf-autotable")
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

    doc.setFontSize(16)
    doc.text(`Quotation Comparison: ${data.rfq.title}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28)

    const headers = ["Vendor", "Amount", "Delivery", "Items", "Status", "Date"]
    const rows = data.quotations.map((q) => [
      q.vendorName,
      `₹${q.totalAmount.toLocaleString()}`,
      `${q.deliveryDays} days`,
      String(q.itemCount),
      q.status.replace(/_/g, " "),
      new Date(q.createdAt).toLocaleDateString(),
    ])

    ;(doc as any).autoTable({
      startY: 34,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })

    // Add line items comparison
    const itemHeaders = ["Product", "Required Qty", ...data.quotations.map((q) => q.vendorName)]
    const itemRows = data.rfq.items.map((item) => {
      const row = [item.productName, String(item.quantity)]
      for (const q of data.quotations) {
        const match = q.items.find(
          (i) => i.productName.toLowerCase() === item.productName.toLowerCase()
        )
        row.push(match ? `₹${match.unitPrice.toLocaleString()}` : "—")
      }
      return row
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text("Line Items — Unit Price Comparison", 14, finalY)
    ;(doc as any).autoTable({
      startY: finalY + 4,
      head: [itemHeaders],
      body: itemRows,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    })

    // Add summary
    const summaryY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text("Summary", 14, summaryY)
    doc.setFontSize(10)
    doc.text(`Total Quotations: ${data.summary.totalQuotations}`, 14, summaryY + 8)
    doc.text(`Lowest Bid: ₹${data.summary.lowestBid.toLocaleString()}`, 14, summaryY + 16)
    doc.text(`Highest Bid: ₹${data.summary.highestBid.toLocaleString()}`, 14, summaryY + 24)
    doc.text(`Average Bid: ₹${data.summary.averageBid.toLocaleString()}`, 14, summaryY + 32)
    if (data.summary.recommendedVendor) {
      doc.text(
        `Recommended Vendor: ${data.summary.recommendedVendor.name} (Score: ${data.summary.recommendedVendor.score})`,
        14,
        summaryY + 40
      )
    }

    doc.save(`comparison-${rfqId}.pdf`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <Download className="size-4" />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border bg-background shadow-lg">
            <button
              onClick={downloadCsv}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors rounded-t-lg"
            >
              <Table2 className="size-4 text-green-600" />
              Export as CSV
            </button>
            <button
              onClick={downloadPdf}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors rounded-b-lg"
            >
              <FileText className="size-4 text-red-600" />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
