import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPurchaseOrderById, updatePurchaseOrderStatus } from "@/lib/services/purchaseOrder.service"
import { canEdit, canView } from "@/lib/permissions"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canView(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const po = await getPurchaseOrderById(id)
  if (!po) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(po)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canEdit(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  try {
    const po = await updatePurchaseOrderStatus(id, session.user.id, parsed.data.status)
    return NextResponse.json(po)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update PO"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
