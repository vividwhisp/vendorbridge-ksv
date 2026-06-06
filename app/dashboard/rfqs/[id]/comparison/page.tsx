"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { use } from "react"
import { ArrowLeft, Filter, RefreshCw } from "lucide-react"
import { SummaryCards } from "./summary-cards"
import { ComparisonTable } from "./comparison-table"
import { ExportButton } from "./export-button"
import { canCompareQuotations } from "@/lib/permissions"
import type { ComparisonData } from "@/lib/services/comparison.service"

export default function ComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rfqId } = use(params)
  const router = useRouter()

  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState("")

  const [statusFilter, setStatusFilter] = useState("")
  const [vendorFilter, setVendorFilter] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sort, setSort] = useState("newest")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")

    const sessionRes = await fetch("/api/auth/session")
    const session = await sessionRes.json()
    if (!session?.user?.role || !canCompareQuotations(session.user.role)) {
      router.push("/dashboard/rfqs")
      return
    }
    setUserRole(session.user.role)

    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (vendorFilter) params.set("vendorId", vendorFilter)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (sort) params.set("sort", sort)

    try {
      const res = await fetch(`/api/comparison/${rfqId}?${params}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Failed to load comparison")
        setLoading(false)
        return
      }
      const result: ComparisonData = await res.json()
      setData(result)
    } catch {
      setError("Failed to load comparison data")
    }
    setLoading(false)
  }, [rfqId, statusFilter, vendorFilter, minPrice, maxPrice, sort, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function getUniqueVendors(): { id: string; name: string }[] {
    if (!data) return []
    const seen = new Set<string>()
    return data.quotations
      .filter((q) => {
        const key = q.vendorId
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((q) => ({ id: q.vendorId, name: q.vendorName }))
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to RFQ
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const highlights = data
    ? {
        lowestPriceId: data.summary.lowestPriceVendor?.id ?? null,
        fastestDeliveryId: data.summary.fastestDeliveryVendor?.id ?? null,
        recommendedId: data.summary.recommendedVendor?.id ?? null,
      }
    : { lowestPriceId: null, fastestDeliveryId: null, recommendedId: null }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => router.push(`/dashboard/rfqs/${rfqId}`)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-4" />
            Back to RFQ
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Quotation Comparison</h1>
          {data && (
            <p className="text-muted-foreground">
              {data.rfq.title} — Comparing {data.quotations.length} quotation{data.quotations.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {data && <ExportButton rfqId={rfqId} data={data} />}
      </div>

      {/* Summary */}
      {data && data.quotations.length > 0 && (
        <SummaryCards
          totalQuotations={data.summary.totalQuotations}
          lowestBid={data.summary.lowestBid}
          highestBid={data.summary.highestBid}
          averageBid={data.summary.averageBid}
          recommendedVendor={data.summary.recommendedVendor}
        />
      )}

      {/* Filters */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Vendor</label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Vendors</option>
              {getUniqueVendors().map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Min Price</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="₹0"
              className="w-28 rounded-md border px-3 py-1.5 text-sm bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Max Price</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="₹∞"
              className="w-28 rounded-md border px-3 py-1.5 text-sm bg-background"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm bg-background"
            >
              <option value="newest">Newest Submission</option>
              <option value="price_asc">Lowest Price</option>
              <option value="price_desc">Highest Price</option>
              <option value="delivery_asc">Fastest Delivery</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Apply
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.quotations.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No quotations to compare</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No submitted quotations found for this RFQ. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Comparison table */}
      {!loading && data && data.quotations.length > 0 && (
        <ComparisonTable
          rfqItems={data.rfq.items}
          quotations={data.quotations}
          highlights={highlights}
        />
      )}
    </div>
  )
}
