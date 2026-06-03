import { NextResponse } from "next/server";
import { getUserFromToken } from "../../../lib/api-helper";

const starterProducts = [
  { name: "MacBook Air M3", price: 99999, quantity: 12, category: "Laptops" },
  { name: "iPhone 15 Pro", price: 134999, quantity: 3, category: "Phones" },
  { name: "AirPods Pro", price: 24999, quantity: 89, category: "Audio" },
  { name: "iPad Mini", price: 49999, quantity: 7, category: "Tablets" },
  { name: "Apple Watch S9", price: 41999, quantity: 2, category: "Wearables" },
  { name: "Magic Keyboard", price: 11999, quantity: 45, category: "Accessories" },
];

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
