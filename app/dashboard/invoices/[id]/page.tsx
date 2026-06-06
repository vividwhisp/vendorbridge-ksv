"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { canView, canEdit } from "@/lib/permissions"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  SENT: "bg-blue-100 text-blue-800 border-blue-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  OVERDUE: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 line-through border-gray-200",
  WRITTEN_OFF: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
      {status}
    </span>
  )
}

const NEXT_STATUS: Record<string, { label: string; status: string; icon: React.ReactNode }[]> = {
  DRAFT: [
    { label: "Send Invoice", status: "SENT", icon: <Send className="size-4" /> },
    { label: "Cancel", status: "CANCELLED", icon: <XCircle className="size-4" /> },
  ],
  SENT: [
    { label: "Mark Paid", status: "PAID", icon: <CheckCircle className="size-4" /> },
    { label: "Mark Overdue", status: "OVERDUE", icon: <AlertTriangle className="size-4" /> },
    { label: "Cancel", status: "CANCELLED", icon: <XCircle className="size-4" /> },
  ],
  OVERDUE: [
    { label: "Mark Paid", status: "PAID", icon: <CheckCircle className="size-4" /> },
    { label: "Write Off", status: "WRITTEN_OFF", icon: <XCircle className="size-4" /> },
    { label: "Cancel", status: "CANCELLED", icon: <XCircle className="size-4" /> },
  ],
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
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

      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) {
        setError("Invoice not found")
        setLoading(false)
        return
      }
      setInvoice(await res.json())
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleStatusUpdate(newStatus: string) {
    setUpdating(true)
    setActionMsg("")
    try {
      const res = await fetch(`/api/invoices/${id}`, {
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
      setInvoice(await res.json())
    } catch {
      setActionMsg("Network error")
    }
    setUpdating(false)
  }

  const downloadPdf = useCallback(async () => {
    if (!invoice) return
    const jsPDF = (await import("jspdf")).default
    await import("jspdf-autotable")

    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFontSize(20)
    doc.text("INVOICE", pageWidth / 2, 25, { align: "center" })

    doc.setFontSize(10)
    doc.text(invoice.invoiceNumber, pageWidth / 2, 32, { align: "center" })

    doc.setFontSize(12)
    doc.text(`Status: ${invoice.status}`, pageWidth / 2, 40, { align: "center" })

    doc.setFontSize(10)
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 52)

    doc.setFontSize(11)
    doc.text("From:", 14, 64)
    doc.setFontSize(10)
    doc.text(invoice.purchaseOrder.quotation.vendor.companyName, 14, 71)
    doc.text(invoice.purchaseOrder.quotation.vendor.email, 14, 78)
    doc.text(invoice.purchaseOrder.quotation.vendor.phone, 14, 85)

    doc.setFontSize(11)
    doc.text("Purchase Order:", pageWidth - 14, 64, { align: "right" })
    doc.setFontSize(10)
    doc.text(invoice.purchaseOrder.poNumber, pageWidth - 14, 71, { align: "right" })
    doc.text(invoice.purchaseOrder.quotation.rfq.title, pageWidth - 14, 78, { align: "right" })

    doc.line(14, 92, pageWidth - 14, 92)

    const body = invoice.items.map((item: any, i: number) => [
      String(i + 1),
      item.productName,
      String(item.quantity),
      `₹${Number(item.unitPrice).toLocaleString()}`,
      `₹${Number(item.totalPrice).toLocaleString()}`,
    ])

    ;(doc as any).autoTable({
      startY: 96,
      head: [["#", "Product", "Qty", "Unit Price", "Total"]],
      body,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 8

    doc.setFontSize(10)
    const rightX = pageWidth - 14
    doc.text("Subtotal:", rightX - 40, finalY)
    doc.text(`₹${Number(invoice.subtotal).toLocaleString()}`, rightX, finalY, { align: "right" })
    doc.text("Tax:", rightX - 40, finalY + 7)
    doc.text(`₹${Number(invoice.tax).toLocaleString()}`, rightX, finalY + 7, { align: "right" })
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Total:", rightX - 40, finalY + 16)
    doc.text(`₹${Number(invoice.totalAmount).toLocaleString()}`, rightX, finalY + 16, { align: "right" })

    doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
  }, [invoice])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.push("/dashboard/invoices")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Invoices
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error || "Invoice not found"}</p>
        </div>
      </div>
    )
  }

  const po = invoice.purchaseOrder
  const canUpdate = canEdit(userRole)
  const nextActions = NEXT_STATUS[invoice.status] || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/invoices" className="hover:text-foreground">Invoices</Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">{invoice.invoiceNumber}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">{po.quotation.vendor.companyName} — {po.quotation.rfq.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <Download className="size-4" />
            Download PDF
          </button>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionMsg}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendor</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{po.quotation.vendor.companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{po.quotation.vendor.email}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{po.quotation.vendor.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="font-medium">{po.quotation.vendor.address}</span></div>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{Number(invoice.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">₹{Number(invoice.tax).toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total Amount</span><span className="font-bold text-lg">₹{Number(invoice.totalAmount).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Purchase Order</span><span className="font-medium font-mono text-xs">{po.poNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RFQ</span><span className="font-medium">{po.quotation.rfq.title}</span></div>
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
            {invoice.items.map((item: any, i: number) => (
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
        <div className="space-y-1 pt-2 border-t text-sm">
          <div className="flex justify-end gap-8">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="tabular-nums w-28 text-right">₹{Number(invoice.subtotal).toLocaleString()}</span>
          </div>
          <div className="flex justify-end gap-8">
            <span className="text-muted-foreground">Tax:</span>
            <span className="tabular-nums w-28 text-right">₹{Number(invoice.tax).toLocaleString()}</span>
          </div>
          <div className="flex justify-end gap-8 text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span className="tabular-nums w-28 text-right">₹{Number(invoice.totalAmount).toLocaleString()}</span>
          </div>
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

      <div className="rounded-lg border p-6 print:hidden">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Printable Preview</h2>
        <div className="border rounded-lg p-8 max-w-[210mm] mx-auto bg-white shadow-sm" id="invoice-preview">
          <div className="text-center border-b pb-4 mb-4">
            <h3 className="text-xl font-bold">INVOICE</h3>
            <p className="font-mono text-sm">{invoice.invoiceNumber}</p>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="font-medium">From:</p>
              <p>{po.quotation.vendor.companyName}</p>
              <p>{po.quotation.vendor.email}</p>
              <p>{po.quotation.vendor.phone}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">PO: {po.poNumber}</p>
              <p className="text-muted-foreground">{po.quotation.rfq.title}</p>
              <p className="text-muted-foreground text-xs">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <table className="w-full text-sm border-t">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 font-medium">#</th>
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium text-right">Qty</th>
                <th className="py-2 font-medium text-right">Unit Price</th>
                <th className="py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr key={item.id} className="border-b">
                  <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5">{item.productName}</td>
                  <td className="py-1.5 text-right">{item.quantity}</td>
                  <td className="py-1.5 text-right">₹{Number(item.unitPrice).toLocaleString()}</td>
                  <td className="py-1.5 text-right">₹{Number(item.totalPrice).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right mt-4 space-y-1 text-sm">
            <p>Subtotal: ₹{Number(invoice.subtotal).toLocaleString()}</p>
            <p>Tax: ₹{Number(invoice.tax).toLocaleString()}</p>
            <p className="text-lg font-bold border-t pt-1">Total: ₹{Number(invoice.totalAmount).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
