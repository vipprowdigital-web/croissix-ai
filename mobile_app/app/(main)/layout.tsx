// mobile_app\app\(main)\layout.tsx

"use client";

// mobile_app/app/(main)/layout.tsx
// AuthGuard is replaced by SubscriptionGuard which handles BOTH
// auth check AND subscription check in one pass.

import Footer from "@/components/footer";
import { MobileNavbar } from "@/components/mobile_navbar";
import { DesktopSidebar } from "@/components/desktop_sidebar";
import { DesktopTopbar } from "@/components/desktop_topbar";
import SubscriptionGuard from "@/components/auth/Subscriptionguard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionGuard>
      <div className="relative flex min-h-screen">
        {/* Desktop sidebar — fixed left, hidden on mobile */}
        <DesktopSidebar />

        {/* Mobile top navbar — fixed top, hidden on desktop */}
        <MobileNavbar />

        {/* Main content column */}
        <div className="flex flex-col flex-1 min-h-screen w-full md:ml-[220px] lg:ml-[240px]">
          {/* Desktop topbar — sticky, hidden on mobile */}
          <DesktopTopbar />

          {/*
            pt-14  → clears fixed MobileNavbar on mobile
            pb-24  → clears floating tab bar on mobile
            md:pt-0, md:pb-6 → desktop overrides (topbar is sticky, no bottom tab)
            flex flex-col flex-1 min-h-0 → full-height children work correctly
          */}
          <main className="flex flex-col flex-1 min-h-0 pt-14 pb-24 px-4 md:pt-0 md:pb-6 md:px-6 lg:px-8">
            <div className="flex flex-col flex-1 min-h-0 w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom tab bar — hidden on desktop */}
        <Footer />
      </div>
    </SubscriptionGuard>
  );
}
