import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getQuotationById, updateQuotation } from "@/lib/services/quotation.service"
import { updateQuotationSchema } from "@/app/dashboard/quotations/schema"
import { canSubmitQuotation } from "@/lib/permissions"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const quotation = await getQuotationById(id)
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(quotation)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canSubmitQuotation(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const parsed = updateQuotationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const quotation = await updateQuotation(id, session.user.id, parsed.data)
    return NextResponse.json(quotation)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update quotation"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
