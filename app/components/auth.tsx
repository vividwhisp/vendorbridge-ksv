"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../lib/supabase-db";
import { useToast } from "../lib/toast-context";
import type { AuthMode } from "../types";
import Navbar from "./navbar";
import Spin from "./spin";

type AuthProps = {
  mode: AuthMode;
};

export default function Auth({ mode }: AuthProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState(mode === "login" ? "kori@dev.com" : "");
  const [pass, setPass] = useState(mode === "login" ? "1234" : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");

    try {
      const { user, error } = await (mode === "login" ? db.signIn(email, pass) : db.signUp(email, pass));

      if (error || !user) {
        setErr(error ?? "Authentication failed");
        showToast(error ?? "Authentication failed", "error");
      } else {
        showToast(mode === "login" ? "Welcome back!" : "Account created!", "success");
        router.push("/dashboard");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setErr(message);
      showToast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="border border-border rounded-2xl p-8 bg-surface">
            <p className="text-muted text-[10px] font-mono mb-4">app/{mode}/page.tsx</p>
            <h2 className="text-fg text-2xl font-medium mb-8">{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <div className="mb-4">
              <label className="text-muted text-xs block mb-1.5">EMAIL</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-fg text-sm outline-none focus:border-muted transition-colors" />
            </div>
            <div className="mb-4">
              <label className="text-muted text-xs block mb-1.5">PASSWORD</label>
              <input type="password" value={pass} onChange={(event) => setPass(event.target.value)} className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-fg text-sm outline-none focus:border-muted transition-colors" />
            </div>
            {err && <p className="text-danger text-xs mb-3">{err}</p>}
            <button onClick={submit} disabled={busy} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg text-sm font-semibold rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2">
              {busy ? (
                <>
                  <Spin />
                  <span>Processing...</span>
                </>
              ) : mode === "login" ? "Log In" : "Sign Up"}
            </button>
          </div>
          <p className="text-muted text-xs text-center mt-6">
            {mode === "login" ? "No account? " : "Have one? "}
            <Link href={mode === "login" ? "/signup" : "/login"} className="text-accent hover:text-accent-hover cursor-pointer transition-colors">
              {mode === "login" ? "Sign up" : "Log in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
