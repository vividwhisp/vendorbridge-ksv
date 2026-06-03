"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabase-client";
import type { User } from "../types";
import DashboardView from "../components/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data, error }) => {
        if (error || !data.user) {
          router.push("/login");
        } else {
          setUser({ id: data.user.id, email: data.user.email ?? "" });
          setChecking(false);
        }
      });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <DashboardView />;
}
