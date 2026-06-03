import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-client";
import type { Database } from "./supabase-client";
import type { Product } from "../types";

function getApiSupabase(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient<Database, "public">(url, key, {
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

export async function apiGetAll(): Promise<Product[]> {
  const token = await getToken();
  const res = await fetch("/api/products", { headers: headers(token!) });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiInsert(data: Omit<Product, "id" | "user_id">): Promise<Product> {
  const token = await getToken();
  const res = await fetch("/api/products", {
    method: "POST",
    headers: headers(token!),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiUpdate(id: number, data: Partial<Omit<Product, "id" | "user_id">>): Promise<Product> {
  const token = await getToken();
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: headers(token!),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function apiRemove(id: number): Promise<void> {
  const token = await getToken();
  const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: headers(token!) });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function apiSeed(): Promise<Product[]> {
  const token = await getToken();
  const res = await fetch("/api/products/seed", {
    method: "POST",
    headers: headers(token!),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
