import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { rejectQuotation } from "@/lib/services/approval.service"
import { canApproveQuotation } from "@/lib/permissions"
import { z } from "zod"

const rejectSchema = z.object({
  remarks: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canApproveQuotation(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = rejectSchema.safeParse(body)

  try {
    const approval = await rejectQuotation(
      id,
      session.user.id,
      parsed.success ? parsed.data.remarks : undefined
    )
    return NextResponse.json(approval)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reject"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
