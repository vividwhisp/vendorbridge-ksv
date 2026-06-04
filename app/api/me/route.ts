import { NextResponse } from "next/server";
import { getUserFromToken, handleApiError } from "../../lib/api-helper";
import { normalizeRole } from "../../lib/rbac";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getUserFromToken(request);
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: normalizeRole(data?.role),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
