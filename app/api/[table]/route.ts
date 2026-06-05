import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  prepareInsertStatus,
  requireRole,
  resolveTableName,
} from "../../lib/api-helper";
import { getUserFromRequest } from "../../lib/server-api-helper";
import { Prisma } from "@prisma/client";

type Models = {
  products: typeof prisma.product;
};

function modelFor(tableName: string) {
  const models: Models = { products: prisma.product };
  const m = models[tableName as keyof Models];
  if (!m) throw new Error(`No Prisma model for table "${tableName}"`);
  return m;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table: tableId } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "view");
    const me = await getUserFromRequest(request);
    const m = modelFor(tableName);
    const rows = await m.findMany({ where: { userId: me.id }, orderBy: { id: "asc" } });
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table: tableId } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "edit");
    const me = await getUserFromRequest(request);
    const body = await request.json();

    const withStatus = prepareInsertStatus(body, tableId);
    const data = { ...withStatus, userId: me.id };
    const m = modelFor(tableName);
    const created = await m.create({ data: data as Prisma.ProductUncheckedCreateInput });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
