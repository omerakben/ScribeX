"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-surface text-ink-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-secondary dark:text-ink-100 dark:placeholder:text-ink-500",
  {
    variants: {
      inputSize: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3 text-sm",
      },
      error: {
        true: "border-error focus-visible:ring-error",
        false: "border-ink-300 dark:border-ink-600",
      },
    },
    defaultVariants: {
      inputSize: "md",
      error: false,
    },
  }
);

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, error, className }))}
        ref={ref}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
export type { InputProps };
