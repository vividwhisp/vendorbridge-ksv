"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "../lib/supabase-client";
import Navbar from "../components/navbar";
import { RoleBadge } from "../components/role";
import type { User } from "../types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSupabase()
      .auth.getUser()
      .then(async ({ data, error }) => {
        if (error || !data.user) { router.push("/login"); return; }
        const { data: me } = await fetch("/api/me", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null) ?? {};
        if (cancelled) return;
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          role: me?.role,
        });
        setChecking(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-4 sm:px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="text-fg text-2xl font-medium mb-10">Profile</h1>

      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 animate-fadeInUp">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-accent text-bg flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-fg text-lg font-medium">{user.email.split("@")[0]}</p>
            <p className="text-muted text-sm">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-border pt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">User ID</span>
            <code className="text-fg text-xs bg-bg border border-border rounded px-2 py-0.5 font-mono truncate max-w-[200px]">{user.id}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Email</span>
            <span className="text-fg">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Role</span>
            {user.role ? <RoleBadge role={user.role} /> : <span className="text-fg">—</span>}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard" className="border border-border text-muted hover:text-fg rounded-lg px-4 py-2 text-sm transition-colors">
            Dashboard
          </Link>
          <Link href="/settings" className="border border-border text-muted hover:text-fg rounded-lg px-4 py-2 text-sm transition-colors">
            Settings
          </Link>
          <Link href="/" className="border border-border text-muted hover:text-fg rounded-lg px-4 py-2 text-sm transition-colors">
            Home
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
