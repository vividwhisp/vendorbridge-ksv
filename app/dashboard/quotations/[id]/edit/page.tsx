"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { use } from "react"
import { updateQuotationSchema, type UpdateQuotationInput } from "../../schema"
import { canSubmitQuotation } from "@/lib/permissions"

interface QuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [items, setItems] = useState<QuotationItem[]>([])
  const [deliveryDays, setDeliveryDays] = useState(7)
  const [remarks, setRemarks] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [pageError, setPageError] = useState("")
  const actionRef = useRef<"DRAFT" | "SUBMITTED">("DRAFT")

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session")
      const session = await sessionRes.json()
      if (!session?.user?.role || !canSubmitQuotation(session.user.role)) {
        router.push("/dashboard/quotations")
        return
      }

      const res = await fetch(`/api/quotations/${id}`)
      if (!res.ok) {
        router.push("/dashboard/quotations")
        return
      }
      const q = await res.json()
      if (q.status !== "DRAFT") {
        router.push(`/dashboard/quotations/${id}`)
        return
      }

      setItems(q.items.map((i: any) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })))
      setDeliveryDays(q.deliveryDays)
      setRemarks(q.remarks || "")
      setFetching(false)
    }
    load()
  }, [id, router])

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
    const data: UpdateQuotationInput = { items, deliveryDays, remarks, status: saveStatus }
    const parsed = updateQuotationSchema.safeParse(data)
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
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const err = await res.json()
        setPageError(err.error || "Failed to update quotation")
        setSubmitting(false)
        return
      }
      router.push(`/dashboard/quotations/${id}`)
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Quotation</h1>
        <p className="text-muted-foreground">Update your draft quotation</p>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{pageError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6 space-y-4">
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
            {submitting ? "Saving..." : "Save Changes"}
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
