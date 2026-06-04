import { getSupabase } from "./supabase-client";

export const STORAGE = {
  bucket: "uploads",
  maxSizeMB: 10,
  accept: {
    image: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
    pdf: ["application/pdf"],
    document: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
      "text/markdown",
    ],
  },
} as const;

export const ACCEPT_STRING = [
  ...STORAGE.accept.image,
  ...STORAGE.accept.pdf,
  ...STORAGE.accept.document,
].join(",");

export type FileCategory = "image" | "pdf" | "document" | "unknown";

export function getFileCategory(mime: string): FileCategory {
  if ((STORAGE.accept.image as readonly string[]).includes(mime)) return "image";
  if ((STORAGE.accept.pdf as readonly string[]).includes(mime)) return "pdf";
  if ((STORAGE.accept.document as readonly string[]).includes(mime)) return "document";
  return "unknown";
}

export type ValidationResult =
  | { ok: true; category: FileCategory }
  | { ok: false; reason: string };

export function validateFile(file: File): ValidationResult {
  const maxBytes = STORAGE.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, reason: `File too large (max ${STORAGE.maxSizeMB}MB)` };
  }
  const category = getFileCategory(file.type);
  if (category === "unknown") {
    return { ok: false, reason: `Unsupported type: ${file.type || "unknown"}` };
  }
  return { ok: true, category };
}

function makePath(userId: string, tableId: string, file: File): string {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now();
  return `${userId}/${tableId}/${stamp}-${safeName}`;
}

export type UploadResult =
  | { ok: true; url: string; path: string; category: FileCategory }
  | { ok: false; error: string };

export async function uploadFile(
  file: File,
  opts: { tableId: string; folder?: string },
): Promise<UploadResult> {
  const check = validateFile(file);
  if (!check.ok) return { ok: false, error: check.reason };

  const { data: session } = await getSupabase().auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in" };

  const basePath = makePath(userId, opts.tableId, file);
  const fullPath = opts.folder ? `${opts.folder}/${basePath}` : basePath;

  const { error } = await getSupabase().storage
    .from(STORAGE.bucket)
    .upload(fullPath, file, { upsert: false, contentType: file.type });

  if (error) return { ok: false, error: error.message };

  const { data: pub } = getSupabase().storage.from(STORAGE.bucket).getPublicUrl(fullPath);
  return { ok: true, url: pub.publicUrl, path: fullPath, category: check.category };
}

export async function deleteFile(path: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabase().storage.from(STORAGE.bucket).remove([path]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE.bucket}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.slice(idx + marker.length);
}

export function isImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
}
