import { prisma } from "@/lib/prisma"

export interface PoListItem {
  id: string
  poNumber: string
  status: string
  totalAmount: number
  createdAt: Date
  quotation: {
    id: string
    vendor: { companyName: string }
    rfq: { title: string }
  }
}

export interface PoDetail {
  id: string
  poNumber: string
  status: string
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  quotation: {
    id: string
    totalAmount: number
    deliveryDays: number
    status: string
    vendor: { id: string; companyName: string; email: string; phone: string }
    rfq: { id: string; title: string; description: string }
  }
  items: {
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

export async function getPurchaseOrders(userId: string, role: string) {
  const where: Record<string, unknown> = {}

  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } })
    if (!vendor) return []
    where.quotation = { vendorId: vendor.id }
  }

  return prisma.purchaseOrder.findMany({
    where,
    include: {
      quotation: {
        select: {
          id: true,
          totalAmount: true,
          vendor: { select: { companyName: true } },
          rfq: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPurchaseOrderById(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      quotation: {
        select: {
          id: true,
          totalAmount: true,
          deliveryDays: true,
          status: true,
          vendor: { select: { id: true, companyName: true, email: true, phone: true } },
          rfq: { select: { id: true, title: true, description: true } },
        },
      },
      items: {
        select: { id: true, productName: true, quantity: true, unitPrice: true, totalPrice: true },
      },
    },
  })
}

export async function createPurchaseOrder(quotationId: string, userId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      items: { select: { productName: true, quantity: true, unitPrice: true, totalPrice: true } },
      vendor: { select: { userId: true } },
      rfq: { select: { title: true } },
      purchaseOrder: { select: { id: true } },
    },
  })

  if (!quotation) throw new Error("Quotation not found")
  if (quotation.status !== "ACCEPTED") throw new Error("Only accepted quotations can be converted to PO")
  if (quotation.purchaseOrder) throw new Error("Purchase Order already exists for this quotation")

  const poCount = await prisma.purchaseOrder.count()
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const poNumber = `PO-${dateStr}-${String(poCount + 1).padStart(4, "0")}`
  const totalAmount = quotation.items.reduce((sum, i) => sum + Number(i.totalPrice), 0)

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      quotationId: quotation.id,
      status: "PENDING",
      items: {
        create: quotation.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    },
    include: {
      quotation: {
        select: {
          totalAmount: true,
          vendor: { select: { companyName: true } },
          rfq: { select: { title: true } },
        },
      },
      items: true,
    },
  })

  await prisma.activityLog.create({
    data: { userId, entityType: "PURCHASE_ORDER", entityId: po.id, action: "PO_CREATED" },
  })

  const vendorUserId = quotation.vendor.userId
  if (vendorUserId) {
    await prisma.notification.create({
      data: {
        userId: vendorUserId,
        title: "Purchase Order Created",
        message: `A purchase order (${poNumber}) has been created for your quotation on ${quotation.rfq?.title || "RFQ"}.`,
      },
    })
  }

  return po
}

export async function updatePurchaseOrderStatus(
  id: string,
  userId: string,
  status: string
) {
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
  if (!existing) throw new Error("Purchase order not found")

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["PENDING", "CANCELLED"],
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
  }

  const allowed = validTransitions[existing.status]
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Cannot transition from ${existing.status} to ${status}`)
  }

  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: status as any },
    include: {
      quotation: {
        select: {
          totalAmount: true,
          vendor: { select: { companyName: true } },
          rfq: { select: { title: true } },
        },
      },
      items: true,
    },
  })

  await prisma.activityLog.create({
    data: { userId, entityType: "PURCHASE_ORDER", entityId: id, action: "PO_STATUS_CHANGED" },
  })

  return po
}
