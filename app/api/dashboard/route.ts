import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardData } from "@/lib/services/dashboard.service"
import { canView } from "@/lib/permissions"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canView(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const data = await getDashboardData()
  return NextResponse.json(data)
}
