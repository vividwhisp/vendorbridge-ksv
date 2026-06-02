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
  const [email, setEmail] = useState(mode === "login" ? "" : "");
  const [pass, setPass] = useState(mode === "login" ? "" : "");
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
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 14, padding: 28, width: "100%", maxWidth: 320 }}>
        <p style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", marginBottom: 14 }}>app/{mode}/page.tsx</p>
        <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 20, fontFamily: "Georgia,serif" }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#475569", fontSize: 11, display: "block", marginBottom: 4 }}>EMAIL</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, padding: "9px 11px", color: "white", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#475569", fontSize: 11, display: "block", marginBottom: 4 }}>PASSWORD</label>
          <input type="password" value={pass} onChange={(event) => setPass(event.target.value)} style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, padding: "9px 11px", color: "white", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
        </div>
        {err && <p style={{ color: "#f87171", fontSize: 12, marginBottom: 8 }}>Error: {err}</p>}
        <button onClick={submit} disabled={busy} style={{ width: "100%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 9, padding: 11, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {busy ? (
            <>
              <Spin />
              <span>Processing...</span>
            </>
          ) : mode === "login" ? "Log In" : "Sign Up"}
        </button>
        <p style={{ color: "#475569", fontSize: 12, textAlign: "center", marginTop: 14 }}>
          {mode === "login" ? "No account? " : "Have one? "}
          <span onClick={() => go(mode === "login" ? "signup" : "login")} style={{ color: "#818cf8", cursor: "pointer" }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </span>
        </p>
        <p onClick={() => go("landing")} style={{ color: "#334155", fontSize: 11, textAlign: "center", marginTop: 6, cursor: "pointer" }}>
          &lt;- back
        </p>
      </div>
    </div>
  );
}
