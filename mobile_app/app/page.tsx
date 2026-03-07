import CibilScore from "@/components/cards/Cibilscore";

export default function Home() {
  return (
    <section className="flex flex-col items-center pt-18 gap-4 bg-[#0d1421] h-screen">
      {/* // Custom values */}
      <CibilScore score={300} change={12} min={0} max={1000} />
    </section>
  );
}
