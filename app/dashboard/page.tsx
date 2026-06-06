"use client"

import { useState, useEffect, useRef } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"
import {
  FileText, Send, ClipboardList, Clock, CheckCircle, XCircle, Building2,
  Activity, TrendingUp, Award, ArrowUpRight, DollarSign, Percent, BarChart3,
} from "lucide-react"
import type { DashboardData } from "@/lib/services/dashboard.service"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#a3a3a3",
  PUBLISHED: "#2563eb",
  CLOSED: "#16a34a",
  CANCELLED: "#ef4444",
  SUBMITTED: "#2563eb",
  UNDER_REVIEW: "#f59e0b",
  ACCEPTED: "#16a34a",
  REJECTED: "#ef4444",
  PENDING: "#f59e0b",
  APPROVED: "#16a34a",
  SENT: "#2563eb",
  PAID: "#16a34a",
  OVERDUE: "#ef4444",
  WRITTEN_OFF: "#a3a3a3",
}

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#a3a3a3", "#8b5cf6", "#ec4899", "#14b8a6"]

function SummaryCard({
  icon,
  label,
  value,
  trend,
  accent,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: number
  trend?: string
  accent?: string
  delay: number
}) {
  return (
    <div
      className="rounded-xl border bg-surface p-4 sm:p-5 space-y-2 animate-card-entrance card-hover-shadow"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-muted-foreground truncate">{label}</span>
        <span className={`${accent ? `text-${accent}` : "text-muted-foreground"} shrink-0`}>
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
            <ArrowUpRight className="size-3" />
            {trend}
          </span>
        )}
      </div>
      {accent && <div className={`h-0.5 w-full rounded-full bg-${accent} opacity-30`} />}
    </div>
  )
}

