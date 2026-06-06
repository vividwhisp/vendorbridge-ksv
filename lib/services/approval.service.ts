import { prisma } from "@/lib/prisma"

export interface ApprovalListItem {
  id: string
  quotationId: string
  status: string
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  quotation: {
    id: string
    totalAmount: number
    deliveryDays: number
    status: string
    createdAt: Date
    rfq: { id: string; title: string }
    vendor: { id: string; companyName: string }
  }
  approvedBy: { id: string; name: string } | null
}

export interface ApprovalDetail {
  id: string
  status: string
  remarks: string | null
  createdAt: Date
  updatedAt: Date
  quotation: {
    id: string
    totalAmount: number
    deliveryDays: number
    remarks: string | null
    status: string
    createdAt: Date
    items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[]
    rfq: { id: string; title: string; description: string; deadline: Date }
    vendor: { id: string; companyName: string; email: string; phone: string }
  }
  approvedBy: { id: string; name: string; email: string } | null
}

export async function getApprovals(userId: string, role: string) {
  if (role !== "VENDOR") {
    await autoCreateApprovals()
  }

  const where: Record<string, unknown> = {}

  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } })
    if (!vendor) return []
    where.quotation = { vendorId: vendor.id }
  }

  return prisma.approval.findMany({
    where,
    include: {
      quotation: {
        include: {
          rfq: { select: { id: true, title: true } },
          vendor: { select: { id: true, companyName: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getApprovalById(id: string) {
  return prisma.approval.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          rfq: { select: { id: true, title: true, description: true, deadline: true } },
          vendor: { select: { id: true, companyName: true, email: true, phone: true } },
          items: {
            select: { id: true, productName: true, quantity: true, unitPrice: true, totalPrice: true },
          },
        },
      },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function approveQuotation(
  approvalId: string,
  userId: string,
  remarks?: string
) {
  const existing = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        include: {
          rfq: { select: { title: true } },
          vendor: { select: { companyName: true, userId: true } },
        },
      },
    },
  })
  if (!existing) throw new Error("Approval not found")
  if (existing.status !== "PENDING") throw new Error("Approval is already " + existing.status)

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approvalId },
      data: { status: "APPROVED", approvedById: userId, remarks: remarks ?? existing.remarks },
    }),
    prisma.quotation.update({
      where: { id: existing.quotationId },
      data: { status: "ACCEPTED" },
    }),
    prisma.activityLog.create({
      data: { userId, entityType: "APPROVAL", entityId: approvalId, action: "APPROVED" },
    }),
  ])

  const vendorUserId = existing.quotation.vendor.userId
  if (vendorUserId) {
    await prisma.notification.create({
      data: {
        userId: vendorUserId,
        title: "Quotation Approved",
        message: `Your quotation for ${existing.quotation.rfq.title} has been approved.`,
      },
    })
  }

  return prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        include: {
          rfq: { select: { id: true, title: true } },
          vendor: { select: { id: true, companyName: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  })
}

export async function rejectQuotation(approvalId: string, userId: string, remarks?: string) {
  const existing = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        include: {
          rfq: { select: { title: true } },
          vendor: { select: { companyName: true, userId: true } },
        },
      },
    },
  })
  if (!existing) throw new Error("Approval not found")
  if (existing.status !== "PENDING") throw new Error("Approval is already " + existing.status)

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approvalId },
      data: { status: "REJECTED", approvedById: userId, remarks: remarks ?? existing.remarks },
    }),
    prisma.quotation.update({
      where: { id: existing.quotationId },
      data: { status: "REJECTED" },
    }),
    prisma.activityLog.create({
      data: { userId, entityType: "APPROVAL", entityId: approvalId, action: "REJECTED" },
    }),
  ])

  const vendorUserId = existing.quotation.vendor.userId
  if (vendorUserId) {
    await prisma.notification.create({
      data: {
        userId: vendorUserId,
        title: "Quotation Rejected",
        message: `Your quotation for ${existing.quotation.rfq.title} has been rejected.${remarks ? ` Reason: ${remarks}` : ""}`,
      },
    })
  }

  return prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      quotation: {
        include: {
          rfq: { select: { id: true, title: true } },
          vendor: { select: { id: true, companyName: true } },
        },
      },
      approvedBy: { select: { id: true, name: true } },
    },
  })
}

async function autoCreateApprovals() {
  const quotations = await prisma.quotation.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      approval: null,
    },
    select: { id: true },
  })

  if (quotations.length === 0) return

  await prisma.approval.createMany({
    data: quotations.map((q) => ({ quotationId: q.id })),
  })
}
