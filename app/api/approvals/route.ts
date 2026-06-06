import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getApprovals } from "@/lib/services/approval.service"
import { canView } from "@/lib/permissions"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canView(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const approvals = await getApprovals(session.user.id, session.user.role)
  return NextResponse.json(approvals)
}
