import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createQuotation, getQuotations } from "@/lib/services/quotation.service"
import { createQuotationSchema } from "@/app/dashboard/quotations/schema"
import { canSubmitQuotation } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const quotations = await getQuotations(session.user.id, session.user.role)
  return NextResponse.json(quotations)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canSubmitQuotation(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = createQuotationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const vendor = await prisma.vendor.findUnique({ where: { userId: session.user.id } })
  if (!vendor)
    return NextResponse.json({ error: "No vendor profile linked to your account" }, { status: 400 })

  const quotation = await createQuotation({
    ...parsed.data,
    vendorId: vendor.id,
    userId: session.user.id,
  })
  return NextResponse.json(quotation, { status: 201 })
}
