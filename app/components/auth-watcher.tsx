"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthWatcher({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    function onUnauthorized() {
      router.replace("/login?from=expired");
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [router]);

  return <>{children}</>;
}
