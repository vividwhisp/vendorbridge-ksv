"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/use-permissions"
import { RfqTable } from "@/features/rfq/components/rfq-table"
import type { RfqListItem, RfqFilters } from "@/features/rfq/types/rfq-types"

export default function RfqsPage() {
  const { canCreateRFQ: canCreate } = usePermissions()
  const [rfqs, setRfqs] = useState<RfqListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<RfqFilters>({})

  const fetchRfqs = useCallback(async (f: RfqFilters) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.search) params.set("search", f.search)
    if (f.status) params.set("status", f.status)
    if (f.sort) params.set("sort", f.sort)

    const res = await fetch(`/api/rfqs?${params}`)
    if (res.ok) {
      const data = await res.json()
      setRfqs(data.rfqs)
      setTotal(data.total)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRfqs(filters) }, [filters, fetchRfqs])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">RFQs</h1>
          <p className="text-sm text-muted mt-0.5">Manage requests for quotations</p>
        </div>
        {canCreate() && (
          <Link
            href="/dashboard/rfqs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-hover transition-colors"
          >
            + Create RFQ
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-sm text-muted">Loading RFQs...</p>
          </div>
        </div>
      ) : (
        <RfqTable
          rfqs={rfqs}
          total={total}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}
    </div>
  )
}
