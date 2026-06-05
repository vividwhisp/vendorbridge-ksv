"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabase-client";
import { useToast } from "../lib/toast-context";
import { appConfig } from "../lib/config";
import { hasWorkflow } from "../lib/workflow";
import { useUserRole } from "../lib/role-context";
import { RoleBadge } from "../components/role";
import Navbar from "../components/navbar";

export default function AccountPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { role } = useUserRole();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSupabase()
      .auth.getUser()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data.user) {
          router.push("/login");
          return;
        }
        setEmail(data.user.email ?? "");
        setChecking(false);
      });
    return () => { cancelled = true; };
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
        <h1 className="text-fg text-2xl font-medium mb-1">Account</h1>
        <p className="text-muted text-sm mb-10">Your profile and app config.</p>

        <div className="space-y-6 animate-fadeInUp">
          <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
            <h2 className="text-fg text-base font-medium mb-5">Profile</h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-accent text-bg flex items-center justify-center text-lg font-semibold">
                {(email ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-fg text-base font-medium">{(email ?? "").split("@")[0]}</p>
                <p className="text-muted text-xs">{email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Role</span>
              {role ? <RoleBadge role={role} /> : <span className="text-fg">—</span>}
            </div>
            <div className="border-t border-border mt-5 pt-5">
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="border border-border text-muted hover:text-danger hover:border-danger rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          </section>

          <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
            <h2 className="text-fg text-base font-medium mb-1">App config</h2>
            <p className="text-muted text-xs mb-5">Read from <code className="text-accent">app/lib/config.ts</code>.</p>
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
                <dt className="text-muted">Workflow</dt>
                <dd className="text-fg">
                  {hasWorkflow(appConfig.tables[0])
                    ? (appConfig.tables[0].workflow ?? []).join(" → ")
                    : "none"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Accent</dt>
                <dd className="text-fg capitalize">{appConfig.accent}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
