import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  prepareUpdateStatus,
  requireRole,
  resolveTableName,
} from "../../../lib/api-helper";
import { getUserFromRequest } from "../../../lib/server-api-helper";
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table: tableId, id } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "edit");
    const me = await getUserFromRequest(request);
    const body = await request.json();
    const safeBody = prepareUpdateStatus(body, tableId);
    const numericId = Number(id);
    const m = modelFor(tableName);
    const updated = await m.update({
      where: { id: numericId, userId: me.id },
      data: safeBody as Prisma.ProductUpdateInput,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table: tableId, id } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "delete");
    const me = await getUserFromRequest(request);
    const numericId = Number(id);
    const m = modelFor(tableName);
    await m.delete({ where: { id: numericId, userId: me.id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
