import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", type = "button", ...props }, ref) {
    const base =
      "inline-flex h-11 min-w-[140px] items-center justify-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:pointer-events-none disabled:opacity-50";
    const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
      ghost:
        "border border-zinc-300 bg-transparent text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900",
    };
    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${styles[variant]} ${className}`.trim()}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
