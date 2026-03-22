import Link from "next/link";
import { ReactNode } from "react";

type BrandLinkProps = {
  href?: string;
  children: ReactNode;
};

export function BrandLink({ href = "/", children }: BrandLinkProps) {
  return (
    <Link
      href={href}
      className="text-base font-semibold text-zinc-950 no-underline hover:opacity-80 dark:text-zinc-50"
    >
      {children}
    </Link>
  );
}
