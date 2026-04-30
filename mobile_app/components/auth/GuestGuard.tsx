// mobile_app\components\auth\GuestGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getToken } from "@/lib/token";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (token) {
      // router.replace("/dashboard");
      // If already logged in and has callback, go straight to home with callback
      const callback = searchParams.get("callback");
      if (callback) {
        router.replace(`/?callback=${encodeURIComponent(callback)}`);
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) return null;

  return <>{children}</>;
}
