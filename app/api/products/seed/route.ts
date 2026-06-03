import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../lib/api-helper";
import { starterProducts } from "../../../lib/seed-data";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getUserFromToken(request);

    const { data, error } = await supabase
      .from("products")
      .insert(starterProducts.map((p) => ({ ...p, user_id: user.id })))
      .select("id,name,price,quantity,category,user_id");

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? [], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
