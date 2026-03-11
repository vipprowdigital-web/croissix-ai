// mobile_app\components\auth\GuestGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/token";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (token) {
      router.replace("/dashboard");
      return;
    }

    setChecking(false);
  }, [router]);

  if (checking) return null;

  return <>{children}</>;
}
