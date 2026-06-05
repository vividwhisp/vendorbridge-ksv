import { getSupabase } from "./supabase-client";

export const STORAGE = {
  bucket: "uploads",
  maxSizeMB: 10,
  accept: {
    image: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
    pdf: ["application/pdf"],
  },
} as const;

export const ACCEPT_STRING = [...STORAGE.accept.image, ...STORAGE.accept.pdf].join(",");

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

function makePath(userId: string, tableId: string, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now();
  return `${userId}/${tableId}/${stamp}-${safeName}`;
}

export async function uploadFile(
  file: File,
  opts: { tableId: string; folder?: string },
): Promise<UploadResult> {
  const maxBytes = STORAGE.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${STORAGE.maxSizeMB}MB)` };
  }

  const allowed = [...STORAGE.accept.image, ...STORAGE.accept.pdf] as readonly string[];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: `Unsupported type: ${file.type || "unknown"}` };
  }

  const { data: session } = await getSupabase().auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };

  const fullPath = makePath(userId, opts.tableId, file);

  const { error } = await getSupabase().storage
    .from(STORAGE.bucket)
    .upload(fullPath, file, { upsert: false, contentType: file.type });

  if (error) return { ok: false, error: error.message };

  const { data: pub } = getSupabase().storage.from(STORAGE.bucket).getPublicUrl(fullPath);
  return { ok: true, url: pub.publicUrl, path: fullPath };
}

export function isImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
}
