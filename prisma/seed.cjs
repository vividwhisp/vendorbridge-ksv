const { PrismaClient } = require("@prisma/client")
const { PrismaLibSql } = require("@prisma/adapter-libsql")
const bcrypt = require("bcryptjs")

const url = process.env.DATABASE_URL || "file:./dev.db"
const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.notification.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.rFQItem.deleteMany()
  await prisma.rFQ.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.user.deleteMany()

  const admin = await prisma.user.create({
    data: { name: "Admin", email: "admin@vendorbrige.com", passwordHash: bcrypt.hashSync("admin123", 10), role: "ADMIN" },
  })
  const officer = await prisma.user.create({
    data: { name: "Procurement Officer", email: "officer@vendorbrige.com", passwordHash: bcrypt.hashSync("officer123", 10), role: "PROCUREMENT_OFFICER" },
  })
  const manager = await prisma.user.create({
    data: { name: "Manager", email: "manager@vendorbrige.com", passwordHash: bcrypt.hashSync("manager123", 10), role: "MANAGER" },
  })
  const vendorUser = await prisma.user.create({
    data: { name: "Vendor User", email: "vendor@vendorbrige.com", passwordHash: bcrypt.hashSync("vendor123", 10), role: "VENDOR" },
  })

  const v1 = await prisma.vendor.create({
    data: { companyName: "TechSupply Co.", gstNumber: "GST12345678", email: "info@techsupply.com", phone: "+91-9876543210", address: "Mumbai, India", category: "IT", status: "ACTIVE" },
  })
  const v2 = await prisma.vendor.create({
    data: { companyName: "BuildMart Ltd.", gstNumber: "GST87654321", email: "sales@buildmart.com", phone: "+91-9876543211", address: "Delhi, India", category: "MATERIALS", status: "ACTIVE" },
  })

  const rfq1 = await prisma.rFQ.create({
    data: {
      title: "Laptop Procurement Q3",
      description: "Need 50 laptops for engineering team",
      deadline: new Date("2026-07-15"),
      status: "PUBLISHED",
      createdById: officer.id,
      items: {
        create: [
          { productName: "MacBook Air M3", quantity: 30, specification: "16GB RAM, 512GB SSD" },
          { productName: "ThinkPad X1", quantity: 20, specification: "16GB RAM, 512GB SSD" },
        ],
      },
    },
  })

  const rfq2 = await prisma.rFQ.create({
    data: {
      title: "Office Stationery",
      description: "Annual stationery supply for all departments",
      deadline: new Date("2026-08-01"),
      status: "PUBLISHED",
      createdById: officer.id,
      items: {
        create: [
          { productName: "A4 Paper", quantity: 500, specification: "75 GSM, 500 sheets per pack" },
          { productName: "Printer Toner", quantity: 50, specification: "HP LaserJet compatible" },
        ],
      },
    },
  })

  const q1 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: v1.id,
      totalAmount: 4500000,
      deliveryDays: 15,
      remarks: "Includes 1 year warranty",
      status: "SUBMITTED",
      items: {
        create: [
          { productName: "MacBook Air M3", quantity: 30, unitPrice: 120000, totalPrice: 3600000 },
          { productName: "ThinkPad X1", quantity: 20, unitPrice: 45000, totalPrice: 900000 },
        ],
      },
    },
  })

  await prisma.approval.create({
    data: {
      quotationId: q1.id,
      approvedById: manager.id,
      status: "APPROVED",
      remarks: "Budget approved for Q3",
    },
  })

  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-001",
      quotationId: q1.id,
      status: "CONFIRMED",
      items: {
        create: [
          { productName: "MacBook Air M3", quantity: 30, unitPrice: 120000, totalPrice: 3600000 },
          { productName: "ThinkPad X1", quantity: 20, unitPrice: 45000, totalPrice: 900000 },
        ],
      },
    },
  })

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      purchaseOrderId: po1.id,
      subtotal: 4500000,
      tax: 810000,
      totalAmount: 5310000,
      status: "SENT",
      items: {
        create: [
          { productName: "MacBook Air M3", quantity: 30, unitPrice: 120000, totalPrice: 3600000 },
          { productName: "ThinkPad X1", quantity: 20, unitPrice: 45000, totalPrice: 900000 },
        ],
      },
    },
  })

  await prisma.activityLog.createMany({
    data: [
      { userId: officer.id, entityType: "RFQ", entityId: rfq1.id, action: "CREATED" },
      { userId: officer.id, entityType: "RFQ", entityId: rfq1.id, action: "PUBLISHED" },
      { userId: vendorUser.id, entityType: "QUOTATION", entityId: q1.id, action: "SUBMITTED" },
      { userId: manager.id, entityType: "QUOTATION", entityId: q1.id, action: "APPROVED" },
    ],
  })

  await prisma.notification.createMany({
    data: [
      { userId: manager.id, title: "Quotation Submitted", message: `TechSupply Co. submitted a quotation for ${rfq1.title}` },
      { userId: officer.id, title: "Quotation Approved", message: `Your quotation for ${rfq1.title} has been approved` },
      { userId: vendorUser.id, title: "Purchase Order Generated", message: `PO ${po1.poNumber} has been generated for your quotation` },
    ],
  })

  console.log("Seed complete!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
