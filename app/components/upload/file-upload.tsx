"use client";

import { useRef, useState, useTransition } from "react";
import { useToast } from "../../lib/toast-context";
import { useLog } from "../../lib/log-context";
import { ACCEPT_STRING, uploadFile, isImageUrl, type FileCategory } from "../../lib/storage";
import Spin from "../spin";

type Props = {
  value?: string;
  onChange: (url: string | undefined) => void;
  tableId: string;
  label?: string;
  disabled?: boolean;
};

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "done"; url: string; category: FileCategory }
  | { kind: "error"; message: string };

export function FileUpload({ value, onChange, tableId, label = "Upload", disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const { log } = useLog();
  const current = state.kind === "done" ? state.url : value;
  const busy = isPending || state.kind === "uploading";

  function openPicker() {
    if (busy || disabled) return;
    inputRef.current?.click();
  }

  function handleFile(file: File) {
    setState({ kind: "uploading" });
    log("STORAGE", `Uploading ${file.name} (${(file.size / 1024).toFixed(1)}KB) -> ${tableId}`);
    startTransition(async () => {
      const res = await uploadFile(file, { tableId });
      if (!res.ok) {
        setState({ kind: "error", message: res.error });
        log("STORAGE", `Upload failed: ${res.error}`, false, true);
        showToast(res.error, "error");
        return;
      }
      setState({ kind: "done", url: res.url, category: res.category });
      log("STORAGE", `Uploaded: ${res.path}`, true);
      onChange(res.url);
    });
  }

  function clear() {
    if (busy) return;
    setState({ kind: "idle" });
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={busy || disabled}
        className="hidden"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy || disabled}
          className="bg-bg border border-border text-fg hover:border-muted rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? (
            <>
              <Spin s={10} />
              <span>Uploading...</span>
            </>
          ) : current ? (
            <span>Replace</span>
          ) : (
            <span>{label}</span>
          )}
        </button>
        {current && !busy && (
          <button
            type="button"
            onClick={clear}
            className="text-muted hover:text-danger text-xs transition-colors"
          >
            Remove
          </button>
        )}
        {state.kind === "error" && (
          <span className="text-danger text-xs">{state.message}</span>
        )}
      </div>
      {!current && !busy && (
        <p className="text-muted text-[10px]">
          Images, PDFs, or docs up to 10MB
        </p>
      )}
      {isImageUrl(current) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt="preview"
          className="max-h-32 max-w-full rounded-md border border-border object-contain bg-bg"
        />
      ) : current ? (
        <a
          href={current}
          target="_blank"
          rel="noreferrer"
          className="text-accent text-xs hover:underline truncate max-w-full"
        >
          {current.split("/").pop()}
        </a>
      ) : null}
    </div>
  );
}
