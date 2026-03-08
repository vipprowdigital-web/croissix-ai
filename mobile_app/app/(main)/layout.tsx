import Footer from "@/components/footer";
import { MobileNavbar } from "@/components/mobile_navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <MobileNavbar />

      <main className="container mx-auto max-w-7xl flex-grow">{children}</main>

      <Footer />
    </div>
  );
}