function PieChartCard({ title, data, delay }: { title: string; data: { name: string; value: number }[]; delay: number }) {
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: `${delay}s` }}>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BarChart3 className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No data yet</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={72} innerRadius={36} dataKey="value">
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-xs text-muted-foreground">
            {data.map((entry, i) => (
              <span key={entry.name} className="flex items-center gap-1">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BarChartCard({ title, data, dataKey, delay }: { title: string; data: { name: string; value: number }[]; dataKey: string; delay: number }) {
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: `${delay}s` }}>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BarChart3 className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function LineChartCard({ title, data, delay }: { title: string; data: { month: string; count: number }[]; delay: number }) {
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: `${delay}s` }}>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <BarChart3 className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No data yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-accent)" }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function HorizontalBarCard({ title, data, delay }: { title: string; data: { name: string; quotations: number }[]; delay: number }) {
  const maxVal = data.length > 0 ? Math.max(...data.map((d) => d.quotations)) : 1
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: `${delay}s` }}>
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Building2 className="size-8 mb-2 opacity-40" />
          <p className="text-xs">No data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="truncate mr-2">{item.name}</span>
                <span className="font-medium tabular-nums shrink-0">{item.quotations}</span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min((item.quotations / maxVal) * 100, 100)}%`,
                    background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityEntry({ entry, index }: { entry: any; index: number }) {
  const actionLabel = entry.action.replace(/_/g, " ").toLowerCase()
  const entityLabel = entry.entityType.toLowerCase()

  const actionColors: Record<string, string> = {
    po_created: "bg-blue-500",
    po_status_changed: "bg-purple-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    quotation_created: "bg-amber-500",
    quotation_submitted: "bg-indigo-500",
    invoice_created: "bg-teal-500",
    invoice_status_changed: "bg-cyan-500",
    rfq_created: "bg-slate-500",
  }

  return (
    <div className="flex items-start gap-3 py-2.5 sm:py-3 hover:bg-muted/20 rounded-lg px-2 -mx-2 transition-colors">
      <div className={`size-2 rounded-full shrink-0 mt-1.5 ${actionColors[entityLabel] || "bg-muted"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium truncate">{entry.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {actionLabel} — {entityLabel}
        </p>
        <p className="text-[10px] sm:text-[11px] text-muted-foreground/70 mt-0.5">
          {new Date(entry.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-pulse">
      <div className="h-3 bg-muted/50 rounded w-1/2" />
      <div className="h-7 bg-muted/50 rounded w-1/3" />
      <div className="h-0.5 bg-muted/30 rounded w-full" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-pulse">
      <div className="h-3 bg-muted/50 rounded w-1/3" />
      <div className="h-44 bg-muted/20 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (mounted.current) setData(d)
      })
      .finally(() => {
        if (mounted.current) setLoading(false)
      })
    return () => { mounted.current = false }
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-muted/50 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 bg-muted/50 rounded w-48 animate-pulse" />
            <div className="h-3 bg-muted/50 rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonChart key={i} />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center py-20 text-muted-foreground">
        <TrendingUp className="size-12 mb-3 opacity-40" />
        <p className="text-sm">Failed to load dashboard data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs text-accent hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in">
        <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <TrendingUp className="size-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Procurement Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Overview of procurement activities and insights</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        <SummaryCard
          icon={<FileText className="size-3.5 sm:size-4" />}
          label="Total RFQs"
          value={s.totalRfqs}
          delay={0}
        />
        <SummaryCard
          icon={<Send className="size-3.5 sm:size-4" />}
          label="Published"
          value={s.publishedRfqs}
          accent="accent"
          delay={0.05}
        />
        <SummaryCard
          icon={<ClipboardList className="size-3.5 sm:size-4" />}
          label="Quotations"
          value={s.totalQuotations}
          delay={0.1}
        />
        <SummaryCard
          icon={<Clock className="size-3.5 sm:size-4" />}
          label="Pending Approvals"
          value={s.pendingApprovals}
          accent="warning"
          delay={0.15}
        />
        <SummaryCard
          icon={<CheckCircle className="size-3.5 sm:size-4" />}
          label="Approved"
          value={s.approvedQuotations}
          accent="green-600"
          delay={0.2}
        />
        <SummaryCard
          icon={<XCircle className="size-3.5 sm:size-4" />}
          label="Rejected"
          value={s.rejectedQuotations}
          accent="danger"
          delay={0.25}
        />
        <SummaryCard
          icon={<Building2 className="size-3.5 sm:size-4" />}
          label="Active Vendors"
          value={s.activeVendors}
          delay={0.3}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PieChartCard title="RFQs by Status" data={data.rfqsByStatus} delay={0.1} />
        <PieChartCard title="Quotations by Status" data={data.quotationsByStatus} delay={0.15} />
        <PieChartCard title="Approvals by Status" data={data.approvalsByStatus} delay={0.2} />
        <LineChartCard title="Monthly RFQ Trend" data={data.monthlyRfqTrend} delay={0.25} />
        <HorizontalBarCard title="Vendor Participation" data={data.vendorParticipation} delay={0.3} />
      </div>

      {/* Bottom section */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: "0.35s" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h2>
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{data.recentActivity.length} entries</span>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="size-8 mb-2 opacity-40" />
              <p className="text-xs">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y max-h-[380px] overflow-y-auto">
              {data.recentActivity.map((a, i) => (
                <ActivityEntry key={a.id} entry={a} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Top Vendors */}
        <div className="rounded-xl border bg-surface p-4 sm:p-5 space-y-3 animate-card-entrance" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-muted-foreground" />
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Vendors</h2>
            </div>
            {data.topVendors.length > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">Top {data.topVendors.length}</span>
            )}
          </div>
          {data.topVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Award className="size-8 mb-2 opacity-40" />
              <p className="text-xs">No vendor data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-5">
              <table className="w-full text-xs sm:text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 px-4 sm:px-5 font-medium">Vendor</th>
                    <th className="pb-2 px-3 font-medium text-right">Quotations</th>
                    <th className="pb-2 px-3 font-medium text-right">Approved</th>
                    <th className="pb-2 px-3 font-medium text-right">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 sm:px-5 font-medium truncate max-w-[140px] sm:max-w-[200px]">{v.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{v.quotationCount}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-green-600 dark:text-green-400">{v.approvedCount}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                        {v.quotationCount > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Percent className="size-3 text-muted-foreground" />
                            {Math.round((v.approvedCount / v.quotationCount) * 100)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
