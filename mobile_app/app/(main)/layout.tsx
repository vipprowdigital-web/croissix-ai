// mobile_app\app\(main)\layout.tsx

"use client";

import Footer from "@/components/footer";
import { MobileNavbar } from "@/components/mobile_navbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex flex-col min-h-screen">
        <MobileNavbar />

        <main className="container mx-auto max-w-7xl flex-grow">
          {children}
        </main>

        <Footer />
      </div>
    </AuthGuard>
  );
}
