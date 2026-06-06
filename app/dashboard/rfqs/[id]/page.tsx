"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { RfqStatusBadge } from "@/features/rfq/components/status-badge"
import type { RfqDetail } from "@/features/rfq/types/rfq-types"

export default function RfqDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const [rfq, setRfq] = useState<RfqDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/rfqs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("RFQ not found")
        return res.json()
      })
      .then((data) => setRfq(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted">Loading RFQ...</p>
        </div>
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error ?? "RFQ not found"}
        </div>
        <Link href="/dashboard/rfqs" className="mt-4 inline-block text-sm text-accent hover:underline">
          Back to RFQs
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/dashboard/rfqs" className="hover:text-accent transition-colors">RFQs</Link>
        <span>/</span>
        <span className="text-fg font-medium truncate max-w-[300px]">{rfq.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-fg">{rfq.title}</h1>
          <RfqStatusBadge status={rfq.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-fg mb-3">Description</h2>
            <p className="text-sm text-muted leading-relaxed">{rfq.description}</p>
          </div>

          <div className="rounded-lg border border-border">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-fg">Items ({rfq.items.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left font-medium text-muted">#</th>
                    <th className="px-5 py-3 text-left font-medium text-muted">Product Name</th>
                    <th className="px-5 py-3 text-left font-medium text-muted">Quantity</th>
                    <th className="px-5 py-3 text-left font-medium text-muted">Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.items.map((item, i) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-muted">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-fg">{item.productName}</td>
                      <td className="px-5 py-3 text-muted">{item.quantity}</td>
                      <td className="px-5 py-3 text-muted">{item.specification ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-fg mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted">Deadline</dt>
                <dd className="text-sm text-fg mt-0.5">{new Date(rfq.deadline).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Created By</dt>
                <dd className="text-sm text-fg mt-0.5">{rfq.createdBy.name}</dd>
                <dd className="text-xs text-muted">{rfq.createdBy.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Created</dt>
                <dd className="text-sm text-fg mt-0.5">{new Date(rfq.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Last Updated</dt>
                <dd className="text-sm text-fg mt-0.5">{new Date(rfq.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
