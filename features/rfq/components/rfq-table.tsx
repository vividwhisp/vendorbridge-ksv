"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RfqStatusBadge } from "@/features/rfq/components/status-badge"
import type { RfqListItem, RfqFilters } from "@/features/rfq/types/rfq-types"

interface Props {
  rfqs: RfqListItem[]
  total: number
  filters: RfqFilters
  onFiltersChange: (filters: RfqFilters) => void
}

export function RfqTable({ rfqs, total, filters, onFiltersChange }: Props) {
  const [search, setSearch] = useState(filters.search ?? "")
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    onFiltersChange({ ...filters, search })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full sm:w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-hover transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filters.status ?? "ALL"}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value === "ALL" ? undefined : e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={filters.sort ?? "desc"}
            onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as "asc" | "desc" })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            <option value="desc">Deadline (Newest)</option>
            <option value="asc">Deadline (Oldest)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Deadline</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Items</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Created By</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Created</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <p className="font-medium">No RFQs found</p>
                    <p className="text-sm">{search ? "Try a different search" : "Create your first RFQ to get started"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  onClick={() => router.push(`/dashboard/rfqs/${rfq.id}`)}
                  className="border-b border-border last:border-0 hover:bg-surface/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-fg">{rfq.title}</td>
                  <td className="px-4 py-3"><RfqStatusBadge status={rfq.status} /></td>
                  <td className="px-4 py-3 text-muted">{new Date(rfq.deadline).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted">{rfq.itemCount}</td>
                  <td className="px-4 py-3 text-muted">{rfq.createdBy}</td>
                  <td className="px-4 py-3 text-muted">{new Date(rfq.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">{total} RFQ{total !== 1 ? "s" : ""}</p>
    </div>
  )
}
