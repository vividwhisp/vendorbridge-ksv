"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { createQuotationSchema, type CreateQuotationInput } from "../schema"
import { canSubmitQuotation } from "@/lib/permissions"

interface RfqItem {
  id: string
  productName: string
  quantity: number
}

interface RfqListItem {
  id: string
  title: string
  itemCount: number
}

interface QuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [rfqs, setRfqs] = useState<RfqListItem[]>([])
  const [selectedRfqId, setSelectedRfqId] = useState("")
  const [items, setItems] = useState<QuotationItem[]>([])
  const [deliveryDays, setDeliveryDays] = useState(7)
  const [remarks, setRemarks] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [pageError, setPageError] = useState("")
  const actionRef = useRef<"DRAFT" | "SUBMITTED">("DRAFT")

  useEffect(() => {
    async function init() {
      const [sessionRes, rfqsRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/rfqs?status=PUBLISHED"),
      ])
      const session = await sessionRes.json()
      if (!session?.user?.role || !canSubmitQuotation(session.user.role)) {
        router.push("/dashboard/quotations")
        return
      }
      const rfqsData = await rfqsRes.json()
      setRfqs(Array.isArray(rfqsData?.rfqs) ? rfqsData.rfqs : [])
      setFetching(false)
    }
    init()
  }, [router])

  async function handleRfqSelect(rfqId: string) {
    setSelectedRfqId(rfqId)
    setItems([])
    setErrors({})
    if (!rfqId) return

    try {
      const res = await fetch(`/api/rfqs/${rfqId}`)
      if (res.ok) {
        const rfq = await res.json()
        if (rfq?.items) {
          setItems(
            rfq.items.map((i: RfqItem) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: 0,
              totalPrice: 0,
            }))
          )
        }
      }
    } catch {
      // ignore fetch errors
    }
  }

  function updateItem(index: number, field: keyof QuotationItem, value: string) {
    const updated = [...items]
    const numVal = field === "productName" ? value : Number(value) || 0
    ;(updated[index] as any)[field] = numVal
    if (field === "quantity" || field === "unitPrice") {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice
    }
    setItems(updated)
  }

  function addItem() {
    setItems([...items, { productName: "", quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPageError("")
    setErrors({})
    setSubmitting(true)

    const saveStatus = actionRef.current
    const data: CreateQuotationInput = { rfqId: selectedRfqId, items, deliveryDays, remarks, status: saveStatus }
    const parsed = createQuotationSchema.safeParse(data)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      const flat = parsed.error.flatten()
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        fieldErrors[key] = (msgs as string[])[0]
      }
      if (flat.formErrors.length) setPageError(flat.formErrors[0])
      setErrors(fieldErrors)
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const err = await res.json()
        setPageError(err.error || "Failed to create quotation")
        setSubmitting(false)
        return
      }
      router.push("/dashboard/quotations")
    } catch {
      setPageError("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Quotation</h1>
        <p className="text-muted-foreground">Submit a quotation for a published RFQ</p>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pageError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">RFQ *</label>
            <select
              value={selectedRfqId}
              onChange={(e) => handleRfqSelect(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              required
            >
              <option value="">Select an RFQ...</option>
              {rfqs.map((rfq) => (
                <option key={rfq.id} value={rfq.id}>
                  {rfq.title} ({rfq.itemCount} items)
                </option>
              ))}
            </select>
            {errors.rfqId && <p className="text-xs text-red-500 mt-1">{errors.rfqId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Delivery Days *</label>
            <input
              type="number"
              min={1}
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(Number(e.target.value) || 0)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
            {errors.deliveryDays && <p className="text-xs text-red-500 mt-1">{errors.deliveryDays}</p>}
          </div>
        </div>

        {selectedRfqId && (
          <div className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Line Items</h2>
              <button type="button" onClick={addItem} className="text-sm text-primary hover:underline">
                + Add Item
              </button>
            </div>

            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(i, "productName", e.target.value)}
                        className="w-full rounded border px-2 py-1 text-sm bg-background"
                        placeholder="Product name"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        className="w-20 rounded border px-2 py-1 text-sm text-right bg-background"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                        className="w-28 rounded border px-2 py-1 text-sm text-right bg-background"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      ₹{item.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-2 text-center">
                      <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right text-lg font-bold pt-2 border-t">
              Total: ₹{totalAmount.toLocaleString()}
            </div>
          </div>
        )}

        <div className="rounded-lg border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            onClick={() => { actionRef.current = "DRAFT" }}
            className="inline-flex items-center justify-center rounded-md border px-6 py-2 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save as Draft"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            onClick={() => { actionRef.current = "SUBMITTED" }}
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Quotation"}
          </button>
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:underline ml-auto">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
