// mobile_app\components\auth\AuthGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/token";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      // router.replace("/login");
      // Carry the callback param forward to login
      const callback = searchParams.get("callback");
      if (callback) {
        router.replace(`/login?callback=${encodeURIComponent(callback)}`);
      } else {
        router.replace("/login");
      }
      return;
    }

    setChecking(false);
  }, [router, searchParams]);

  if (checking) return null;

  return <>{children}</>;
}
