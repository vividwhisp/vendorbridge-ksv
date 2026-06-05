import { NextResponse } from "next/server";
import { getTableById } from "./config";
import { hasWorkflow, validateState } from "./workflow";
import { can, normalizeRole, ROLE_HEADER, type Action, type Role } from "./rbac";

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

function isCorruptSessionError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = (err as { message?: string }).message ?? "";
  return /Invalid Refresh Token|Refresh Token Not Found/i.test(msg);
}

function clearClientAuth() {
  if (typeof document === "undefined") return;
  for (const name of Array.from(document.cookie.split(";").map((c) => c.split("=")[0].trim()))) {
    if (name === "sb-access-token" || /^sb-.+-auth-token$/.test(name)) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  }
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && /^sb-.+-auth-token$/.test(k)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

async function getToken(): Promise<string | null> {
  const { getSupabase } = await import("./supabase-client");
  try {
    const { data, error } = await getSupabase().auth.getSession();
    if (error && isCorruptSessionError(error)) {
      clearClientAuth();
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (err) {
    if (isCorruptSessionError(err)) {
      clearClientAuth();
      return null;
    }
    return null;
  }
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function notifyUnauthorized() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function resolveTableName(id: string): string {
  const t = getTableById(id);
  if (!t) throw new Error(`Unknown table: ${id}`);
  return t.tableName ?? t.id;
}

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
  if (!token) throw new Error("Unauthorized");
  const res = await fetch(`/api/${tableId}`, { headers: headers(token) });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await safeJson(res)).error);
  return res.json();
}

export async function apiInsert(tableId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  const res = await fetch(`/api/${tableId}`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await safeJson(res)).error);
  return res.json();
}

export async function apiUpdate(tableId: string, id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  const res = await fetch(`/api/${tableId}/${id}`, {
    method: "PUT",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await safeJson(res)).error);
  return res.json();
}

export async function apiRemove(tableId: string, id: number): Promise<void> {
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  const res = await fetch(`/api/${tableId}/${id}`, { method: "DELETE", headers: headers(token) });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await safeJson(res)).error);
}

export async function apiSeed(tableId: string): Promise<Record<string, unknown>[]> {
  const token = await getToken();
  if (!token) throw new Error("Unauthorized");
  const res = await fetch(`/api/${tableId}/seed`, {
    method: "POST",
    headers: headers(token),
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error((await safeJson(res)).error);
  return res.json();
}
