import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-client";
import { getTableById } from "./config";

function getApiSupabase(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  // Permissive client: we don't know the table types at compile time
  // (the Dashboard accepts any number of tables via config). RLS is still
  // enforced server-side by Supabase using the user's JWT.
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

export async function getUserFromToken(request: Request) {
  const auth = request.headers.get("Authorization");
  const token = auth?.replace("Bearer ", "");
  if (!token) throw new Error("Unauthorized");
  const supabase = getApiSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");
  return { user: data.user, supabase };
}

async function getToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// Returns the tableName (DB name) for a given config id, or throws.
export function resolveTableName(id: string): string {
  const t = getTableById(id);
  if (!t) throw new Error(`Unknown table: ${id}`);
  return t.tableName ?? t.id;
}

export async function apiGetAll(tableId: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  const res = await fetch(`/api/${tableId}`, { headers: headers(token!) });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiInsert(tableId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = await getToken();
  const res = await fetch(`/api/${tableId}`, {
    method: "POST",
    headers: headers(token!),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiUpdate(tableId: string, id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = await getToken();
  const res = await fetch(`/api/${tableId}/${id}`, {
    method: "PUT",
    headers: headers(token!),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiRemove(tableId: string, id: number): Promise<void> {
  const token = await getToken();
  const res = await fetch(`/api/${tableId}/${id}`, { method: "DELETE", headers: headers(token!) });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function apiSeed(tableId: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  const res = await fetch(`/api/${tableId}/seed`, {
    method: "POST",
    headers: headers(token!),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
