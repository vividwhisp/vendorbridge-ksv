import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPurchaseOrder } from "@/lib/services/purchaseOrder.service"
import { canCreate } from "@/lib/permissions"
import { z } from "zod"

const createSchema = z.object({
  quotationId: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canCreate(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 })

  try {
    const po = await createPurchaseOrder(parsed.data.quotationId, session.user.id)
    return NextResponse.json(po, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create PO"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
