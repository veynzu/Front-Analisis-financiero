import { HeroSection } from "@/components/organisms/HeroSection";
import { HomeTemplate } from "@/components/templates/HomeTemplate";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <HomeTemplate>
        <HeroSection />
      </HomeTemplate>
    </div>
  );
}
