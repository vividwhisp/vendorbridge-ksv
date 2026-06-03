import { NextResponse } from "next/server";
import { getUserFromToken, resolveTableName } from "../../../lib/api-helper";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table: tableId, id } = await params;
    const tableName = resolveTableName(tableId);
    const { supabase } = await getUserFromToken(request);
    const body = await request.json();

    const { data, error } = await supabase
      .from(tableName)
      .update(body)
      .eq("id", Number(id))
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ table: string; id: string }> },
) {
  try {
    const { table: tableId, id } = await params;
    const tableName = resolveTableName(tableId);
    const { supabase } = await getUserFromToken(request);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 404 });
  }
}
