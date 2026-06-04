import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole, ROLE_HEADER } from "./app/lib/rbac";

const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/profile", "/api/me"];
const ADMIN_API_PREFIXES = ["/api/[table]"];

const COOKIE_NAMES = [
  "sb-access-token",
  "supabase-auth-token",
  "sb127-auth-token",
];

function readAccessToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  for (const name of COOKIE_NAMES) {
    const v = request.cookies.get(name)?.value;
    if (!v) continue;
    try {
      const parsed = JSON.parse(v) as { access_token?: string };
      if (parsed.access_token) return parsed.access_token;
    } catch {
      return v;
    }
  }
  return null;
}

function getSupabaseForToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isWriteApi =
    (path.startsWith("/api/") && !path.startsWith("/api/chat") && !path.startsWith("/api/me")) ||
    ADMIN_API_PREFIXES.some((p) => path.includes(p));

  const token = readAccessToken(request);

  if (!token) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", path);
      return NextResponse.redirect(url);
    }
    if (isWriteApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const supabase = getSupabaseForToken(token);
  const { data: userResult } = await supabase.auth.getUser(token);
  const user = userResult?.user;

  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = normalizeRole(profile?.role);

  const headers = new Headers(request.headers);
  headers.set(ROLE_HEADER, role);
  headers.set("x-user-id", user.id);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
