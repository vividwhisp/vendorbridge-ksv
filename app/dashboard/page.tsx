"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts"
import {
  FileText, Send, ClipboardList, Clock, CheckCircle, XCircle, Building2,
  Activity, TrendingUp, Award,
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
}

const cardClass = "rounded-lg border p-5 space-y-2"
const chartCardClass = "rounded-lg border p-5 space-y-4"

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={color ? `text-${color}` : "text-muted-foreground"}>{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

function PieChartCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className={chartCardClass}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#a3a3a3"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function BarChartCard({ title, data, dataKey }: { title: string; data: { name: string; value: number }[]; dataKey: string }) {
  return (
    <div className={chartCardClass}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function LineChartCard({ title, data }: { title: string; data: { month: string; count: number }[] }) {
  return (
    <div className={chartCardClass}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function HorizontalBarCard({ title, data }: { title: string; data: { name: string; quotations: number }[] }) {
  return (
    <div className={chartCardClass}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{item.name}</span>
                <span className="font-medium tabular-nums">{item.quotations}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((item.quotations / Math.max(...data.map((d) => d.quotations))) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.ok ? res.json() : null)
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-muted-foreground">Failed to load dashboard data.</div>
  }

  const s = data.summary

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="size-6 text-accent" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of procurement activities and insights</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <SummaryCard icon={<FileText className="size-4" />} label="Total RFQs" value={s.totalRfqs} />
        <SummaryCard icon={<Send className="size-4 text-blue-600" />} label="Published RFQs" value={s.publishedRfqs} />
        <SummaryCard icon={<ClipboardList className="size-4" />} label="Total Quotations" value={s.totalQuotations} />
        <SummaryCard icon={<Clock className="size-4 text-amber-600" />} label="Pending Approvals" value={s.pendingApprovals} />
        <SummaryCard icon={<CheckCircle className="size-4 text-green-600" />} label="Approved" value={s.approvedQuotations} />
        <SummaryCard icon={<XCircle className="size-4 text-red-600" />} label="Rejected" value={s.rejectedQuotations} />
        <SummaryCard icon={<Building2 className="size-4" />} label="Active Vendors" value={s.activeVendors} />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PieChartCard title="RFQs by Status" data={data.rfqsByStatus} />
        <PieChartCard title="Quotations by Status" data={data.quotationsByStatus} />
        <PieChartCard title="Approvals by Status" data={data.approvalsByStatus} />
        <LineChartCard title="Monthly RFQ Creation Trend" data={data.monthlyRfqTrend} />
        <HorizontalBarCard title="Vendor Participation" data={data.vendorParticipation} />
      </div>

      {/* Bottom: Activity + Top Vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
          ) : (
            <div className="space-y-0 divide-y max-h-[400px] overflow-y-auto">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="py-3 flex items-start gap-3">
                  <div className="size-2 rounded-full bg-accent mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.action.replace(/_/g, " ").toLowerCase()} — {a.entityType.toLowerCase()}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Vendors */}
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Vendors</h2>
          </div>
          {data.topVendors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No vendor data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Vendor</th>
                  <th className="pb-2 font-medium text-right">Quotations</th>
                  <th className="pb-2 font-medium text-right">Approved</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.topVendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 font-medium">{v.name}</td>
                    <td className="py-2 text-right tabular-nums">{v.quotationCount}</td>
                    <td className="py-2 text-right tabular-nums text-green-600">{v.approvedCount}</td>
                    <td className="py-2 text-right tabular-nums">
                      {v.quotationCount > 0
                        ? `${Math.round((v.approvedCount / v.quotationCount) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
