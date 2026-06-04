import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabase } from "./supabase-client";
import { getTableById } from "./config";
import { hasWorkflow, validateState } from "./workflow";
import { can, normalizeRole, ROLE_HEADER, type Action, type Role } from "./rbac";

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

export function getRoleFromRequest(request: Request): Role {
  const fromHeader = request.headers.get(ROLE_HEADER);
  if (fromHeader) return normalizeRole(fromHeader);
  return "user";
}

export function requireRole(request: Request, action: Action) {
  const role = getRoleFromRequest(request);
  if (!can(role, action)) {
    throw new Error(`Forbidden: role "${role}" cannot ${action}`);
  }
  return role;
}

export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  let status = 404;
  if (message === "Unauthorized") status = 401;
  else if (message.startsWith("Forbidden")) status = 403;
  return NextResponse.json({ error: message }, { status });
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

// Normalize `status` on insert: fill default if missing, validate if present.
export function prepareInsertStatus(
  row: Record<string, unknown>,
  tableId: string,
): Record<string, unknown> {
  const table = getTableById(tableId);
  if (!table || !hasWorkflow(table)) return row;
  const check = validateState(row.status, table);
  if (!check.ok) throw new Error(check.reason);
  return { ...row, status: check.value };
}

// Validate `status` on update if present.
export function prepareUpdateStatus(
  body: Record<string, unknown>,
  tableId: string,
): Record<string, unknown> {
  if (!("status" in body)) return body;
  const table = getTableById(tableId);
  if (!table || !hasWorkflow(table)) return body;
  const check = validateState(body.status, table);
  if (!check.ok) throw new Error(check.reason);
  return { ...body, status: check.value };
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
