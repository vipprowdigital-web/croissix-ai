// mobile_app\components\auth\GuestGuard.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}