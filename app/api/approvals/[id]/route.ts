import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getApprovalById } from "@/lib/services/approval.service"
import { canView } from "@/lib/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canView(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const approval = await getApprovalById(id)
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(approval)
}
