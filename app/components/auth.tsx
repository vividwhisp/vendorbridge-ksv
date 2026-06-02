"use client";

import { useState } from "react";
import { db } from "../lib/supabase-db";
import type { AuthMode, LogFn, PageView, User } from "../types";
import Spin from "./spin";

type AuthProps = {
  mode: AuthMode;
  go: (page: PageView) => void;
  onAuth: (user: User) => void;
  log: LogFn;
};

export default function Auth({ mode, go, onAuth, log }: AuthProps) {
  const [email, setEmail] = useState(mode === "login" ? "kori@dev.com" : "");
  const [pass, setPass] = useState(mode === "login" ? "1234" : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    log("REACT", `supabase.auth.${mode === "login" ? "signInWithPassword" : "signUp"}()`);
    log("AUTH", `Processing ${mode} for ${email}...`);

    const { user, error } = await (mode === "login" ? db.signIn(email, pass) : db.signUp(email, pass));

    if (error || !user) {
      log("AUTH", `Error: ${error}`, false, true);
      setErr(error ?? "Authentication failed");
    } else {
      log("AUTH", "JWT issued, session stored", true);
      log("REACT", "router.push('/dashboard')", true);
      onAuth(user);
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
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
          <span onClick={() => go(mode === "login" ? "signup" : "login")} className="text-accent hover:text-accent-hover cursor-pointer transition-colors">
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </p>
        <p onClick={() => go("landing")} className="text-muted text-[11px] text-center mt-3 cursor-pointer hover:text-subtle transition-colors">
          &larr; back
        </p>
      </div>
    </div>
  );
}
