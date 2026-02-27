"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-secondary dark:text-ink-100 dark:placeholder:text-ink-500",
  {
    variants: {
      error: {
        true: "border-error focus-visible:ring-error",
        false: "border-ink-300 dark:border-ink-600",
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ error, className }))}
        ref={ref}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
export type { TextareaProps };
