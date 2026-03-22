import { HTMLAttributes } from "react";

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span";
};

export function Text({ as: Comp = "p", className = "", ...props }: TextProps) {
  return (
    <Comp
      className={`text-lg leading-8 text-zinc-600 dark:text-zinc-400 ${className}`.trim()}
      {...props}
    />
  );
}
