import { BrandLink } from "@/components/molecules/BrandLink";
import { NavLink } from "@/components/molecules/NavLink";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <BrandLink>Analisis financiero</BrandLink>
      <nav className="flex gap-6" aria-label="Principal">
        <NavLink href="/">Inicio</NavLink>
      </nav>
    </header>
  );
}
