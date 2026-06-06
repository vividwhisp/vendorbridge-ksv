import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRfqs, createRfq } from "@/features/rfq/services/rfq-service"
import { createRfqSchema } from "@/features/rfq/schemas/rfq-schema"
import { canCreateRFQ } from "@/lib/permissions"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filters = {
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: (searchParams.get("sort") ?? "desc") as "asc" | "desc",
  }

  const rfqs = await getRfqs(filters)
  return NextResponse.json({ rfqs, total: rfqs.length })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!canCreateRFQ(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createRfqSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const rfq = await createRfq({
      ...parsed.data,
      createdById: session.user.id,
    })

    return NextResponse.json(rfq, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
