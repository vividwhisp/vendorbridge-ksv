import { NextResponse } from "next/server";
import { getUserFromToken } from "../../lib/api-helper";

export async function GET(request: Request) {
  try {
    const { supabase } = await getUserFromToken(request);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,quantity,category,user_id")
      .order("id", { ascending: true });

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getUserFromToken(request);
    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .insert({ name: body.name, price: body.price, quantity: body.quantity, category: body.category || "General", user_id: user.id })
      .select("id,name,price,quantity,category,user_id")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
