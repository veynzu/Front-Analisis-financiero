import { HTMLAttributes } from "react";

type Level = 1 | 2 | 3;

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: Level;
};

const tag: Record<Level, "h1" | "h2" | "h3"> = {
  1: "h1",
  2: "h2",
  3: "h3",
};

const size: Record<Level, string> = {
  1: "text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50",
  2: "text-xl font-semibold text-black dark:text-zinc-50",
  3: "text-lg font-medium text-black dark:text-zinc-50",
};

export function Heading({ level = 1, className = "", ...props }: HeadingProps) {
  const Comp = tag[level];
  return <Comp className={`${size[level]} ${className}`.trim()} {...props} />;
}
