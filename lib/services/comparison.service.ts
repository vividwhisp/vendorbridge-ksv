import { prisma } from "@/lib/prisma"

export interface ComparisonQuotationItem {
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ComparisonQuotation {
  id: string
  vendorId: string
  vendorName: string
  totalAmount: number
  deliveryDays: number
  itemCount: number
  status: string
  createdAt: string
  items: ComparisonQuotationItem[]
}

export interface ComparisonSummary {
  totalQuotations: number
  lowestBid: number
  highestBid: number
  averageBid: number
  lowestPriceVendor: { id: string; name: string; amount: number } | null
  fastestDeliveryVendor: { id: string; name: string; days: number } | null
  recommendedVendor: { id: string; name: string; score: number } | null
}

export interface ComparisonData {
  rfq: {
    id: string
    title: string
    description: string
    status: string
    deadline: string
    items: { id: string; productName: string; quantity: number; specification: string | null }[]
  }
  quotations: ComparisonQuotation[]
  summary: ComparisonSummary
}

export interface QuotationExportRow {
  vendorName: string
  totalAmount: number
  deliveryDays: number
  itemCount: number
  status: string
  submissionDate: string
  lowestPrice: string
  fastestDelivery: string
  recommended: string
  [key: string]: string | number
}

async function getRfqComparisonData(
  rfqId: string,
  filters?: {
    status?: string
    vendorId?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
  }
): Promise<ComparisonData> {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: { items: true },
  })
  if (!rfq) throw new Error("RFQ not found")

  const where: Record<string, unknown> = { rfqId }
  if (filters?.status) where.status = filters.status
  if (filters?.vendorId) where.vendorId = filters.vendorId
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    const amountFilter: Record<string, number> = {}
    if (filters.minPrice !== undefined) amountFilter.gte = filters.minPrice
    if (filters.maxPrice !== undefined) amountFilter.lte = filters.maxPrice
    where.totalAmount = amountFilter
  }

  let orderBy: Record<string, string> = { createdAt: "desc" }
  if (filters?.sort === "price_asc") orderBy = { totalAmount: "asc" }
  else if (filters?.sort === "price_desc") orderBy = { totalAmount: "desc" }
  else if (filters?.sort === "delivery_asc") orderBy = { deliveryDays: "asc" }
  else if (filters?.sort === "newest") orderBy = { createdAt: "desc" }

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      vendor: { select: { companyName: true } },
      items: {
        select: { productName: true, quantity: true, unitPrice: true, totalPrice: true },
      },
    },
    orderBy,
  })

  const mappedQuotations: ComparisonQuotation[] = quotations.map((q) => ({
    id: q.id,
    vendorId: q.vendorId,
    vendorName: q.vendor.companyName,
    totalAmount: Number(q.totalAmount),
    deliveryDays: q.deliveryDays,
    itemCount: q.items.length,
    status: q.status,
    createdAt: q.createdAt.toISOString(),
    items: q.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  }))

  const summary = computeSummary(mappedQuotations)

  return {
    rfq: {
      id: rfq.id,
      title: rfq.title,
      description: rfq.description,
      status: rfq.status,
      deadline: rfq.deadline.toISOString(),
      items: rfq.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: i.quantity,
        specification: i.specification,
      })),
    },
    quotations: mappedQuotations,
    summary,
  }
}

function computeSummary(quotations: ComparisonQuotation[]): ComparisonSummary {
  const totalQuotations = quotations.length

  if (totalQuotations === 0) {
    return {
      totalQuotations: 0,
      lowestBid: 0,
      highestBid: 0,
      averageBid: 0,
      lowestPriceVendor: null,
      fastestDeliveryVendor: null,
      recommendedVendor: null,
    }
  }

  const amounts = quotations.map((q) => q.totalAmount)
  const lowestBid = Math.min(...amounts)
  const highestBid = Math.max(...amounts)
  const averageBid = amounts.reduce((s, v) => s + v, 0) / totalQuotations

  const lowestPriceQuotation = quotations.reduce((min, q) =>
    q.totalAmount < min.totalAmount ? q : min
  )

  const fastestDeliveryQuotation = quotations.reduce((min, q) =>
    q.deliveryDays < min.deliveryDays ? q : min
  )

  const sortedByPrice = [...quotations].sort((a, b) => a.totalAmount - b.totalAmount)
  const sortedByDelivery = [...quotations].sort((a, b) => a.deliveryDays - b.deliveryDays)

  const scored = quotations.map((q) => {
    const priceRank = sortedByPrice.findIndex((s) => s.id === q.id) + 1
    const deliveryRank = sortedByDelivery.findIndex((s) => s.id === q.id) + 1
    const score = 0.7 * priceRank + 0.3 * deliveryRank
    return { ...q, score }
  })

  const bestScored = scored.reduce((best, q) => (q.score < best.score ? q : best))

  return {
    totalQuotations,
    lowestBid,
    highestBid,
    averageBid: Math.round(averageBid * 100) / 100,
    lowestPriceVendor: {
      id: lowestPriceQuotation.id,
      name: lowestPriceQuotation.vendorName,
      amount: lowestPriceQuotation.totalAmount,
    },
    fastestDeliveryVendor: {
      id: fastestDeliveryQuotation.id,
      name: fastestDeliveryQuotation.vendorName,
      days: fastestDeliveryQuotation.deliveryDays,
    },
    recommendedVendor: {
      id: bestScored.id,
      name: bestScored.vendorName,
      score: Math.round(bestScored.score * 100) / 100,
    },
  }
}

function buildExportRows(
  rfqItems: ComparisonData["rfq"]["items"],
  quotations: ComparisonQuotation[],
  summary: ComparisonSummary
): QuotationExportRow[] {
  return quotations.map((q) => {
    const row: QuotationExportRow = {
      vendorName: q.vendorName,
      totalAmount: q.totalAmount,
      deliveryDays: q.deliveryDays,
      itemCount: q.itemCount,
      status: q.status,
      submissionDate: new Date(q.createdAt).toLocaleDateString(),
      lowestPrice: summary.lowestPriceVendor?.id === q.id ? "Yes" : "",
      fastestDelivery: summary.fastestDeliveryVendor?.id === q.id ? "Yes" : "",
      recommended: summary.recommendedVendor?.id === q.id ? "Yes" : "",
    }

    for (const rfqItem of rfqItems) {
      const match = q.items.find(
        (i) => i.productName.toLowerCase() === rfqItem.productName.toLowerCase()
      )
      row[`price_${rfqItem.productName}`] = match ? match.unitPrice : 0
    }

    return row
  })
}

function generateCsv(rows: QuotationExportRow[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(
      headers.map((h) => {
        const val = row[h]
        const str = String(val)
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(",")
    )
  }
  return lines.join("\n")
}

export {
  getRfqComparisonData,
  computeSummary,
  buildExportRows,
  generateCsv,
}
