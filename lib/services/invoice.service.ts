import { prisma } from "@/lib/prisma"

export interface InvoiceListItem {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  tax: number
  totalAmount: number
  createdAt: Date
  purchaseOrder: {
    poNumber: string
    quotation: {
      vendor: { companyName: string }
      rfq: { title: string }
    }
  }
}

export interface InvoiceDetail {
  id: string
  invoiceNumber: string
  status: string
  subtotal: number
  tax: number
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  purchaseOrder: {
    id: string
    poNumber: string
    quotation: {
      vendor: { companyName: string; email: string; phone: string; address: string }
      rfq: { title: string }
    }
  }
  items: {
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
}

export async function getInvoices(userId: string, role: string) {
  const where: Record<string, unknown> = {}

  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({ where: { userId }, select: { id: true } })
    if (!vendor) return []
    where.purchaseOrder = { quotation: { vendorId: vendor.id } }
  }

  return prisma.invoice.findMany({
    where,
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          quotation: {
            select: {
              vendor: { select: { companyName: true } },
              rfq: { select: { title: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getInvoiceById(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          quotation: {
            select: {
              vendor: { select: { companyName: true, email: true, phone: true, address: true } },
              rfq: { select: { title: true } },
            },
          },
        },
      },
      items: {
        select: { id: true, productName: true, quantity: true, unitPrice: true, totalPrice: true },
      },
    },
  })
}

export async function createInvoice(purchaseOrderId: string, tax: number, userId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      items: { select: { productName: true, quantity: true, unitPrice: true, totalPrice: true } },
      quotation: {
        select: {
          vendor: { select: { userId: true, companyName: true } },
          rfq: { select: { title: true } },
        },
      },
    },
  })

  if (!po) throw new Error("Purchase order not found")
  if (po.status === "DRAFT" || po.status === "CANCELLED") throw new Error("Cannot create invoice from a draft or cancelled PO")

  const subtotal = po.items.reduce((sum, i) => sum + Number(i.totalPrice), 0)
  const totalAmount = subtotal + Number(tax)

  const invCount = await prisma.invoice.count()
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const invoiceNumber = `INV-${dateStr}-${String(invCount + 1).padStart(4, "0")}`

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      purchaseOrderId: po.id,
      subtotal,
      tax: Number(tax),
      totalAmount,
      status: "DRAFT",
      items: {
        create: po.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          quotation: {
            select: {
              vendor: { select: { companyName: true } },
              rfq: { select: { title: true } },
            },
          },
        },
      },
      items: true,
    },
  })

  await prisma.activityLog.create({
    data: { userId, entityType: "INVOICE", entityId: invoice.id, action: "INVOICE_CREATED" },
  })

  const vendorUserId = po.quotation.vendor.userId
  if (vendorUserId) {
    await prisma.notification.create({
      data: {
        userId: vendorUserId,
        title: "Invoice Created",
        message: `An invoice (${invoiceNumber}) has been generated for purchase order ${po.poNumber}.`,
      },
    })
  }

  const procurementUsers = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROCUREMENT_OFFICER"] } },
    select: { id: true },
  })
  for (const u of procurementUsers) {
    if (u.id === vendorUserId) continue
    await prisma.notification.create({
      data: {
        userId: u.id,
        title: "Invoice Created",
        message: `Invoice ${invoiceNumber} has been generated for PO ${po.poNumber} from ${po.quotation.vendor.companyName}.`,
      },
    })
  }

  return invoice
}

export async function updateInvoiceStatus(id: string, userId: string, status: string) {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          quotation: {
            select: {
              vendor: { select: { userId: true, companyName: true } },
            },
          },
        },
      },
    },
  })
  if (!existing) throw new Error("Invoice not found")

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["PAID", "OVERDUE", "CANCELLED"],
    PAID: [],
    OVERDUE: ["PAID", "WRITTEN_OFF", "CANCELLED"],
    CANCELLED: [],
    WRITTEN_OFF: [],
  }

  const allowed = validTransitions[existing.status]
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Cannot transition from ${existing.status} to ${status}`)
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: status as any },
    include: {
      purchaseOrder: {
        select: {
          poNumber: true,
          quotation: {
            select: {
              vendor: { select: { companyName: true, email: true, phone: true, address: true } },
              rfq: { select: { title: true } },
            },
          },
        },
      },
      items: true,
    },
  })

  await prisma.activityLog.create({
    data: { userId, entityType: "INVOICE", entityId: id, action: "INVOICE_STATUS_CHANGED" },
  })

  const vendorUserId = existing.purchaseOrder.quotation.vendor.userId
  const vendorCompany = existing.purchaseOrder.quotation.vendor.companyName

  if (status === "SENT" && vendorUserId) {
    await prisma.notification.create({
      data: {
        userId: vendorUserId,
        title: "Invoice Sent",
        message: `Invoice ${existing.invoiceNumber} for PO ${existing.purchaseOrder.poNumber} has been sent.`,
      },
    })
  }

  if (status === "PAID") {
    if (vendorUserId) {
      await prisma.notification.create({
        data: {
          userId: vendorUserId,
          title: "Invoice Paid",
          message: `Invoice ${existing.invoiceNumber} for PO ${existing.purchaseOrder.poNumber} has been marked as paid.`,
        },
      })
    }
    const procurementUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "PROCUREMENT_OFFICER"] } },
      select: { id: true },
    })
    for (const u of procurementUsers) {
      if (u.id === vendorUserId) continue
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: "Invoice Paid",
          message: `Invoice ${existing.invoiceNumber} from ${vendorCompany} has been marked as paid.`,
        },
      })
    }
  }

  return invoice
}
