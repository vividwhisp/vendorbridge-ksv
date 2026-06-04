import { NextResponse } from "next/server";
import {
  getUserFromToken,
  handleApiError,
  prepareInsertStatus,
  requireRole,
  resolveTableName,
} from "../../lib/api-helper";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table: tableId } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "view");
    const { supabase } = await getUserFromToken(request);
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
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
    const { user, supabase } = await getUserFromToken(request);
    const body = await request.json();

    const withStatus = prepareInsertStatus(body, tableId);
    const row = { ...withStatus, user_id: user.id };
    const { data, error } = await supabase
      .from(tableName)
      .insert(row)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
