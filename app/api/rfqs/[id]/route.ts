import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRfqById } from "@/features/rfq/services/rfq-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const rfq = await getRfqById(id)

  if (!rfq) {
    return NextResponse.json({ error: "RFQ not found" }, { status: 404 })
  }

  return NextResponse.json(rfq)
}
