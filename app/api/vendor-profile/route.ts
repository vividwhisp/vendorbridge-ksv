import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const vendorProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  gstNumber: z.string().min(1, "GST number is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  category: z.enum(["MATERIALS", "SERVICES", "IT", "CONSULTING", "TRANSPORTATION", "OTHER"]),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendor = await prisma.vendor.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(vendor ?? { profileExists: false })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = vendorProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.vendor.findUnique({ where: { userId: session.user.id } })
  if (existing) return NextResponse.json({ error: "Vendor profile already exists" }, { status: 409 })

  const vendor = await prisma.vendor.create({
    data: { ...parsed.data, userId: session.user.id, status: "ACTIVE" },
  })

  return NextResponse.json(vendor, { status: 201 })
}
