import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type NavLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
};

export function NavLink({ children, className = "", ...props }: NavLinkProps) {
  return (
    <Link
      className={`text-sm font-medium text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white ${className}`.trim()}
      {...props}
    >
      {children}
    </Link>
  );
}
