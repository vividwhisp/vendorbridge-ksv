"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabase-client";
import { useToast } from "../lib/toast-context";
import { appConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import Navbar from "../components/navbar";
import type { User } from "../types";

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data, error }) => {
        if (error || !data.user) { router.push("/login"); }
        else { setUser({ id: data.user.id, email: data.user.email ?? "" }); setChecking(false); }
      });
  }, [router]);

  async function handleSignOut() {
    setBusy(true);
    await getSupabase().auth.signOut();
    showToast("Signed out", "info");
    router.push("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 sm:px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="text-fg text-2xl font-medium mb-1">Settings</h1>
      <p className="text-muted text-sm mb-10">Manage your account and preferences.</p>

      <div className="space-y-6 animate-fadeInUp">
        <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
          <h2 className="text-fg text-base font-medium mb-1">App Info</h2>
          <p className="text-muted text-xs mb-5">These are read from <code className="text-accent">app/lib/config.ts</code>.</p>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">App name</dt>
              <dd className="text-fg">{appConfig.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Entity</dt>
              <dd className="text-fg">{appConfig.entity.title}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Fields</dt>
              <dd className="text-fg">{appConfig.fields.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Workflow states</dt>
              <dd className="text-fg">
                {hasWorkflow(appConfig.tables[0])
                  ? (appConfig.tables[0].workflow ?? []).join(" → ")
                  : "none"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Theme accent</dt>
              <dd className="text-fg capitalize">{appConfig.accent}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
          <h2 className="text-fg text-base font-medium mb-1">Account</h2>
          <p className="text-muted text-xs mb-5">Signed in as {user?.email}</p>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="border border-border text-muted hover:text-danger hover:border-danger rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            Sign out
          </button>
        </section>

        <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
          <h2 className="text-fg text-base font-medium mb-1">Keyboard shortcuts</h2>
          <p className="text-muted text-xs mb-5">Quick access on the dashboard.</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">Open command palette</span>
              <kbd className="text-[10px] font-mono bg-bg border border-border rounded px-1.5 py-0.5">⌘ K</kbd>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Toggle AI agent</span>
              <span className="text-[10px] text-muted">Click the AI button</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Toggle dev log</span>
              <span className="text-[10px] text-muted">Click the Logs button</span>
            </li>
          </ul>
        </section>
      </div>
      </div>
    </div>
  );
}
