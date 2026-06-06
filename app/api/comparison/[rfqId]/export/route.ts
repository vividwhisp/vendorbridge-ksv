import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRfqComparisonData, buildExportRows, generateCsv } from "@/lib/services/comparison.service"
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
  const format = url.searchParams.get("format") ?? "csv"

  try {
    const data = await getRfqComparisonData(rfqId)
    const rows = buildExportRows(data.rfq.items, data.quotations, data.summary)

    if (format === "csv") {
      const csv = generateCsv(rows)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="comparison-${rfqId}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
