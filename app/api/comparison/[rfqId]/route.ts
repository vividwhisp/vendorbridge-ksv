import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRfqComparisonData } from "@/lib/services/comparison.service"
import { canCompareQuotations } from "@/lib/permissions"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ rfqId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!canCompareQuotations(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { rfqId } = await params
  const url = new URL(_request.url)

  const filters = {
    status: url.searchParams.get("status") ?? undefined,
    vendorId: url.searchParams.get("vendorId") ?? undefined,
    minPrice: url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined,
    maxPrice: url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  }

  try {
    const data = await getRfqComparisonData(rfqId, filters)

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        entityType: "COMPARISON",
        entityId: rfqId,
        action: "COMPARISON_VIEWED",
      },
    })

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load comparison"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
