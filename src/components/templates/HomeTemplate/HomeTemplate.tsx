import { SiteHeader } from "@/components/organisms/SiteHeader";
import { ReactNode } from "react";

type HomeTemplateProps = {
  children: ReactNode;
};

export function HomeTemplate({ children }: HomeTemplateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6">{children}</main>
    </div>
  );
}
