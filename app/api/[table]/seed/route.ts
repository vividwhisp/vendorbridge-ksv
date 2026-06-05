import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  requireRole,
  resolveTableName,
} from "../../../lib/api-helper";
import { getUserFromRequest } from "../../../lib/server-api-helper";
import { getTableById } from "../../../lib/config";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table: tableId } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "manage");
    const table = getTableById(tableId);
    const me = await getUserFromRequest(request);

    const samples = (table?.samples ?? []).map((s) => ({ ...s, userId: me.id }));

    if (samples.length === 0) {
      return NextResponse.json([], { status: 201 });
    }

    const m = modelFor(tableName);
    const data = await m.createManyAndReturn({
      data: samples as Prisma.ProductUncheckedCreateInput[],
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
