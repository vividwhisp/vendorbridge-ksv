import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createInvoice } from "@/lib/services/invoice.service"
import { canCreate } from "@/lib/permissions"
import { z } from "zod"

const createSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase order is required"),
  tax: z.coerce.number().min(0, "Tax must be a non-negative number"),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canCreate(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })

  try {
    const invoice = await createInvoice(parsed.data.purchaseOrderId, parsed.data.tax, session.user.id)
    return NextResponse.json(invoice, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invoice"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
