// mobile_app\app\(main)\layout.tsx

"use client";

import Footer from "@/components/footer";
import { MobileNavbar } from "@/components/mobile_navbar";
import { DesktopSidebar } from "@/components/desktop_sidebar";
import { DesktopTopbar } from "@/components/desktop_topbar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative flex min-h-screen">
        {/* ── Desktop sidebar — fixed left, hidden on mobile ── */}
        <DesktopSidebar />

        {/* ── Mobile top navbar — hidden on desktop ── */}
        <MobileNavbar />

        {/* ── Main content area ── */}
        <div
          className={`
            flex flex-col flex-1 min-h-screen w-full
            md:ml-[220px] lg:ml-[240px]
          `}
        >
          {/* Desktop topbar — sticky, hidden on mobile */}
          <DesktopTopbar />

          {/* Page content */}
          <main className="flex-grow px-4 py-14 md:py-0 md:px-6 lg:px-8 pb-28 md:pb-8">
            <div className="mx-auto w-full">{children}</div>
          </main>
        </div>

        {/* ── Mobile bottom tab bar — hidden on desktop ── */}
        <Footer />
      </div>
    </AuthGuard>
  );
}
