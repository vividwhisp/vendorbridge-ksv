import { prisma } from "@/lib/prisma"

export interface DashboardSummary {
  totalRfqs: number
  publishedRfqs: number
  totalQuotations: number
  pendingApprovals: number
  approvedQuotations: number
  rejectedQuotations: number
  activeVendors: number
}

export interface ChartDataPoint {
  name: string
  value: number
}

export interface MonthlyTrend {
  month: string
  count: number
}

export interface VendorStat {
  id: string
  name: string
  quotationCount: number
  approvedCount: number
}

export interface ActivityEntry {
  id: string
  user: { name: string; email: string }
  action: string
  entityType: string
  timestamp: Date
}

export interface DashboardData {
  summary: DashboardSummary
  rfqsByStatus: ChartDataPoint[]
  quotationsByStatus: ChartDataPoint[]
  approvalsByStatus: ChartDataPoint[]
  monthlyRfqTrend: MonthlyTrend[]
  vendorParticipation: { name: string; quotations: number }[]
  recentActivity: ActivityEntry[]
  topVendors: VendorStat[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    totalRfqs,
    publishedRfqs,
    totalQuotations,
    pendingApprovals,
    approvedQuotations,
    rejectedQuotations,
    activeVendors,
    rfqGroups,
    quotationGroups,
    approvalGroups,
    rawRfqs,
    rawActivity,
    vendorStats,
  ] = await Promise.all([
    prisma.rFQ.count(),
    prisma.rFQ.count({ where: { status: "PUBLISHED" } }),
    prisma.quotation.count(),
    prisma.approval.count({ where: { status: "PENDING" } }),
    prisma.quotation.count({ where: { status: "ACCEPTED" } }),
    prisma.quotation.count({ where: { status: "REJECTED" } }),
    prisma.vendor.count({ where: { status: "ACTIVE" } }),
    prisma.rFQ.groupBy({ by: ["status"], _count: true }),
    prisma.quotation.groupBy({ by: ["status"], _count: true }),
    prisma.approval.groupBy({ by: ["status"], _count: true }),
    prisma.rFQ.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
    prisma.activityLog.findMany({
      take: 15,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.vendor.findMany({
      select: {
        id: true,
        companyName: true,
        quotations: {
          select: { status: true },
        },
      },
    }),
  ])

  const rfqsByStatus: ChartDataPoint[] = rfqGroups.map((g) => ({
    name: g.status,
    value: g._count,
  }))

  const quotationsByStatus: ChartDataPoint[] = quotationGroups.map((g) => ({
    name: g.status,
    value: g._count,
  }))

  const approvalsByStatus: ChartDataPoint[] = approvalGroups.map((g) => ({
    name: g.status,
    value: g._count,
  }))

  const monthlyRfqTrend = buildMonthlyTrend(rawRfqs.map((r) => r.createdAt))

  const vendorChartMap = new Map<string, number>()
  for (const v of vendorStats) {
    if (v.quotations.length > 0) {
      vendorChartMap.set(v.companyName, v.quotations.length)
    }
  }
  const vendorParticipation = Array.from(vendorChartMap.entries())
    .map(([name, quotations]) => ({ name, quotations }))
    .sort((a, b) => b.quotations - a.quotations)
    .slice(0, 10)

  const topVendors: VendorStat[] = vendorStats
    .map((v) => ({
      id: v.id,
      name: v.companyName,
      quotationCount: v.quotations.length,
      approvedCount: v.quotations.filter((q) => q.status === "ACCEPTED").length,
    }))
    .filter((v) => v.quotationCount > 0)
    .sort((a, b) => b.quotationCount - a.quotationCount)
    .slice(0, 5)

  const recentActivity: ActivityEntry[] = rawActivity.map((a) => ({
    id: a.id,
    user: { name: a.user.name, email: a.user.email },
    action: a.action,
    entityType: a.entityType,
    timestamp: a.timestamp,
  }))

  return {
    summary: {
      totalRfqs,
      publishedRfqs,
      totalQuotations,
      pendingApprovals,
      approvedQuotations,
      rejectedQuotations,
      activeVendors,
    },
    rfqsByStatus,
    quotationsByStatus,
    approvalsByStatus,
    monthlyRfqTrend,
    vendorParticipation,
    recentActivity,
    topVendors,
  }
}

function buildMonthlyTrend(dates: Date[]): MonthlyTrend[] {
  const monthMap = new Map<string, number>()

  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
  }

  return Array.from(monthMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}
