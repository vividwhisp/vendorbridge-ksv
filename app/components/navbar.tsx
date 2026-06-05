"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabase-client";
import { db } from "../lib/supabase-db";
import { useToast } from "../lib/toast-context";
import { appConfig } from "../lib/config";
import { RoleBadge } from "./role";
import type { User } from "../types";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;
    getSupabase().auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? "" });
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  async function logout() {
    await db.signOut();
    showToast("Signed out", "info");
    router.push("/");
  }

  const linkClass = "text-muted hover:text-fg text-sm transition-colors px-2.5 py-1.5 rounded-md hover:bg-border/40";

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 text-fg font-semibold text-sm mr-2 hover:opacity-80 transition-opacity"
          title="Home"
        >
          <span className="text-accent">&#9632;</span>
          {appConfig.name}
        </Link>

        {!loading && user ? (
          <nav className="hidden sm:flex items-center gap-0.5">
            <Link href="/dashboard" className={linkClass}>{appConfig.entity.title}</Link>
            <Link href="/account" className={linkClass}>Account</Link>
          </nav>
        ) : !loading ? (
          <nav className="hidden sm:flex items-center gap-5">
            <Link href="/#features" className="text-muted hover:text-fg text-sm transition-colors">Features</Link>
            <Link href="/#how" className="text-muted hover:text-fg text-sm transition-colors">How it works</Link>
            <Link href="/#usecases" className="text-muted hover:text-fg text-sm transition-colors">Use cases</Link>
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {!loading && user ? (
            <>
              <span className="text-muted text-xs hidden md:inline mr-1">{user.email}</span>
              {user.role && <RoleBadge role={user.role} size="xs" />}
              <button
                onClick={logout}
                className="text-xs text-muted hover:text-danger border border-border hover:border-danger rounded-md px-2.5 py-1.5 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-fg transition-colors hidden sm:inline">
                Log In
              </Link>
              <Link href="/signup" className="text-sm text-bg font-medium bg-accent hover:bg-accent-hover rounded-md px-3 py-1.5 transition-colors">
                Sign Up
              </Link>
            </>
          ) : null}

          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden text-fg text-lg ml-1">
            &#9776;
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-surface animate-fadeIn">
          <div className="max-w-6xl mx-auto flex flex-col px-4 py-3 gap-1">
            {!loading && user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">{appConfig.entity.title}</Link>
                <Link href="/account" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">Account</Link>
                <div className="border-t border-border my-1" />
                <span className="text-muted text-xs py-1">{user.email}</span>
                <button onClick={() => { setMenuOpen(false); logout(); }} className="text-left text-danger text-sm py-2">Sign out</button>
              </>
            ) : !loading ? (
              <>
                <Link href="/#features" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">Features</Link>
                <Link href="/#how" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">How it works</Link>
                <Link href="/#usecases" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">Use cases</Link>
                <div className="border-t border-border my-1" />
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-muted hover:text-fg text-sm py-2">Log In</Link>
                <Link href="/signup" onClick={() => setMenuOpen(false)} className="text-accent text-sm py-2">Sign Up</Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
