import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../lib/api-helper";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await getUserFromToken(request);
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", Number(id))
      .select("id,name,price,quantity,category,user_id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await getUserFromToken(request);
    const { id } = await params;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", Number(id));

    if (error) throw new Error(error.message);
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
