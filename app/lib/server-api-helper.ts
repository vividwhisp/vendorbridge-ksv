import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

function getSupabaseForToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

function readAccessTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access_token");
  if (queryToken) return queryToken;

  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!value) continue;
    if (name === "sb-access-token") {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
    if (/^sb-.+-auth-token$/.test(name)) {
      try {
        const parsed = JSON.parse(decodeURIComponent(value)) as { access_token?: string };
        if (parsed.access_token) return parsed.access_token;
      } catch {
        try {
          const parsed = JSON.parse(value) as { access_token?: string };
          if (parsed.access_token) return parsed.access_token;
        } catch {
          return value;
        }
      }
    }
  }
  return null;
}

export async function getUserFromRequest(request: Request) {
  const token = readAccessTokenFromRequest(request);
  if (!token) throw new Error("Unauthorized");
  const supabase = getSupabaseForToken(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
  if (!dbUser) throw new Error("Unauthorized");
  return { id: dbUser.id, email: dbUser.email };
}
