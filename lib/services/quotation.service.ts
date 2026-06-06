import { prisma } from "@/lib/prisma"

export async function getPublishedRfqs() {
  return prisma.rFQ.findMany({
    where: { status: "PUBLISHED" },
    include: { items: true, createdBy: { select: { name: true } } },
    orderBy: { deadline: "asc" },
  })
}

export async function getRfqWithItems(id: string) {
  return prisma.rFQ.findUnique({
    where: { id },
    include: { items: true },
  })
}

export async function getQuotations(userId: string, role: string) {
  const where: Record<string, unknown> = {}

  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } })
    if (!vendor) return []
    where.vendorId = vendor.id
  }

  return prisma.quotation.findMany({
    where,
    include: {
      rfq: { select: { title: true } },
      vendor: { select: { companyName: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getQuotationById(id: string) {
  return prisma.quotation.findUnique({
    where: { id },
    include: {
      rfq: { include: { items: true } },
      vendor: { select: { companyName: true, email: true, phone: true } },
      items: true,
    },
  })
}

async function getOfficersAndManagers() {
  return prisma.user.findMany({
    where: { role: { in: ["PROCUREMENT_OFFICER", "MANAGER"] } },
    select: { id: true },
  })
}

export async function createQuotation(data: {
  rfqId: string
  vendorId: string
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[]
  deliveryDays: number
  remarks?: string
  status: string
  userId: string
}) {
  const totalAmount = data.items.reduce((sum, i) => sum + i.totalPrice, 0)

  const quotation = await prisma.quotation.create({
    data: {
      rfqId: data.rfqId,
      vendorId: data.vendorId,
      totalAmount,
      deliveryDays: data.deliveryDays,
      remarks: data.remarks ?? null,
      status: data.status as any,
      items: { create: data.items },
    },
    include: { items: true, rfq: { select: { title: true } } },
  })

  await prisma.activityLog.create({
    data: {
      userId: data.userId,
      entityType: "QUOTATION",
      entityId: quotation.id,
      action: data.status === "SUBMITTED" ? "QUOTATION_SUBMITTED" : "QUOTATION_SUBMITTED" as any,
    },
  })

  if (data.status === "SUBMITTED") {
    const recipients = await getOfficersAndManagers()
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        title: "Quotation Submitted",
        message: `A quotation has been submitted for ${quotation.rfq.title}`,
      })),
    })
  }

  return quotation
}

export async function updateQuotation(
  id: string,
  userId: string,
  data: {
    items?: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[]
    deliveryDays?: number
    remarks?: string
    status?: string
  }
) {
  const existing = await prisma.quotation.findUnique({ where: { id }, include: { items: true } })
  if (!existing) throw new Error("Quotation not found")
  if (existing.status !== "DRAFT") throw new Error("Only DRAFT quotations can be edited")

  const updateData: Record<string, unknown> = {}
  if (data.deliveryDays !== undefined) updateData.deliveryDays = data.deliveryDays
  if (data.remarks !== undefined) updateData.remarks = data.remarks
  if (data.status !== undefined) updateData.status = data.status

  if (data.items) {
    const totalAmount = data.items.reduce((sum, i) => sum + i.totalPrice, 0)
    updateData.totalAmount = totalAmount

    await prisma.quotationItem.deleteMany({ where: { quotationId: id } })
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      ...updateData,
      items: data.items ? { create: data.items } : undefined,
    } as any,
    include: { items: true, rfq: { select: { title: true } } },
  })

  await prisma.activityLog.create({
    data: {
      userId,
      entityType: "QUOTATION",
      entityId: id,
      action: data.status === "SUBMITTED" ? "QUOTATION_SUBMITTED" : "QUOTATION_SUBMITTED" as any,
    },
  })

  if (data.status === "SUBMITTED") {
    const recipients = await getOfficersAndManagers()
    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        title: "Quotation Submitted",
        message: `A quotation has been submitted for ${quotation.rfq.title}`,
      })),
    })
  }

  return quotation
}
