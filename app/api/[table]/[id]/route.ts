import { NextResponse } from "next/server";
import {
  getUserFromToken,
  handleApiError,
  prepareUpdateStatus,
  requireRole,
  resolveTableName,
} from "../../../lib/api-helper";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table: tableId, id } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "edit");
    const { supabase } = await getUserFromToken(request);
    const body = await request.json();

    const safeBody = prepareUpdateStatus(body, tableId);
    const { data, error } = await supabase
      .from(tableName)
      .update(safeBody)
      .eq("id", Number(id))
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
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
    const { supabase } = await getUserFromToken(request);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
