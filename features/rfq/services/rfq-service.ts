import { prisma } from "@/lib/prisma"
import type { RfqListItem, RfqDetail, RfqFilters } from "@/features/rfq/types/rfq-types"

export async function getRfqs(filters: RfqFilters): Promise<RfqListItem[]> {
  const where: Record<string, unknown> = {}

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status
  }

  if (filters.search) {
    where.title = { contains: filters.search }
  }

  const rfqs = await prisma.rFQ.findMany({
    where,
    include: {
      createdBy: { select: { name: true } },
      items: { select: { id: true } },
    },
    orderBy: { deadline: filters.sort === "asc" ? "asc" : "desc" },
  })

  return rfqs.map((rfq) => ({
    id: rfq.id,
    title: rfq.title,
    status: rfq.status as RfqListItem["status"],
    deadline: rfq.deadline.toISOString(),
    itemCount: rfq.items.length,
    createdBy: rfq.createdBy.name,
    createdAt: rfq.createdAt.toISOString(),
  }))
}

export async function getRfqById(id: string): Promise<RfqDetail | null> {
  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      items: true,
    },
  })

  if (!rfq) return null

  return {
    id: rfq.id,
    title: rfq.title,
    description: rfq.description,
    status: rfq.status as RfqDetail["status"],
    deadline: rfq.deadline.toISOString(),
    createdBy: { name: rfq.createdBy.name, email: rfq.createdBy.email },
    createdAt: rfq.createdAt.toISOString(),
    updatedAt: rfq.updatedAt.toISOString(),
    items: rfq.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      quantity: i.quantity,
      specification: i.specification,
    })),
  }
}

export async function createRfq(data: {
  title: string
  description: string
  deadline: string
  items: { productName: string; quantity: number; specification?: string }[]
  createdById: string
}) {
  const rfq = await prisma.rFQ.create({
    data: {
      title: data.title,
      description: data.description,
      deadline: new Date(data.deadline),
      status: "DRAFT",
      createdById: data.createdById,
      items: {
        create: data.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          specification: item.specification ?? null,
        })),
      },
    },
    include: {
      items: true,
      createdBy: { select: { name: true } },
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: data.createdById,
      entityType: "RFQ",
      entityId: rfq.id,
      action: "RFQ_CREATED",
    },
  })

  return rfq
}
