import { getSupabase } from "./supabase-client";
import { normalizeRole, type Role } from "./rbac";

const TOKEN_COOKIE = "sb-access-token";

function setTokenCookie(accessToken: string) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

async function fetchRole(userId: string): Promise<Role> {
  const { data } = await getSupabase()
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return normalizeRole(data?.role);
}

export const db = {
  async signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { user: null, error: error?.message ?? null };
    }

    if (data.session?.access_token) setTokenCookie(data.session.access_token);
    const role = await fetchRole(data.user.id);
    return {
      user: { id: data.user.id, email: data.user.email ?? email, role },
      error: null,
    };
  },

  async signUp(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return { user: null, error: error?.message ?? null };
    }

    await supabase
      .from("profiles")
      .upsert({ user_id: data.user.id, role: "user" }, { onConflict: "user_id" });

    if (data.session?.access_token) setTokenCookie(data.session.access_token);
    const role = await fetchRole(data.user.id);
    return {
      user: { id: data.user.id, email: data.user.email ?? email, role },
      error: null,
    };
  },

  async signOut() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();

    clearTokenCookie();

    if (error) {
      throw new Error(error.message);
    }
  },
};
