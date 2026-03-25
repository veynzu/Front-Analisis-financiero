import { Dashboard } from "@/components/organisms/Dashboard";
import { SiteHeader } from "@/components/organisms/SiteHeader";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6">
        <Dashboard />
      </main>
    </div>
  );
}
