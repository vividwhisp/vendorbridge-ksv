import { NextResponse } from "next/server";
import { getUserFromToken, handleApiError, requireRole, resolveTableName } from "../../../lib/api-helper";
import { getTableById } from "../../../lib/config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  try {
    const { table: tableId } = await params;
    const tableName = resolveTableName(tableId);
    requireRole(request, "manage");
    const table = getTableById(tableId);
    const { user, supabase } = await getUserFromToken(request);

    const samples = (table?.samples ?? []).map((s) => ({ ...s, user_id: user.id }));

    if (samples.length === 0) {
      return NextResponse.json([], { status: 201 });
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(samples)
      .select("*");

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? [], { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
